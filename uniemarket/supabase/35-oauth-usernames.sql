-- ============================================================================
-- 35 — Tên tài khoản đẹp cho đăng nhập OAuth (Discord/Google)
-- Chạy trong Supabase Dashboard → SQL Editor. Chạy lại được (idempotent).
--
-- Discord gửi kèm: username thật (vd "berisme") trong name/preferred_username/
-- full_name, và display name (vd "Ber") trong custom_claims.global_name.
-- Shop dùng USERNAME thật làm tên tài khoản — ưu tiên: username form đăng ký
-- web → handle Discord/Google → display name → phần trước @ của email.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_username text;
begin
  v_username := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),              -- form đăng ký web
    nullif(btrim(new.raw_user_meta_data ->> 'preferred_username'), ''),    -- handle OAuth
    nullif(regexp_replace(btrim(coalesce(new.raw_user_meta_data ->> 'name', '')), '#\d+$', ''), ''), -- "berisme#0" -> "berisme"
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data -> 'custom_claims' ->> 'global_name'), ''), -- display name (cuối trong nhóm OAuth)
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),               -- fallback cuối
    'user'
  );
  -- Nếu username đã tồn tại thì gắn thêm hậu tố ngẫu nhiên.
  if exists (select 1 from public.profiles where username = v_username) then
    v_username := v_username || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, v_username, v_username);
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Sửa các tài khoản OAuth ĐÃ tạo: đổi sang handle thật (vd "Ber"/"bokhongfeed"
-- -> "berisme"). Chỉ đụng tài khoản còn mang tên tự sinh (email-prefix hoặc
-- display name) — ai đã tự đổi tên trong hồ sơ thì giữ nguyên.
-- ----------------------------------------------------------------------------
update public.profiles p
set username = better.handle,
    display_name = better.handle
from (
  select
    u.id,
    split_part(coalesce(u.email, ''), '@', 1) as email_prefix,
    nullif(btrim(u.raw_user_meta_data -> 'custom_claims' ->> 'global_name'), '') as display,
    coalesce(
      nullif(btrim(u.raw_user_meta_data ->> 'preferred_username'), ''),
      nullif(regexp_replace(btrim(coalesce(u.raw_user_meta_data ->> 'name', '')), '#\d+$', ''), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'full_name'), '')
    ) as handle
  from auth.users u
  where coalesce(u.raw_app_meta_data ->> 'provider', '') in ('discord', 'google')
) better
where p.id = better.id
  and better.handle is not null
  and p.username <> better.handle
  -- chỉ khi đang mang tên tự sinh (chưa tự đổi trong hồ sơ)
  and (p.username = better.email_prefix or p.username = better.display)
  -- và handle chưa bị ai chiếm
  and not exists (select 1 from public.profiles x where x.username = better.handle and x.id <> p.id);

-- Kiểm tra: select username, display_name from public.profiles;
