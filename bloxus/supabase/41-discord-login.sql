-- ============================================================================
-- BLOXUS — 41-discord-login.sql
-- ----------------------------------------------------------------------------
-- Phần database cho đăng nhập Discord tự làm trên bloxus.store
-- (server/discord-auth.ts, chạy trên Cloudflare Pages Functions).
--
-- Máy chủ đăng nhập dùng khoá service_role để:
--   * tìm tài khoản theo email  -> hàm find_auth_user_by_email (bên dưới)
--   * chép avatar/username      -> hàm apply_discord_identity (file 40)
-- Cả hai CHỈ service_role gọi được; khách (anon/authenticated) không gọi được.
--
-- Chạy SAU file 40. Supabase Dashboard -> SQL Editor -> dán toàn bộ -> Run.
-- Chạy lại nhiều lần vẫn an toàn.
-- ============================================================================

create or replace function public.find_auth_user_by_email(p_email text)
returns uuid
language sql stable security definer
set search_path = public, auth
as $$
  select id from auth.users
  where lower(email) = lower(btrim(p_email))
  order by created_at
  limit 1;
$$;

revoke all on function public.find_auth_user_by_email(text) from public, anon, authenticated;
grant execute on function public.find_auth_user_by_email(text) to service_role;

do $$
begin
  if to_regprocedure('public.apply_discord_identity(uuid,jsonb)') is not null then
    grant execute on function public.apply_discord_identity(uuid, jsonb) to service_role;
  else
    raise notice 'Chưa có apply_discord_identity: chạy 40-discord-profile.sql trước rồi chạy lại file này.';
  end if;
end
$$;
