-- ============================================================================
-- 33-wallet-ux.sql — UX ví: hủy yêu cầu nạp/rút, giới hạn min-max, báo đã CK
-- ----------------------------------------------------------------------------
-- • cancel_topup_request / cancel_withdrawal_request: tự hủy khi đang pending
--   (rút thì hoàn lại tiền đang giữ).
-- • Giới hạn nạp/rút: topup_min, topup_max, withdraw_min, withdraw_max
--   (app_settings, 0/null = không giới hạn) — enforce trong request_*.
-- • Khách bấm "Tôi đã chuyển khoản": orders.payment_sent_at + mark_payment_sent.
-- Chạy 1 lần trong Supabase SQL Editor (sau 32).
-- ============================================================================

-- 1) Whitelist đọc công khai thêm các key giới hạn -----------------------------
drop policy if exists "app_settings: public keys read" on public.app_settings;
create policy "app_settings: public keys read" on public.app_settings
  for select to anon, authenticated
  using (
    key in ('bank_name','bank_account','bank_holder','momo_number','momo_qr_url','brand',
            'ctv_apply_open','role_permissions','order_commission_pct','withdrawal_commission_pct',
            'payout_methods','topup_min','topup_max','withdraw_min','withdraw_max')
    or public.is_admin()
  );

