-- ============================================================================
-- 11-login-username.sql — Cho phép đăng nhập bằng USERNAME hoặc EMAIL
-- ----------------------------------------------------------------------------
-- Supabase Auth chỉ đăng nhập bằng email. Để khách/CTV nhập được username,
-- client tra username -> email qua RPC này (SECURITY DEFINER vì anon không
-- đọc được auth.users). Nếu người dùng nhập sẵn email thì client bỏ qua RPC.
--
-- Lưu ý riêng tư: hàm này để lộ ánh xạ username -> email cho người gọi ẩn danh
-- (ai biết username có thể suy ra email). Chấp nhận được cho bản demo. Khi chạy
-- thật nên bỏ, hoặc đổi sang email tổng hợp (username@users.local).
-- Chạy 1 lần trong Supabase SQL Editor.
-- ============================================================================

create or replace function public.email_for_login(p_login text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(btrim(p_login))
  limit 1;
$$;

revoke all on function public.email_for_login(text) from public;
grant execute on function public.email_for_login(text) to anon, authenticated;

-- Xong.
