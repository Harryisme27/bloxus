-- ============================================================================
-- BLOXUS — 40-discord-profile.sql
-- ----------------------------------------------------------------------------
-- Lấy thông tin Discord làm hồ sơ (chuyển từ trackstat sang).
--
-- trackstat tự làm OAuth nên gọi thẳng /users/@me. Bloxus để Supabase Auth làm
-- OAuth, và Supabase đã lưu sẵn hồ sơ Discord (id, username, avatar) trong
-- auth.identities.identity_data — mỗi lần đăng nhập Discord nó ghi lại bản mới.
-- File này gắn trigger vào đó để chép sang public.profiles:
--
--   discord_id        <- ID Discord (snowflake)
--   discord_username  <- username Discord (vd "berisme"), luôn theo bản mới nhất
--   avatar_url        <- ảnh đại diện Discord (ảnh động thì .gif), ?size=128
--   display_name      <- username Discord, CHỈ khi đang trống
--   discord (liên hệ) <- username Discord, CHỈ khi đang trống
--
-- Khác trackstat 2 điểm, có chủ ý:
--   * Tên hiển thị và ô liên hệ Discord mà khách đã tự sửa trong Hồ sơ thì giữ
--     nguyên, không bị ghi đè mỗi lần đăng nhập.
--   * Ảnh đại diện không phải của Discord (ảnh tự tải lên) cũng giữ nguyên.
-- Tài khoản email trùng email Discord đã được Supabase tự gộp làm một (giống
-- nhánh "trùng email thì cập nhật" của trackstat), nên cũng được điền.
--
-- Cách chạy: Supabase Dashboard -> SQL Editor -> dán toàn bộ -> Run.
-- Chạy lại nhiều lần vẫn an toàn.
-- ============================================================================

-- ---- 1. Cột mới -------------------------------------------------------------
alter table public.profiles add column if not exists discord_id text;
alter table public.profiles add column if not exists discord_username text;
create unique index if not exists profiles_discord_id_key on public.profiles (discord_id);

-- ---- 2. Link ảnh đại diện (tương đương avatarUrlOf của trackstat) -----------
create or replace function public.discord_avatar_url(p_data jsonb)
returns text
language plpgsql immutable
set search_path = public
as $$
declare
  v_url  text := nullif(btrim(coalesce(p_data ->> 'avatar_url', p_data ->> 'picture', '')), '');
  v_hash text;
begin
  -- Chỉ nhận ảnh thật. Ảnh mặc định của Discord (/embed/avatars/N.png) coi như
  -- không có ảnh, để web hiện chữ cái đầu — giống trackstat trả null.
  if v_url is null or v_url !~ '^https://cdn\.discordapp\.com/avatars/' then
    return null;
  end if;
  v_url  := split_part(v_url, '?', 1);
  v_hash := substring(v_url from '/avatars/[^/]+/([^/.]+)');
  -- Hash bắt đầu bằng "a_" là ảnh động -> dùng .gif.
  if left(coalesce(v_hash, ''), 2) = 'a_' then
    v_url := regexp_replace(v_url, '\.(png|jpe?g|webp)$', '.gif');
  end if;
  return v_url || '?size=128';
end;
$$;

-- ---- 3. Username Discord ("berisme#0" -> "berisme"), cùng thứ tự với file 35 -
create or replace function public.discord_handle(p_data jsonb)
returns text
language sql immutable
set search_path = public
as $$
  select coalesce(
    nullif(btrim(p_data ->> 'preferred_username'), ''),
    nullif(regexp_replace(btrim(coalesce(p_data ->> 'name', '')), '#\d+$', ''), ''),
    nullif(btrim(p_data ->> 'full_name'), '')
  );
$$;

