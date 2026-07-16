-- ============================================================================
-- UNIEMARKET V2 — 04-fix-admin.sql
-- ----------------------------------------------------------------------------
-- Vá lỗi trigger phân quyền (chặn nhầm cả bước nâng admin lần đầu) VÀ nâng tài
-- khoản của bạn lên admin. Dán TOÀN BỘ file này vào SQL Editor và bấm Run.
-- Chạy file này thay cho 03-make-admin.sql.
-- ============================================================================

-- 1) Sửa hàm guard: chỉ chặn người dùng đang đăng nhập tự đổi vai trò.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role
     and auth.uid() is not null
     and not public.is_admin()
     and coalesce(current_setting('app.bypass_role_guard', true), '') is distinct from '1'
  then
    raise exception 'Bạn không có quyền thay đổi vai trò tài khoản.';
  end if;
  return new;
end;
$$;

-- 2) Nâng tài khoản của bạn lên admin (email phải trùng tài khoản đã đăng ký).
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'miding471@gmail.com');

-- 3) Kiểm tra: phải hiện 1 dòng role = 'admin'.
select u.email, p.username, p.role
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'miding471@gmail.com';
