-- ============================================================================
-- BLOXUS V2 — 05-order-flow.sql
-- ----------------------------------------------------------------------------
-- Nâng cấp luồng đơn theo kiểu "giao hàng online":
--   • CTV/Admin bấm "Đã giao" + đính ảnh proof  → đơn ở trạng thái ĐÃ GIAO (chờ khách xác nhận)
--   • Khách bấm "Đã nhận hàng"                   → đơn HOÀN THÀNH + tự đưa lên Minh chứng
--   • Khách "Yêu cầu hủy" (kèm lý do)            → báo người nhận, chờ admin duyệt hoặc 24h
--   • Admin cấp quyền CTV thủ công theo email
-- Không thêm giá trị enum mới (dùng cột mốc thời gian) để migration an toàn.
-- Dán TOÀN BỘ file này vào SQL Editor và bấm Run.
-- ============================================================================

-- 1) Cột mới trên orders --------------------------------------------------------
alter table public.orders
  add column if not exists cancel_requested_at   timestamptz,
  add column if not exists cancel_request_reason text,
  add column if not exists delivered_at          timestamptz,
  add column if not exists delivery_note         text,
  add column if not exists delivery_proof_images text[] not null default '{}',
  add column if not exists buyer_confirmed_at    timestamptz;

-- 2) Helper: che bớt username người mua cho Minh chứng (Kh***nh) ----------------
create or replace function public.mask_handle(p text)
returns text language sql immutable as $$
  select case
    when p is null or length(p) <= 2 then coalesce(p, 'Ẩn danh')
    when length(p) <= 4 then substr(p,1,1) || '***'
    else substr(p,1,2) || '***' || substr(p, length(p)-1)
  end;
$$;

-- 3) Khách yêu cầu hủy đơn (kèm lý do) -----------------------------------------
-- pending_payment → hủy ngay (chưa có hàng). paid/in_progress chưa giao → tạo
-- YÊU CẦU hủy + báo người nhận; chờ admin duyệt hoặc khách tự chốt sau 24h.
create or replace function public.request_cancel(p_order_id uuid, p_reason text)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_order public.orders;
begin
  if v_uid is null then raise exception 'Bạn cần đăng nhập.'; end if;
  if nullif(btrim(coalesce(p_reason,'')),'') is null then
    raise exception 'Vui lòng nhập lý do hủy đơn.';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.user_id <> v_uid and not public.is_admin() then
    raise exception 'Bạn không có quyền với đơn này.';
  end if;
  if v_order.delivered_at is not null then
    raise exception 'Đơn đã được giao — vui lòng xác nhận đã nhận hoặc trao đổi với người bán.';
  end if;

  -- Chưa thanh toán: hủy luôn.
  if v_order.status = 'pending_payment' then
    return public.cancel_order(p_order_id, p_reason);
  end if;

  if v_order.status not in ('paid', 'in_progress') then
    raise exception 'Không thể yêu cầu hủy đơn ở trạng thái này.';
  end if;

  update public.orders
  set cancel_requested_at = now(), cancel_request_reason = btrim(p_reason)
  where id = p_order_id returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, v_uid, 'note', 'Khách yêu cầu hủy đơn: ' || btrim(p_reason), null);

  -- Báo người nhận (CTV) + admin để KHÔNG giao hàng khi đang có yêu cầu hủy.
  perform public.notify_user(v_order.assigned_ctv, 'cancel_requested',
    '⚠️ Đơn ' || v_order.order_code || ' đang YÊU CẦU HỦY',
    'Khách yêu cầu hủy — TẠM DỪNG giao hàng. Lý do: ' || btrim(p_reason),
    '/work/orders/' || v_order.id);
  perform public.notify_admins('cancel_requested',
    '⚠️ Yêu cầu hủy đơn ' || v_order.order_code,
    'Lý do: ' || btrim(p_reason) || ' — cần admin duyệt.',
    '/work/orders/' || v_order.id);

  return v_order;
end;
$$;

-- 4) Admin duyệt/từ chối yêu cầu hủy -------------------------------------------
create or replace function public.resolve_cancel(p_order_id uuid, p_approve boolean, p_note text default null)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare v_order public.orders;
begin
  if not public.is_admin() then raise exception 'Chỉ admin mới được duyệt yêu cầu hủy.'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.cancel_requested_at is null then raise exception 'Đơn này không có yêu cầu hủy.'; end if;

  if p_approve then
    return public.cancel_order(p_order_id, coalesce(v_order.cancel_request_reason, 'Admin duyệt hủy'));
  end if;

  update public.orders set cancel_requested_at = null, cancel_request_reason = null
  where id = p_order_id returning * into v_order;
  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, auth.uid(), 'note', 'Admin từ chối yêu cầu hủy.' ||
          coalesce(' ' || nullif(btrim(coalesce(p_note,'')),''), ''), null);
  perform public.notify_user(v_order.user_id, 'cancel_rejected',
    'Yêu cầu hủy đơn ' || v_order.order_code || ' bị từ chối',
    coalesce(nullif(btrim(coalesce(p_note,'')),''), 'Vui lòng trao đổi với người bán.'),
    '/orders/' || v_order.id);
  return v_order;
