-- ============================================================================
-- 28-payout-methods.sql — Rút tiền đa phương thức + phí riêng + payout info
-- ----------------------------------------------------------------------------
-- - payout_methods (setting): nhiều phương thức, mỗi cái có % + phí cố định + min.
-- - profiles.payout_info (jsonb): tài khoản nhận của seller/manager theo method.
-- - withdrawal_requests thêm method + destination.
-- - request_withdrawal(amount, method, destination): tính phí theo method.
-- Chạy 1 lần trong Supabase SQL Editor (sau 27).
-- ============================================================================

insert into public.app_settings (key, value) values (
  'payout_methods',
  '{
    "bank_transfer": {"enabled": true,  "percent": 0,   "flat": 0,     "min": 0},
    "ewallet":       {"enabled": true,  "percent": 0,   "flat": 0,     "min": 0},
    "crypto":        {"enabled": false, "percent": 6,   "flat": 10000, "min": 100000},
    "paypal":        {"enabled": false, "percent": 1.5, "flat": 3000,  "min": 50000},
    "payoneer":      {"enabled": false, "percent": 1.5, "flat": 3000,  "min": 50000},
    "skrill":        {"enabled": false, "percent": 5,   "flat": 1000,  "min": 30000}
  }'::jsonb
) on conflict (key) do nothing;

-- Cho staff đọc payout_methods (để hiện lựa chọn + phí).
drop policy if exists "app_settings: public keys read" on public.app_settings;
create policy "app_settings: public keys read" on public.app_settings
  for select to anon, authenticated
  using (
    key in ('bank_name','bank_account','bank_holder','momo_number','momo_qr_url','brand','ctv_apply_open','role_permissions','order_commission_pct','withdrawal_commission_pct','payout_methods')
    or public.is_admin()
  );

-- Tài khoản nhận của seller/manager (tự sửa qua RLS self-update).
alter table public.profiles add column if not exists payout_info jsonb not null default '{}'::jsonb;

-- withdrawal_requests: thêm method + destination.
alter table public.withdrawal_requests add column if not exists method text;
alter table public.withdrawal_requests add column if not exists destination text;

-- request_withdrawal mới: chọn method + destination, phí theo method.
drop function if exists public.request_withdrawal(bigint, text);
create or replace function public.request_withdrawal(
  p_amount bigint, p_method text, p_destination text default null
)
returns public.withdrawal_requests
language plpgsql security definer set search_path = public
as $$
declare
  v_req public.withdrawal_requests;
  v_bal bigint; v_cfg jsonb; v_percent numeric; v_flat bigint; v_min bigint; v_fee bigint;
begin
  if not public.is_staff() then raise exception 'Chỉ nhân viên (Seller/Manager/Admin) mới được rút tiền.'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Số tiền không hợp lệ.'; end if;
  if exists (select 1 from public.withdrawal_requests where user_id = auth.uid() and status = 'pending') then
    raise exception 'Bạn đang có 1 yêu cầu rút chờ duyệt.';
  end if;

  v_cfg := (select value from public.app_settings where key = 'payout_methods') -> p_method;
  if v_cfg is null or coalesce((v_cfg->>'enabled')::boolean, false) = false then
    raise exception 'Phương thức rút không khả dụng.';
  end if;
  v_percent := coalesce((v_cfg->>'percent')::numeric, 0);
  v_flat    := coalesce((v_cfg->>'flat')::bigint, 0);
  v_min     := coalesce((v_cfg->>'min')::bigint, 0);
  if p_amount < v_min then
    raise exception 'Số tiền rút tối thiểu là % VNĐ.', v_min;
  end if;

  v_fee := floor(p_amount * v_percent / 100) + v_flat;
  if v_fee >= p_amount then raise exception 'Phí lớn hơn hoặc bằng số tiền rút.'; end if;

  perform set_config('app.bypass_credit_guard', '1', true);
  update public.profiles set credit_balance = credit_balance - p_amount
  where id = auth.uid() returning credit_balance into v_bal;
  if v_bal < 0 then raise exception 'Số dư không đủ để rút.'; end if;

  insert into public.credit_transactions (user_id, amount, type, note, balance_after)
  values (auth.uid(), -p_amount, 'withdraw', 'Yêu cầu rút (' || p_method || ')', v_bal);

  insert into public.withdrawal_requests (user_id, amount, fee, net, method, destination, note)
  values (auth.uid(), p_amount, v_fee, p_amount - v_fee, p_method,
          nullif(btrim(coalesce(p_destination,'')),''), null)
  returning * into v_req;

  perform public.notify_admins('withdrawal', 'Yêu cầu rút ' || p_amount || ' VNĐ (' || p_method || ')',
    'Có yêu cầu rút tiền chờ duyệt.', '/work/wallet');
  return v_req;
end;
$$;

grant execute on function public.request_withdrawal(bigint, text, text) to authenticated, service_role;

-- Xong.
