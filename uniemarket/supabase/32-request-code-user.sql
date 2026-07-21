-- ============================================================================
-- 32-request-code-user.sql — Mã yêu cầu + tên người dùng cho nạp/rút
-- ----------------------------------------------------------------------------
-- • Thêm cột code (mã ngắn) cho topup_requests / withdrawal_requests -> dễ tra.
-- • request_topup / request_withdrawal tự sinh code.
-- • RPC admin list_* trả kèm username/display_name/email để hiện tên người gửi.
-- Chạy 1 lần trong Supabase SQL Editor (sau 30).
-- ============================================================================

alter table public.topup_requests      add column if not exists code text;
alter table public.withdrawal_requests  add column if not exists code text;

update public.topup_requests
  set code = 'TP-' || upper(substr(md5(id::text), 1, 6)) where code is null;
update public.withdrawal_requests
  set code = 'WD-' || upper(substr(md5(id::text), 1, 6)) where code is null;

create unique index if not exists topup_requests_code_idx      on public.topup_requests(code);
create unique index if not exists withdrawal_requests_code_idx on public.withdrawal_requests(code);

-- ---- request_topup: sinh code ----
drop function if exists public.request_topup(bigint, text, text);
create or replace function public.request_topup(
  p_amount bigint, p_method text default null, p_note text default null
)
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
grant execute on function public.request_topup(bigint, text, text) to authenticated, service_role;

-- ---- request_withdrawal: sinh code ----
drop function if exists public.request_withdrawal(bigint, text, text);
create or replace function public.request_withdrawal(
  p_amount bigint, p_method text default null, p_destination text default null, p_note text default null
)
returns public.withdrawal_requests
language plpgsql security definer set search_path = public
as $$
declare v_req public.withdrawal_requests; v_bal bigint; v_fee bigint; v_pct numeric;
begin
  if not public.is_staff() then raise exception 'Chỉ nhân viên (Seller/Manager/Admin) mới được rút tiền.'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Số tiền không hợp lệ.'; end if;
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
grant execute on function public.request_withdrawal(bigint, text, text, text) to authenticated, service_role;

-- ---- Admin list kèm tên người dùng ----
create or replace function public.list_topup_requests()
returns table (
  id uuid, user_id uuid, amount bigint, status text, method text, note text,
  code text, reviewed_by uuid, reviewed_at timestamptz, created_at timestamptz,
  username text, display_name text, email text
)
language sql security definer set search_path = public
as $$
  select r.id, r.user_id, r.amount, r.status, r.method, r.note, r.code,
         r.reviewed_by, r.reviewed_at, r.created_at,
         p.username, p.display_name, u.email
  from public.topup_requests r
  left join public.profiles p on p.id = r.user_id
  left join auth.users u on u.id = r.user_id
  where public.is_admin()
  order by r.created_at desc
  limit 200;
$$;
grant execute on function public.list_topup_requests() to authenticated, service_role;

create or replace function public.list_withdrawal_requests()
returns table (
  id uuid, user_id uuid, amount bigint, fee bigint, net bigint, method text,
  destination text, status text, note text, code text, reviewed_by uuid,
  reviewed_at timestamptz, created_at timestamptz,
  username text, display_name text, email text
)
language sql security definer set search_path = public
as $$
  select r.id, r.user_id, r.amount, r.fee, r.net, r.method, r.destination,
         r.status, r.note, r.code, r.reviewed_by, r.reviewed_at, r.created_at,
         p.username, p.display_name, u.email
  from public.withdrawal_requests r
  left join public.profiles p on p.id = r.user_id
  left join auth.users u on u.id = r.user_id
  where public.is_admin()
  order by r.created_at desc
  limit 200;
$$;
grant execute on function public.list_withdrawal_requests() to authenticated, service_role;

-- Xong.
