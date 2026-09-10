-- ============================================================================
-- 13-product-sections.sql — KHU VỰC (SECTION) trong mỗi danh mục
-- ----------------------------------------------------------------------------
-- Giống bloxmart: trong 1 game, admin tự đặt các khu ("Pets", "Eggs", ...)
-- và gán từng sản phẩm vào khu. Trang game nhóm sản phẩm theo khu cho dễ tìm.
--   - categories.sections: mảng tên khu theo THỨ TỰ hiển thị (jsonb).
--   - products.section: tên khu của sản phẩm (null = chưa phân khu).
-- Ghi qua upsert trực tiếp (RLS admin) — không cần RPC mới.
-- Chạy 1 lần trong Supabase SQL Editor.
-- ============================================================================

alter table public.categories
  add column if not exists sections jsonb not null default '[]'::jsonb;

alter table public.products
  add column if not exists section text;

-- Xong.
