-- ============================================================================
-- 22-fix-products-stock-check.sql — Sửa ràng buộc stock cho 'account'
-- ----------------------------------------------------------------------------
-- CHECK stock gốc tham chiếu 2 cột (stock + kind) nên Postgres đặt tên là
-- 'products_check' (không phải 'products_stock_check'). Migration 20b drop sai
-- tên nên ràng buộc cũ (chỉ cho kind='item' có stock) vẫn còn -> account+stock lỗi.
-- Bản này drop đúng tên và đặt lại ràng buộc cho phép item|account.
-- Chạy 1 lần trong Supabase SQL Editor.
-- ============================================================================

alter table public.products drop constraint if exists products_check;
alter table public.products drop constraint if exists products_stock_check;

alter table public.products
  add constraint products_stock_check
  check (stock is null or (kind in ('item', 'account') and stock >= 0));

-- Xong.
