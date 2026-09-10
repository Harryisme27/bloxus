-- ============================================================================
-- 38-currency-stock.sql — Cho phép kind='currency' quản lý tồn kho
-- ----------------------------------------------------------------------------
-- ⚠️ Chạy SAU 37-currency-kind.sql (enum value mới phải commit trước khi được
-- tham chiếu trong CHECK).
-- Giống account: stock của currency chỉ mang tính hiển thị/quản lý tay —
-- place_order chỉ tự trừ kho cho kind='item'.
-- ============================================================================

alter table public.products drop constraint if exists products_stock_check;

alter table public.products
  add constraint products_stock_check
  check (stock is null or (kind in ('item', 'account', 'currency') and stock >= 0));
