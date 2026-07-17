-- ============================================================================
-- 17-admin-delete-orders.sql — Admin xóa đơn hàng (từng đơn / nhiều / tất cả)
-- ----------------------------------------------------------------------------
-- Xóa 1 đơn sẽ CASCADE: order_items, order_events, threads (-> messages).
-- reviews.order_id đã SET NULL. Riêng proofs.order_id KHÔNG cascade nên phải
-- gỡ liên kết trước (giữ lại minh chứng công khai, chỉ bỏ trỏ tới đơn đã xóa).
-- CHỈ ADMIN. Chạy 1 lần trong Supabase SQL Editor.
-- ============================================================================

-- 1) Xóa danh sách đơn theo id ------------------------------------------------
create or replace function public.admin_delete_orders(p_ids uuid[])
returns integer
language plpgsql security definer
set search_path = public
as $$
declare v_count integer;
begin
  if not public.is_admin() then
    raise exception 'Chỉ admin mới được xóa đơn hàng.';
  end if;
  if p_ids is null or array_length(p_ids, 1) is null then
    return 0;
  end if;

  update public.proofs set order_id = null where order_id = any(p_ids);
  delete from public.orders where id = any(p_ids);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- 2) Xóa TẤT CẢ đơn hàng ------------------------------------------------------
create or replace function public.admin_delete_all_orders()
returns integer
language plpgsql security definer
set search_path = public
as $$
declare v_count integer;
begin
  if not public.is_admin() then
    raise exception 'Chỉ admin mới được xóa đơn hàng.';
  end if;

  update public.proofs set order_id = null where order_id is not null;
  delete from public.orders;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.admin_delete_orders(uuid[]) from public, anon;
revoke execute on function public.admin_delete_all_orders() from public, anon;
grant execute on function public.admin_delete_orders(uuid[]) to authenticated, service_role;
grant execute on function public.admin_delete_all_orders() to authenticated, service_role;

-- Xong.
