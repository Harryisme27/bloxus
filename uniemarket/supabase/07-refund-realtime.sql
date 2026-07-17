-- ============================================================================
-- UNIEMARKET V2 — 07-refund-realtime.sql
-- ----------------------------------------------------------------------------
-- • Luồng REFUND (hoàn tiền): khách yêu cầu hoàn tiền kèm lý do → tự động sau
--   1h (khách tự chốt) hoặc admin duyệt.
-- • last_seen_at: hiển thị "Hoạt động gần đây" của khách/người bán trong chat.
-- Dán TOÀN BỘ file này vào SQL Editor và bấm Run.
-- ============================================================================

-- 1) Cột mới ------------------------------------------------------------------
alter table public.orders
  add column if not exists refund_requested_at timestamptz,
  add column if not exists refund_reason       text,
  add column if not exists refund_request_by   uuid;

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

-- 2) View public_profiles + last_seen_at (thêm cột ở cuối) --------------------
create or replace view public.public_profiles as
  select id, display_name, username, avatar_url, role, last_seen_at
  from public.profiles;
grant select on public.public_profiles to authenticated;

-- 3) touch_last_seen: cập nhật mốc hoạt động của tôi --------------------------
create or replace function public.touch_last_seen()
returns void language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then return; end if;
  update public.profiles set last_seen_at = now() where id = auth.uid();
end;
$$;

-- 4) Khách yêu cầu hoàn tiền (kèm lý do) --------------------------------------
create or replace function public.request_refund(p_order_id uuid, p_reason text)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_order public.orders;
begin
  if v_uid is null then raise exception 'Bạn cần đăng nhập.'; end if;
  if nullif(btrim(coalesce(p_reason,'')),'') is null then
    raise exception 'Vui lòng nhập lý do hoàn tiền.';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.user_id <> v_uid then raise exception 'Bạn không có quyền với đơn này.'; end if;
  if v_order.status not in ('paid', 'in_progress', 'completed') then
    raise exception 'Đơn ở trạng thái này không thể yêu cầu hoàn tiền.';
  end if;
  if v_order.refund_requested_at is not null then
    raise exception 'Đơn đã có yêu cầu hoàn tiền đang chờ xử lý.';
  end if;

  update public.orders
  set refund_requested_at = now(), refund_reason = btrim(p_reason), refund_request_by = v_uid
  where id = p_order_id returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, v_uid, 'note', 'Khách yêu cầu hoàn tiền: ' || btrim(p_reason), null);

  perform public.notify_user(v_order.assigned_ctv, 'refund_requested',
    '⚠️ Đơn ' || v_order.order_code || ' yêu cầu HOÀN TIỀN',
    'Lý do: ' || btrim(p_reason), '/work/orders/' || v_order.id);
  perform public.notify_admins('refund_requested',
    '⚠️ Yêu cầu hoàn tiền ' || v_order.order_code,
    'Lý do: ' || btrim(p_reason) || ' — tự động sau 1h nếu admin chưa xử lý.',
    '/work/orders/' || v_order.id);
  return v_order;
end;
$$;

-- 5) Thực thi hoàn tiền (dùng chung cho admin duyệt & khách tự chốt) ----------
create or replace function public.do_refund(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;

  -- Hoàn kho nếu chưa giao (hàng chưa trao tay).
  if v_order.delivered_at is null then
    update public.products p set stock = p.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = p_order_id and oi.product_id = p.id
      and oi.product_kind = 'item' and p.stock is not null;
  end if;

  update public.orders
  set status = 'refunded', refund_requested_at = null
  where id = p_order_id returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, auth.uid(), 'refunded', 'Đơn đã được hoàn tiền.', null);
  perform public.notify_user(v_order.user_id, 'order_refunded',
    'Đơn ' || v_order.order_code || ' đã được hoàn tiền',
    'Yêu cầu hoàn tiền của bạn đã được xử lý.', '/orders/' || v_order.id);
  return v_order;
end;
$$;

-- 6) Admin duyệt/từ chối hoàn tiền --------------------------------------------
create or replace function public.resolve_refund(p_order_id uuid, p_approve boolean, p_note text default null)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare v_order public.orders;
begin
  if not public.is_admin() then raise exception 'Chỉ admin mới được duyệt hoàn tiền.'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.refund_requested_at is null then raise exception 'Đơn không có yêu cầu hoàn tiền.'; end if;

  if p_approve then return public.do_refund(p_order_id); end if;

  update public.orders set refund_requested_at = null, refund_reason = null, refund_request_by = null
  where id = p_order_id returning * into v_order;
  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, auth.uid(), 'note', 'Admin từ chối hoàn tiền.' ||
          coalesce(' ' || nullif(btrim(coalesce(p_note,'')),''), ''), null);
  perform public.notify_user(v_order.user_id, 'refund_rejected',
    'Yêu cầu hoàn tiền đơn ' || v_order.order_code || ' bị từ chối',
    coalesce(nullif(btrim(coalesce(p_note,'')),''), 'Vui lòng trao đổi với người bán.'),
    '/orders/' || v_order.id);
  return v_order;
end;
$$;

-- 7) Khách tự chốt hoàn tiền sau 1h nếu admin chưa xử lý ----------------------
create or replace function public.finalize_refund(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.user_id <> v_uid then raise exception 'Bạn không có quyền với đơn này.'; end if;
  if v_order.refund_requested_at is null then raise exception 'Đơn không có yêu cầu hoàn tiền.'; end if;
  if now() - v_order.refund_requested_at < interval '1 hour' then
    raise exception 'Chưa đủ 1 giờ kể từ khi yêu cầu hoàn tiền.';
  end if;
  return public.do_refund(p_order_id);
end;
$$;

-- 8) Quyền thực thi -----------------------------------------------------------
grant execute on function public.touch_last_seen()                     to authenticated, service_role;
grant execute on function public.request_refund(uuid, text)            to authenticated, service_role;
grant execute on function public.resolve_refund(uuid, boolean, text)   to authenticated, service_role;
grant execute on function public.finalize_refund(uuid)                 to authenticated, service_role;
revoke execute on function public.do_refund(uuid) from public, anon, authenticated;

-- Xong. Luồng hoàn tiền + last_seen đã sẵn sàng.
