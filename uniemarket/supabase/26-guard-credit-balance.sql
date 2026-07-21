-- ============================================================================
-- 26-guard-credit-balance.sql — Chặn khách tự sửa số dư ví
-- ----------------------------------------------------------------------------
-- Policy "profiles: self or admin update" cho khách sửa hồ sơ CỦA MÌNH — nghĩa là
-- khách có thể tự đặt credit_balance tuỳ ý. Trigger này chặn mọi thay đổi
-- credit_balance trừ khi: là admin, HOẶC đi qua RPC SECURITY DEFINER (đặt cờ
-- app.bypass_credit_guard='1'). Chạy 1 lần trong Supabase SQL Editor (sau 25).
-- ============================================================================

create or replace function public.guard_credit_balance()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.credit_balance is distinct from old.credit_balance
     and auth.uid() is not null
     and not public.is_admin()
     and coalesce(current_setting('app.bypass_credit_guard', true), '') is distinct from '1'
  then
    raise exception 'Bạn không thể tự thay đổi số dư ví.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_credit on public.profiles;
create trigger profiles_guard_credit
  before update on public.profiles
  for each row execute function public.guard_credit_balance();

-- Cập nhật 2 RPC để đặt cờ bypass trước khi đổi số dư.
create or replace function public.admin_adjust_credit(p_email text, p_amount bigint, p_note text default null)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid; v_new bigint;
begin
  if not public.is_admin() then raise exception 'Chỉ admin mới được nạp/điều chỉnh số dư.'; end if;
  if p_amount is null or p_amount = 0 then raise exception 'Số tiền không hợp lệ.'; end if;
  select u.id into v_uid from auth.users u where lower(u.email) = lower(btrim(p_email));
  if v_uid is null then raise exception 'Không tìm thấy tài khoản với email này.'; end if;

  perform set_config('app.bypass_credit_guard', '1', true);
  update public.profiles set credit_balance = credit_balance + p_amount
  where id = v_uid returning credit_balance into v_new;
  if v_new < 0 then raise exception 'Số dư không đủ để trừ (sẽ âm).'; end if;

  insert into public.credit_transactions (user_id, amount, type, note, balance_after)
  values (v_uid, p_amount, case when p_amount > 0 then 'topup' else 'adjust' end,
          nullif(btrim(coalesce(p_note,'')),''), v_new);

  perform public.notify_user(v_uid, 'credit',
    case when p_amount > 0 then 'Số dư của bạn được cộng ' || p_amount || ' VNĐ'
         else 'Số dư của bạn bị điều chỉnh ' || p_amount || ' VNĐ' end,
    'Số dư hiện tại: ' || v_new || ' VNĐ.', '/dashboard');
  return v_new;
end;
$$;

create or replace function public.pay_order_with_credit(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_order public.orders;
  v_new bigint;
  v_instant boolean := false;
  v_content text;
begin
  if v_uid is null then raise exception 'Bạn cần đăng nhập.'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.user_id <> v_uid then raise exception 'Đây không phải đơn của bạn.'; end if;
  if v_order.status <> 'pending_payment' then raise exception 'Đơn không ở trạng thái chờ thanh toán.'; end if;

  perform set_config('app.bypass_credit_guard', '1', true);
  update public.profiles set credit_balance = credit_balance - v_order.total
  where id = v_uid returning credit_balance into v_new;
  if v_new < 0 then raise exception 'Số dư không đủ để thanh toán đơn này.'; end if;

  insert into public.credit_transactions (user_id, amount, type, note, balance_after, order_id)
  values (v_uid, -v_order.total, 'spend', 'Thanh toán đơn ' || v_order.order_code, v_new, v_order.id);

  update public.orders
  set status = 'paid', payment_ref = 'credit', payment_gateway = 'credit',
      paid_confirmed_at = now(), paid_confirmed_by = v_uid
  where id = p_order_id returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, v_uid, 'payment_confirmed', 'Thanh toán bằng số dư ví.', jsonb_build_object('credit', true));

  select p.instant_delivery, ps.content into v_instant, v_content
  from public.order_items oi
  join public.products p on p.id = oi.product_id
  left join public.product_secrets ps on ps.product_id = p.id
  where oi.order_id = p_order_id limit 1;

  if coalesce(v_instant, false) then
    update public.orders
    set status = 'completed', delivered_at = now(),
        delivery_content = v_content, delivery_note = 'Giao tự động (instant delivery).'
    where id = p_order_id returning * into v_order;
    insert into public.order_events (order_id, actor_id, event_type, note, meta)
    values (p_order_id, v_uid, 'status_changed', 'Giao ngay — đơn đã hoàn tất tự động.',
            jsonb_build_object('instant', true));
  else
    perform public.notify_claimable_ctvs(p_order_id);
  end if;

  return v_order;
end;
$$;

-- Xong.
