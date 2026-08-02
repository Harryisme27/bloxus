-- ============================================================================
-- 37-currency-kind.sql — Thêm loại sản phẩm 'currency' vào enum product_kind
-- ----------------------------------------------------------------------------
-- ⚠️ CHẠY FILE NÀY MỘT MÌNH trong SQL Editor (giống 20a-account-kind.sql —
-- Postgres không cho dùng giá trị enum mới trong cùng transaction thêm nó).
--
-- Currency (VD PS99 bán gems theo $/B) hành xử như service: không quản lý
-- tồn kho, giá là "giá từ". Frontend đã hỗ trợ sẵn — chạy file này xong là
-- nút "Currency" trong Add/Edit product lưu được.
-- ============================================================================

alter type public.product_kind add value if not exists 'currency';