-- Helper: đọc giới hạn (bigint), null nếu chưa đặt hoặc <= 0.
create or replace function public.limit_amount(p_key text)
returns bigint language sql stable security definer set search_path = public as $$
  select case when v > 0 then v else null end
  from (
    select coalesce(nullif(btrim(value #>> '{}'), '')::bigint, 0) as v
    from public.app_settings where key = p_key
  ) s;
$$;

-- 2) request_topup: enforce min/max (giữ nguyên code + method từ mig 32) ------
create or replace function public.request_topup(
  p_amount bigint, p_method text default null, p_note text default null
)
returns public.topup_requests
language plpgsql security definer set search_path = public
as $$
declare v_req public.topup_requests; v_min bigint; v_max bigint;
begin
  if auth.uid() is null then raise exception 'Bạn cần đăng nhập.'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Số tiền không hợp lệ.'; end if;
  v_min := public.limit_amount('topup_min');
  v_max := public.limit_amount('topup_max');
  if v_min is not null and p_amount < v_min then
    raise exception 'Số tiền nạp tối thiểu là % VNĐ.', v_min;
  end if;
  if v_max is not null and p_amount > v_max then
    raise exception 'Số tiền nạp tối đa là % VNĐ.', v_max;
  end if;
  if exists (select 1 from public.topup_requests where user_id = auth.uid() and status = 'pending') then
    raise exception 'Bạn đang có 1 yêu cầu nạp chờ duyệt.';
  end if;
  insert into public.topup_requests (user_id, amount, method, note, code)
  values (auth.uid(), p_amount, nullif(btrim(coalesce(p_method,'')),''),
          nullif(btrim(coalesce(p_note,'')),''),
          'TP-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)))
  returning * into v_req;
  perform public.notify_admins('topup', 'Yêu cầu nạp ' || p_amount || ' VNĐ',
    'Mã ' || v_req.code || ' — có yêu cầu nạp tiền chờ duyệt.', '/work/wallet');
  return v_req;
end;
$$;

-- 3) request_withdrawal: enforce min/max (giữ nguyên logic mig 32) ------------
create or replace function public.request_withdrawal(
  p_amount bigint, p_method text default null, p_destination text default null, p_note text default null
)
returns public.withdrawal_requests
language plpgsql security definer set search_path = public
as $$
declare v_req public.withdrawal_requests; v_bal bigint; v_fee bigint; v_pct numeric;
        v_min bigint; v_max bigint;
begin
  if not public.is_staff() then raise exception 'Chỉ nhân viên (Seller/Manager/Admin) mới được rút tiền.'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Số tiền không hợp lệ.'; end if;
  v_min := public.limit_amount('withdraw_min');
  v_max := public.limit_amount('withdraw_max');
  if v_min is not null and p_amount < v_min then
    raise exception 'Số tiền rút tối thiểu là % VNĐ.', v_min;
  end if;
  if v_max is not null and p_amount > v_max then
    raise exception 'Số tiền rút tối đa là % VNĐ.', v_max;
  end if;
  if exists (select 1 from public.withdrawal_requests where user_id = auth.uid() and status = 'pending') then
    raise exception 'Bạn đang có 1 yêu cầu rút chờ duyệt.';
  end if;

  v_pct := public.commission_pct('withdrawal_commission_pct');
  v_fee := floor(p_amount * v_pct / 100);

  perform set_config('app.bypass_credit_guard', '1', true);
  update public.profiles set credit_balance = credit_balance - p_amount
  where id = auth.uid() returning credit_balance into v_bal;
  if v_bal < 0 then raise exception 'Số dư không đủ để rút.'; end if;

  insert into public.credit_transactions (user_id, amount, type, note, balance_after)
  values (auth.uid(), -p_amount, 'withdraw', 'Yêu cầu rút tiền (đang giữ)', v_bal);

  insert into public.withdrawal_requests (user_id, amount, fee, net, method, destination, note, code)
  values (auth.uid(), p_amount, v_fee, p_amount - v_fee,
          nullif(btrim(coalesce(p_method,'')),''), nullif(btrim(coalesce(p_destination,'')),''),
          nullif(btrim(coalesce(p_note,'')),''),
          'WD-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)))
  returning * into v_req;

  perform public.notify_admins('withdrawal', 'Yêu cầu rút ' || p_amount || ' VNĐ',
    'Mã ' || v_req.code || ' — có yêu cầu rút tiền chờ duyệt.', '/work/wallet');
  return v_req;
end;
$$;

-- 4) Tự hủy yêu cầu nạp đang chờ ----------------------------------------------
create or replace function public.cancel_topup_request()
returns void
language plpgsql security definer set search_path = public
as $$
declare v_req public.topup_requests;
begin
  select * into v_req from public.topup_requests
  where user_id = auth.uid() and status = 'pending'
  order by created_at desc limit 1 for update;
  if not found then raise exception 'Không có yêu cầu nạp nào đang chờ.'; end if;
  update public.topup_requests set status = 'cancelled', reviewed_at = now()
  where id = v_req.id;
end;
$$;
grant execute on function public.cancel_topup_request() to authenticated, service_role;

-- 5) Tự hủy yêu cầu rút đang chờ -> hoàn tiền đang giữ ------------------------
create or replace function public.cancel_withdrawal_request()
returns void
language plpgsql security definer set search_path = public
as $$
declare v_req public.withdrawal_requests; v_bal bigint;
begin
  select * into v_req from public.withdrawal_requests
  where user_id = auth.uid() and status = 'pending'
  order by created_at desc limit 1 for update;
  if not found then raise exception 'Không có yêu cầu rút nào đang chờ.'; end if;

  perform set_config('app.bypass_credit_guard', '1', true);
  update public.profiles set credit_balance = credit_balance + v_req.amount
  where id = v_req.user_id returning credit_balance into v_bal;
  insert into public.credit_transactions (user_id, amount, type, note, balance_after)
  values (v_req.user_id, v_req.amount, 'refund', 'Hoàn tiền do tự hủy yêu cầu rút', v_bal);

  update public.withdrawal_requests set status = 'cancelled', reviewed_at = now()
  where id = v_req.id;
end;
$$;
grant execute on function public.cancel_withdrawal_request() to authenticated, service_role;

-- 6) Khách báo "Tôi đã chuyển khoản" ------------------------------------------
alter table public.orders add column if not exists payment_sent_at timestamptz;

create or replace function public.mark_payment_sent(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.user_id <> auth.uid() then raise exception 'Bạn không có quyền với đơn này.'; end if;
  if v_order.status <> 'pending_payment' then
    raise exception 'Đơn không ở trạng thái chờ thanh toán.';
  end if;
  if v_order.payment_sent_at is not null then
    raise exception 'Bạn đã báo chuyển khoản cho đơn này rồi.';
  end if;

  update public.orders set payment_sent_at = now()
  where id = p_order_id returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, auth.uid(), 'note', 'Khách báo đã chuyển khoản.', null);
  perform public.notify_admins('order_paid',
    '💸 Khách báo đã CK đơn ' || v_order.order_code,
    'Kiểm tra tài khoản và xác nhận thanh toán.', '/work/orders/' || v_order.id);
  return v_order;
end;
$$;
grant execute on function public.mark_payment_sent(uuid) to authenticated, service_role;

-- Xong.
