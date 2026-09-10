-- ============================================================================
-- 18-public-payment-gateways.sql — Khách xem được cổng thanh toán đã bật
-- ----------------------------------------------------------------------------
-- BUG: setting 'payment_gateways' KHÔNG nằm trong whitelist đọc công khai của
-- app_settings, nên khách (anon/customer) không đọc được -> Checkout rơi về mặc
-- định bank+momo. Admin thì is_admin() nên đọc đủ.
--
-- KHÔNG mở thẳng key đó cho công khai vì config Stripe có 'secret_key'.
-- Giải pháp: RPC trả về CÁC CỔNG ĐANG BẬT, đã LOẠI BỎ 'secret_key'. An toàn cho
-- anon đọc; Checkout/OrderDetail gọi RPC này thay vì đọc setting thô.
-- Chạy 1 lần trong Supabase SQL Editor.
-- ============================================================================

create or replace function public.public_payment_gateways()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_object_agg(g.key, g.value - 'secret_key')
      from public.app_settings s,
           lateral jsonb_each(s.value) as g(key, value)
      where s.key = 'payment_gateways'
        and coalesce((g.value ->> 'enabled')::boolean, false) = true
    ),
    '{}'::jsonb
  );
$$;

grant execute on function public.public_payment_gateways() to anon, authenticated, service_role;

-- Xong.
