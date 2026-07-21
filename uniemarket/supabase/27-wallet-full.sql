-- ============================================================================
-- 27-wallet-full.sql — Ví đầy đủ: nạp tự phục vụ, rút tiền (duyệt), hoa hồng
-- ----------------------------------------------------------------------------
-- - Khách tự yêu cầu NẠP -> admin duyệt -> cộng số dư.
-- - CTV/Manager/Admin yêu cầu RÚT -> admin duyệt -> tiền đã giữ, phí rút = %.
-- - CTV bán đơn hoàn tất -> nhận tiền đơn trừ hoa hồng đơn (%) vào ví.
-- - Hoa hồng đơn + hoa hồng rút cấu hình trong Settings.
-- Chạy 1 lần trong Supabase SQL Editor (sau 25 + 26).
-- ============================================================================

-- 0) Settings hoa hồng (mặc định 0%).
insert into public.app_settings (key, value) values ('order_commission_pct', '0'::jsonb) on conflict (key) do nothing;
insert into public.app_settings (key, value) values ('withdrawal_commission_pct', '0'::jsonb) on conflict (key) do nothing;

-- Cho seller đọc % hoa hồng để hiện bảng "bạn nhận được" (không nhạy cảm).
drop policy if exists "app_settings: public keys read" on public.app_settings;
create policy "app_settings: public keys read" on public.app_settings
  for select to anon, authenticated
  using (
    key in ('bank_name','bank_account','bank_holder','momo_number','momo_qr_url','brand','ctv_apply_open','role_permissions','order_commission_pct','withdrawal_commission_pct')
    or public.is_admin()
  );

-- Helper đọc % (0..100).
create or replace function public.commission_pct(p_key text)
returns numeric language sql stable security definer set search_path = public as $$
  select greatest(0, least(100, coalesce((select (value #>> '{}')::numeric from public.app_settings where key = p_key), 0)));
$$;

-- ============================================================================
-- 1) YÊU CẦU NẠP TIỀN (khách tự nạp -> admin duyệt)
-- ============================================================================
create table if not exists public.topup_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      bigint not null check (amount > 0),
  status      text not null default 'pending',   -- pending|approved|rejected
  note        text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);
alter table public.topup_requests enable row level security;
drop policy if exists "topup own or admin read" on public.topup_requests;
create policy "topup own or admin read" on public.topup_requests
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function public.request_topup(p_amount bigint, p_note text default null)
returns public.topup_requests
language plpgsql security definer set search_path = public
as $$
declare v_req public.topup_requests;
begin
  if auth.uid() is null then raise exception 'Bạn cần đăng nhập.'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Số tiền không hợp lệ.'; end if;
  if exists (select 1 from public.topup_requests where user_id = auth.uid() and status = 'pending') then
    raise exception 'Bạn đang có 1 yêu cầu nạp chờ duyệt.';
  end if;
  insert into public.topup_requests (user_id, amount, note)
  values (auth.uid(), p_amount, nullif(btrim(coalesce(p_note,'')),'')) returning * into v_req;
  perform public.notify_admins('topup', 'Yêu cầu nạp ' || p_amount || ' VNĐ',
    'Có yêu cầu nạp tiền chờ duyệt.', '/work/wallet');
  return v_req;
end;
$$;

create or replace function public.review_topup(p_id uuid, p_approve boolean)
returns public.topup_requests
language plpgsql security definer set search_path = public
as $$
declare v_req public.topup_requests; v_new bigint;
begin
  if not public.is_admin() then raise exception 'Chỉ admin mới duyệt nạp tiền.'; end if;
  select * into v_req from public.topup_requests where id = p_id for update;
  if not found then raise exception 'Không tìm thấy yêu cầu.'; end if;
  if v_req.status <> 'pending' then raise exception 'Yêu cầu đã được xử lý.'; end if;

  if p_approve then
    perform set_config('app.bypass_credit_guard', '1', true);
    update public.profiles set credit_balance = credit_balance + v_req.amount
    where id = v_req.user_id returning credit_balance into v_new;
    insert into public.credit_transactions (user_id, amount, type, note, balance_after)
    values (v_req.user_id, v_req.amount, 'topup', 'Nạp tiền (đã duyệt)', v_new);
  end if;

  update public.topup_requests
  set status = case when p_approve then 'approved' else 'rejected' end,
      reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_id returning * into v_req;

  perform public.notify_user(v_req.user_id, 'topup',
    (case when p_approve then 'Nạp tiền đã được duyệt' else 'Yêu cầu nạp bị từ chối' end),
    'Số tiền: ' || v_req.amount || ' VNĐ.', '/dashboard');
  return v_req;
end;
$$;

-- ============================================================================
-- 2) YÊU CẦU RÚT TIỀN (CTV/Manager/Admin -> admin duyệt). Giữ tiền khi yêu cầu.
-- ============================================================================
create table if not exists public.withdrawal_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      bigint not null check (amount > 0),   -- số tiền rút (đã trừ khỏi ví)
  fee         bigint not null default 0,            -- phí rút
  net         bigint not null default 0,            -- thực nhận = amount - fee
  status      text not null default 'pending',      -- pending|approved|rejected
  note        text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);
alter table public.withdrawal_requests enable row level security;
drop policy if exists "withdraw own or admin read" on public.withdrawal_requests;
create policy "withdraw own or admin read" on public.withdrawal_requests
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function public.request_withdrawal(p_amount bigint, p_note text default null)
returns public.withdrawal_requests
language plpgsql security definer set search_path = public
as $$
declare v_req public.withdrawal_requests; v_bal bigint; v_fee bigint; v_pct numeric;
begin
  if not public.is_staff() then raise exception 'Chỉ nhân viên (CTV/Manager/Admin) mới được rút tiền.'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Số tiền không hợp lệ.'; end if;
  if exists (select 1 from public.withdrawal_requests where user_id = auth.uid() and status = 'pending') then
    raise exception 'Bạn đang có 1 yêu cầu rút chờ duyệt.';
  end if;

  v_pct := public.commission_pct('withdrawal_commission_pct');
  v_fee := floor(p_amount * v_pct / 100);

  -- Giữ tiền: trừ khỏi ví ngay khi yêu cầu (chống rút 2 lần).
  perform set_config('app.bypass_credit_guard', '1', true);
  update public.profiles set credit_balance = credit_balance - p_amount
  where id = auth.uid() returning credit_balance into v_bal;
  if v_bal < 0 then raise exception 'Số dư không đủ để rút.'; end if;

  insert into public.credit_transactions (user_id, amount, type, note, balance_after)
  values (auth.uid(), -p_amount, 'withdraw', 'Yêu cầu rút tiền (đang giữ)', v_bal);

  insert into public.withdrawal_requests (user_id, amount, fee, net, note)
  values (auth.uid(), p_amount, v_fee, p_amount - v_fee, nullif(btrim(coalesce(p_note,'')),''))
  returning * into v_req;

  perform public.notify_admins('withdrawal', 'Yêu cầu rút ' || p_amount || ' VNĐ',
    'Có yêu cầu rút tiền chờ duyệt.', '/work/wallet');
  return v_req;
end;
$$;

create or replace function public.review_withdrawal(p_id uuid, p_approve boolean, p_note text default null)
returns public.withdrawal_requests
language plpgsql security definer set search_path = public
as $$
declare v_req public.withdrawal_requests; v_bal bigint;
begin
  if not public.is_admin() then raise exception 'Chỉ admin mới duyệt rút tiền.'; end if;
  select * into v_req from public.withdrawal_requests where id = p_id for update;
  if not found then raise exception 'Không tìm thấy yêu cầu.'; end if;
  if v_req.status <> 'pending' then raise exception 'Yêu cầu đã được xử lý.'; end if;

  if not p_approve then
    -- Từ chối -> hoàn tiền đã giữ về ví.
    perform set_config('app.bypass_credit_guard', '1', true);
    update public.profiles set credit_balance = credit_balance + v_req.amount
    where id = v_req.user_id returning credit_balance into v_bal;
    insert into public.credit_transactions (user_id, amount, type, note, balance_after)
    values (v_req.user_id, v_req.amount, 'refund', 'Hoàn tiền do rút bị từ chối', v_bal);
  end if;
  -- Duyệt: tiền đã bị giữ (trừ) từ lúc yêu cầu; admin chuyển 'net' ra ngoài thủ công.

  update public.withdrawal_requests
  set status = case when p_approve then 'approved' else 'rejected' end,
      reviewed_by = auth.uid(), reviewed_at = now(),
      note = coalesce(nullif(btrim(coalesce(p_note,'')),''), note)
  where id = p_id returning * into v_req;

  perform public.notify_user(v_req.user_id, 'withdrawal',
    (case when p_approve then 'Yêu cầu rút đã được duyệt' else 'Yêu cầu rút bị từ chối' end),
    'Số tiền: ' || v_req.amount || ' VNĐ (thực nhận ' || v_req.net || ').', '/dashboard');
  return v_req;
end;
$$;

-- ============================================================================
-- 3) HOA HỒNG ĐƠN: CTV nhận tiền đơn (trừ %) khi đơn hoàn tất
-- ============================================================================
alter table public.orders add column if not exists ctv_credited_at timestamptz;

