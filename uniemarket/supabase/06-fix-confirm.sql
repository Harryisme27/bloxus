-- ============================================================================
-- UNIEMARKET V2 — 06-fix-confirm.sql
-- ----------------------------------------------------------------------------
-- Vá nhỏ: hàm confirm_received bị lỗi "column created_at does not exist"
-- (bảng order_items không có cột created_at). Dán TOÀN BỘ file này vào SQL
-- Editor và bấm Run để cập nhật lại hàm.
-- ============================================================================
create or replace function public.confirm_received(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid(); v_order public.orders;
  v_item public.order_items; v_buyer public.profiles; v_staff_name text; v_img text;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.user_id <> v_uid then raise exception 'Chỉ khách đặt đơn mới xác nhận nhận hàng.'; end if;
  if v_order.status <> 'in_progress' or v_order.delivered_at is null then
    raise exception 'Đơn chưa được giao nên chưa thể xác nhận.';
  end if;

  update public.orders
  set status = 'completed', completed_at = now(), buyer_confirmed_at = now()
  where id = p_order_id returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, v_uid, 'status_changed', 'Khách xác nhận đã nhận hàng — hoàn thành.',
          jsonb_build_object('status', 'completed'));

  -- Tự tạo minh chứng công khai từ đơn đã hoàn thành.
  select * into v_item from public.order_items where order_id = p_order_id limit 1;
  select * into v_buyer from public.profiles where id = v_order.user_id;
  select coalesce(display_name, username) into v_staff_name from public.profiles where id = v_order.assigned_ctv;
  v_img := case when array_length(v_order.delivery_proof_images,1) >= 1
                then v_order.delivery_proof_images[1] else null end;

  insert into public.proofs (order_id, game_name, item_name, rarity, buyer_masked, amount, staff_name, proof_image_url, status, delivered_at)
  values (
    v_order.id, coalesce(v_item.category_name, 'Uniemarket'), coalesce(v_item.name, 'Đơn hàng'),
    null, public.mask_handle(v_buyer.username), v_order.total, coalesce(v_staff_name, 'Uniemarket'),
    v_img, 'Verified', now()
  );

  perform public.notify_user(v_order.assigned_ctv, 'order_completed',
    'Đơn ' || v_order.order_code || ' đã hoàn thành', 'Khách đã xác nhận nhận hàng.', '/work/orders/' || v_order.id);
  perform public.notify_admins('order_completed',
    'Đơn ' || v_order.order_code || ' hoàn thành', 'Khách đã xác nhận — đã lên Minh chứng.', '/work/orders/' || v_order.id);

  return v_order;
end;
$$;
