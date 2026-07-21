-- ============================================================================
-- 29-grant-by-username.sql — Cấp quyền bằng EMAIL hoặc USERNAME
-- ----------------------------------------------------------------------------
-- Có '@' -> tra theo email (auth.users); không có -> tra theo profiles.username.
-- Chạy 1 lần trong Supabase SQL Editor.
-- ============================================================================

create or replace function public.set_user_role(p_email text, p_role public.user_role)
returns public.profiles
language plpgsql security definer set search_path = public
as $$
declare v_id uuid; v_profile public.profiles; v_key text := lower(btrim(p_email));
begin
  if not public.is_admin() then raise exception 'Chỉ admin mới được cấp quyền.'; end if;
  if position('@' in v_key) > 0 then
    select id into v_id from auth.users where lower(email) = v_key;
  else
    select id into v_id from public.profiles where lower(username) = v_key;
  end if;
  if v_id is null then raise exception 'Không tìm thấy tài khoản (email hoặc username).'; end if;
  update public.profiles set role = p_role where id = v_id returning * into v_profile;
  perform public.notify_user(v_id, 'role_changed',
    'Quyền tài khoản của bạn đã thay đổi', 'Vai trò mới: ' || p_role, '/dashboard');
  return v_profile;
end;
$$;

-- Manager đề xuất cấp quyền: nhận email/username, LƯU email thật để admin duyệt được.
create or replace function public.request_role_grant(
  p_email text, p_role public.user_role, p_note text default null
)
returns public.role_requests
language plpgsql security definer set search_path = public
as $$
declare v_req public.role_requests; v_target uuid; v_email text; v_key text := lower(btrim(p_email));
begin
  if not public.is_admin_or_manager() then
    raise exception 'Chỉ admin/manager mới được đề xuất cấp quyền.';
  end if;
  if p_role not in ('ctv', 'manager') then
    raise exception 'Chỉ đề xuất được quyền Seller hoặc Manager.';
  end if;

  if position('@' in v_key) > 0 then
    select id into v_target from auth.users where lower(email) = v_key;
  else
    select p.id into v_target from public.profiles p where lower(p.username) = v_key;
  end if;
  if v_target is null then raise exception 'Không tìm thấy tài khoản (email hoặc username).'; end if;
  select email into v_email from auth.users where id = v_target;

  if exists (select 1 from public.role_requests
             where lower(target_email) = lower(v_email) and status = 'pending') then
    raise exception 'Đã có đề xuất đang chờ duyệt cho tài khoản này.';
  end if;

  insert into public.role_requests (requester, target_email, requested_role, note)
  values (auth.uid(), v_email, p_role, nullif(btrim(coalesce(p_note,'')),''))
  returning * into v_req;

  insert into public.notifications (user_id, type, title, body, link)
  select id, 'role_request',
         'Đề xuất cấp quyền ' || p_role || ' cho ' || v_email,
         'Vào trang Role để duyệt hoặc từ chối.', '/work/ctv'
  from public.profiles where role = 'admin';

  return v_req;
end;
$$;

-- Xong.