create or replace function public.credit_ctv_on_complete()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_pct numeric; v_earn bigint; v_bal bigint;
begin
  if new.status = 'completed' and old.status is distinct from 'completed'
     and new.assigned_ctv is not null and new.ctv_credited_at is null then
    v_pct := public.commission_pct('order_commission_pct');
    v_earn := new.total - floor(new.total * v_pct / 100);   -- CTV nhận sau khi trừ hoa hồng
    if v_earn > 0 then
      perform set_config('app.bypass_credit_guard', '1', true);
      update public.profiles set credit_balance = credit_balance + v_earn
      where id = new.assigned_ctv returning credit_balance into v_bal;
      insert into public.credit_transactions (user_id, amount, type, note, balance_after, order_id)
      values (new.assigned_ctv, v_earn, 'earning', 'Hoa hồng đơn ' || new.order_code, v_bal, new.id);
      perform public.notify_user(new.assigned_ctv, 'credit',
        'Bạn nhận ' || v_earn || ' VNĐ từ đơn ' || new.order_code,
        'Đã cộng vào số dư ví.', '/dashboard');
    end if;
    new.ctv_credited_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists orders_credit_ctv on public.orders;
create trigger orders_credit_ctv
  before update on public.orders
  for each row execute function public.credit_ctv_on_complete();

grant execute on function public.commission_pct(text) to authenticated, service_role;
grant execute on function public.request_topup(bigint, text) to authenticated, service_role;
grant execute on function public.review_topup(uuid, boolean) to authenticated, service_role;
grant execute on function public.request_withdrawal(bigint, text) to authenticated, service_role;
grant execute on function public.review_withdrawal(uuid, boolean, text) to authenticated, service_role;

-- Xong.
