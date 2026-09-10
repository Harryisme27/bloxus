-- ============================================================================
-- BLOXUS V2 — 03-make-admin.sql
-- ----------------------------------------------------------------------------
-- Nâng tài khoản của BẠN lên quyền admin. Chạy file này SAU KHI bạn đã đăng ký
-- tài khoản đầu tiên trên web (email bên dưới phải trùng với email đã đăng ký).
-- ============================================================================

update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'miding471@gmail.com');

-- Kiểm tra kết quả: dòng dưới phải hiện ra 1 dòng với role = 'admin'.
select p.username, u.email, p.role
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'miding471@gmail.com';
