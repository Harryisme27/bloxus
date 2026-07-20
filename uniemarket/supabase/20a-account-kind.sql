-- ============================================================================
-- 20a-account-kind.sql — Thêm loại sản phẩm 'account' vào enum product_kind
-- ----------------------------------------------------------------------------
-- ⚠️ CHẠY FILE NÀY TRƯỚC, MỘT MÌNH, rồi mới chạy 20b.
-- (Postgres không cho dùng giá trị enum mới trong cùng transaction thêm nó.)
-- ============================================================================

alter type public.product_kind add value if not exists 'account';

-- Xong. Giờ chạy 20b-instant-delivery.sql.
