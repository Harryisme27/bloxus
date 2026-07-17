-- ============================================================================
-- 14a-manager-enum.sql — Thêm vai trò 'manager' vào enum user_role
-- ----------------------------------------------------------------------------
-- ⚠️ CHẠY FILE NÀY TRƯỚC, MỘT MÌNH, rồi mới chạy 14b.
-- (Postgres không cho dùng giá trị enum mới trong cùng transaction thêm nó.)
-- ============================================================================

alter type public.user_role add value if not exists 'manager';

-- Xong. Giờ chạy tiếp 14b-manager-perms.sql.