end;
$$;

-- 5) Khách tự chốt hủy sau 24h nếu admin chưa xử lý ----------------------------
create or replace function public.finalize_cancel(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.user_id <> v_uid then raise exception 'Bạn không có quyền với đơn này.'; end if;
  if v_order.cancel_requested_at is null then raise exception 'Đơn này không có yêu cầu hủy.'; end if;
  if v_order.delivered_at is not null then raise exception 'Đơn đã giao — không thể tự hủy.'; end if;
  if now() - v_order.cancel_requested_at < interval '24 hours' then
    raise exception 'Chưa đủ 24 giờ kể từ khi yêu cầu hủy.';
  end if;
  return public.cancel_order(p_order_id, coalesce(v_order.cancel_request_reason, 'Khách tự hủy sau 24h'));
end;
$$;

-- 6) CTV/Admin đánh dấu ĐÃ GIAO + ảnh proof ------------------------------------
create or replace function public.mark_delivered(p_order_id uuid, p_proof_images text[], p_note text default null)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if not public.is_admin() and v_order.assigned_ctv is distinct from v_uid then
    raise exception 'Chỉ người được giao đơn mới đánh dấu đã giao.';
  end if;
  if v_order.status <> 'in_progress' then raise exception 'Chỉ giao được đơn đang thực hiện.'; end if;
  if v_order.delivered_at is not null then raise exception 'Đơn này đã được đánh dấu giao.'; end if;
  if v_order.cancel_requested_at is not null then
    raise exception 'Đơn đang có YÊU CẦU HỦY — vui lòng xử lý trước khi giao.';
  end if;
  if p_proof_images is null or array_length(p_proof_images, 1) is null then
    raise exception 'Cần đính ít nhất 1 ảnh bằng chứng giao hàng.';
  end if;

  update public.orders
  set delivered_at = now(), delivery_proof_images = p_proof_images,
      delivery_note = nullif(btrim(coalesce(p_note,'')),'')
  where id = p_order_id returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, v_uid, 'status_changed', 'Người bán đã giao hàng — chờ khách xác nhận.',
          jsonb_build_object('delivered', true));

  perform public.notify_user(v_order.user_id, 'order_delivered',
    'Đơn ' || v_order.order_code || ' đã được giao',
    'Vui lòng kiểm tra và bấm "Đã nhận hàng" để hoàn tất.',
    '/orders/' || v_order.id);

  return v_order;
end;
$$;

-- 7) Khách xác nhận ĐÃ NHẬN → hoàn thành + tự đưa lên Minh chứng ---------------
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
    v_order.id, coalesce(v_item.category_name, 'Bloxus'), coalesce(v_item.name, 'Đơn hàng'),
    null, public.mask_handle(v_buyer.username), v_order.total, coalesce(v_staff_name, 'Bloxus'),
    v_img, 'Verified', now()
  );

  perform public.notify_user(v_order.assigned_ctv, 'order_completed',
    'Đơn ' || v_order.order_code || ' đã hoàn thành', 'Khách đã xác nhận nhận hàng.', '/work/orders/' || v_order.id);
  perform public.notify_admins('order_completed',
    'Đơn ' || v_order.order_code || ' hoàn thành', 'Khách đã xác nhận — đã lên Minh chứng.', '/work/orders/' || v_order.id);

  return v_order;
end;
$$;

-- 8) Admin cấp quyền theo email (customer/ctv/admin) ---------------------------
create or replace function public.set_user_role(p_email text, p_role public.user_role)
returns public.profiles
language plpgsql security definer set search_path = public
as $$
declare v_id uuid; v_profile public.profiles;
begin
  if not public.is_admin() then raise exception 'Chỉ admin mới được cấp quyền.'; end if;
  select id into v_id from auth.users where lower(email) = lower(btrim(p_email));
  if v_id is null then raise exception 'Không tìm thấy tài khoản với email này.'; end if;
  update public.profiles set role = p_role where id = v_id returning * into v_profile;
  perform public.notify_user(v_id, 'role_changed',
    'Quyền tài khoản của bạn đã thay đổi', 'Vai trò mới: ' || p_role, '/dashboard');
  return v_profile;
end;
$$;

-- 9) Quyền thực thi -------------------------------------------------------------
grant execute on function public.request_cancel(uuid, text)               to authenticated, service_role;
grant execute on function public.resolve_cancel(uuid, boolean, text)      to authenticated, service_role;
grant execute on function public.finalize_cancel(uuid)                    to authenticated, service_role;
grant execute on function public.mark_delivered(uuid, text[], text)       to authenticated, service_role;
grant execute on function public.confirm_received(uuid)                   to authenticated, service_role;
grant execute on function public.set_user_role(text, public.user_role)    to authenticated, service_role;

-- Xong. Luồng đơn mới đã sẵn sàng.