-- ---- 4. Chép hồ sơ Discord vào profiles --------------------------------------
create or replace function public.apply_discord_identity(p_user_id uuid, p_data jsonb)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_id      text := nullif(btrim(coalesce(p_data ->> 'provider_id', p_data ->> 'sub', '')), '');
  v_handle  text := public.discord_handle(p_data);
  v_avatar  text := public.discord_avatar_url(p_data);
  v_p       public.profiles;
  v_new_avatar  text;
  v_new_display text;
  v_new_contact text;
begin
  if p_user_id is null or v_id is null then return; end if;

  select * into v_p from public.profiles where id = p_user_id;
  if not found then return; end if;

  -- ID Discord này đã gắn với tài khoản khác thì không giành lấy.
  if exists (select 1 from public.profiles where discord_id = v_id and id <> p_user_id) then
    return;
  end if;

  v_new_avatar := case
    when v_p.avatar_url is null or v_p.avatar_url like 'https://cdn.discordapp.com/%' then v_avatar
    else v_p.avatar_url end;
  v_new_display := case
    when nullif(btrim(v_p.display_name), '') is null then coalesce(v_handle, v_p.username)
    else v_p.display_name end;
  v_new_contact := case
    when nullif(btrim(v_p.discord), '') is null then v_handle
    else v_p.discord end;

  -- Không có gì đổi thì thôi, khỏi ghi (updated_at không bị nhảy mỗi lần đăng nhập).
  if (v_p.discord_id, v_p.discord_username, v_p.avatar_url, v_p.display_name, v_p.discord)
     is not distinct from (v_id, v_handle, v_new_avatar, v_new_display, v_new_contact) then
    return;
  end if;

  perform set_config('app.bypass_discord_guard', '1', true);
  update public.profiles
  set discord_id       = v_id,
      discord_username = v_handle,
      avatar_url       = v_new_avatar,
      display_name     = v_new_display,
      discord          = v_new_contact
  where id = p_user_id;
  perform set_config('app.bypass_discord_guard', '', true);
end;
$$;

-- Hàm này nhận user_id tuỳ ý nên KHÔNG được để khách gọi qua API.
revoke all on function public.apply_discord_identity(uuid, jsonb) from public, anon, authenticated;

-- ---- 5. Khách không tự sửa được liên kết Discord ----------------------------
-- (Nếu không chặn, ai cũng tự điền discord_id của người khác vào hồ sơ mình.)
create or replace function public.guard_discord_link()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if (new.discord_id is distinct from old.discord_id
      or new.discord_username is distinct from old.discord_username)
     and auth.uid() is not null
     and not public.is_admin()
     and coalesce(current_setting('app.bypass_discord_guard', true), '') is distinct from '1'
  then
    raise exception 'Liên kết Discord chỉ được cập nhật khi đăng nhập bằng Discord.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_discord on public.profiles;
create trigger profiles_guard_discord
  before update on public.profiles
  for each row execute function public.guard_discord_link();

-- ---- 6. Trigger: mỗi lần đăng nhập Discord -> cập nhật hồ sơ -----------------
create or replace function public.sync_discord_profile()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  begin
    perform public.apply_discord_identity(new.user_id, new.identity_data);
  exception when others then
    -- Tuyệt đối không để lỗi ở đây chặn việc đăng nhập.
    raise warning 'sync_discord_profile bỏ qua: % (%)', sqlerrm, sqlstate;
  end;
  return null;
end;
$$;

drop trigger if exists on_discord_identity_sync on auth.identities;
create trigger on_discord_identity_sync
  after insert or update on auth.identities
  for each row
  when (new.provider = 'discord')
  execute function public.sync_discord_profile();

-- ---- 7. Điền luôn cho các tài khoản Discord đã có ---------------------------
do $$
declare r record;
begin
  for r in select user_id, identity_data from auth.identities where provider = 'discord' loop
    perform public.apply_discord_identity(r.user_id, r.identity_data);
  end loop;
end
$$;

-- Kiểm tra:
-- select username, display_name, discord_username, discord_id, avatar_url
-- from public.profiles where discord_id is not null;
