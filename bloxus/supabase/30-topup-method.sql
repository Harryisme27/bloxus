-- ============================================================================
-- 30-topup-method.sql — Nạp tiền chọn phương thức (cổng thanh toán)
-- ----------------------------------------------------------------------------
-- Thêm cột method vào topup_requests + request_topup nhận method.
-- Số tiền vẫn lưu VND (server chuẩn VND); client quy đổi USD->VND khi gửi.
-- Chạy 1 lần trong Supabase SQL Editor (sau 27).
-- ============================================================================

alter table public.topup_requests add column if not exists method text;

drop function if exists public.request_topup(bigint, text);
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
  insert into public.topup_requests (user_id, amount, method, note)
  values (auth.uid(), p_amount, nullif(btrim(coalesce(p_method,'')),''),
          nullif(btrim(coalesce(p_note,'')),'')) returning * into v_req;
  perform public.notify_admins('topup', 'Yêu cầu nạp ' || p_amount || ' VNĐ',
    'Có yêu cầu nạp tiền chờ duyệt.', '/work/wallet');
  return v_req;
end;
$$;

grant execute on function public.request_topup(bigint, text, text) to authenticated, service_role;

-- Xong.
