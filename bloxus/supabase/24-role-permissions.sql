-- ============================================================================
-- 24-role-permissions.sql — Admin chỉnh quyền (permission) cho các role có sẵn
-- ----------------------------------------------------------------------------
-- Giữ nguyên 4 role enum (RLS bảo mật nền). Thêm 1 lớp "quyền tuỳ chọn" mà admin
-- bật/tắt cho Manager và CTV. Enforce ở server qua helper role_can().
-- Admin luôn có mọi quyền. Chạy 1 lần trong Supabase SQL Editor.
-- ============================================================================

-- 1) Setting quyền theo role (public read để UI ẩn/hiện; không nhạy cảm).
insert into public.app_settings (key, value) values (
  'role_permissions',
  '{
    "manager": {"manage_catalog": true, "manage_ctv": true, "assign_orders": true, "confirm_payment": true, "resolve_refund": true, "claim_orders": true},
    "ctv":     {"manage_catalog": false,"manage_ctv": false,"assign_orders": false,"confirm_payment": false,"resolve_refund": false,"claim_orders": true}
  }'::jsonb
) on conflict (key) do nothing;

drop policy if exists "app_settings: public keys read" on public.app_settings;
create policy "app_settings: public keys read" on public.app_settings
  for select to anon, authenticated
  using (
    key in ('bank_name','bank_account','bank_holder','momo_number','momo_qr_url','brand','ctv_apply_open','role_permissions')
    or public.is_admin()
  );

-- 2) role_can(perm): admin -> true; ngược lại tra role_permissions theo role.
create or replace function public.role_can(p_perm text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case
    when (select role from public.profiles where id = auth.uid()) = 'admin' then true
    else coalesce(
      (
        (select value from public.app_settings where key = 'role_permissions')
          -> (select role::text from public.profiles where id = auth.uid())
          ->> p_perm
      )::boolean,
      false
    )
  end;
$$;
grant execute on function public.role_can(text) to authenticated, service_role;

-- 3) RLS danh mục & sản phẩm: admin HOẶC role_can('manage_catalog') -----------
drop policy if exists "categories: admin write" on public.categories;
create policy "categories: admin write" on public.categories
  for all to authenticated
  using (public.is_admin() or public.role_can('manage_catalog'))
  with check (public.is_admin() or public.role_can('manage_catalog'));

drop policy if exists "products: admin write" on public.products;
create policy "products: admin write" on public.products
  for all to authenticated
  using (public.is_admin() or public.role_can('manage_catalog'))
  with check (public.is_admin() or public.role_can('manage_catalog'));

drop policy if exists "storage: admin write product/site" on storage.objects;
create policy "storage: admin write product/site" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('product-images','site-assets') and (public.is_admin() or public.role_can('manage_catalog')));
drop policy if exists "storage: admin update product/site" on storage.objects;
create policy "storage: admin update product/site" on storage.objects
  for update to authenticated
  using (bucket_id in ('product-images','site-assets') and (public.is_admin() or public.role_can('manage_catalog')))
  with check (bucket_id in ('product-images','site-assets') and (public.is_admin() or public.role_can('manage_catalog')));
drop policy if exists "storage: admin delete product/site" on storage.objects;
create policy "storage: admin delete product/site" on storage.objects
  for delete to authenticated
  using (bucket_id in ('product-images','site-assets') and (public.is_admin() or public.role_can('manage_catalog')));

-- 4) set_ctv_categories: admin HOẶC role_can('manage_ctv') --------------------
create or replace function public.set_ctv_categories(p_ctv uuid, p_category_ids uuid[], p_all boolean default false)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not (public.is_admin() or public.role_can('manage_ctv')) then
    raise exception 'Không có quyền phân danh mục.';
  end if;
  update public.profiles set ctv_all_categories = coalesce(p_all, false) where id = p_ctv;
  delete from public.ctv_categories where ctv_id = p_ctv;
  if not coalesce(p_all, false) and p_category_ids is not null then
    insert into public.ctv_categories (ctv_id, category_id)
    select p_ctv, unnest(p_category_ids) on conflict do nothing;
  end if;
end;
$$;

-- 5) assign_order: admin HOẶC role_can('assign_orders') ----------------------
create or replace function public.assign_order(p_order_id uuid, p_ctv uuid)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare v_order public.orders;
begin
  if not (public.is_admin() or public.role_can('assign_orders')) then
    raise exception 'Không có quyền giao đơn.';
  end if;
  if not exists (select 1 from public.profiles where id = p_ctv and role in ('ctv', 'manager')) then
    raise exception 'Người được giao phải là CTV hoặc manager.';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.status <> 'paid' then raise exception 'Chỉ giao được đơn đã xác nhận thanh toán.'; end if;

  update public.orders
  set status = 'in_progress', assigned_ctv = p_ctv, assigned_by = auth.uid(), assigned_at = now()
  where id = p_order_id returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, auth.uid(), 'assigned', 'Admin giao đơn cho CTV.', jsonb_build_object('ctv_id', p_ctv));
  perform public.notify_user(p_ctv, 'order_assigned',
    'Bạn được giao đơn ' || v_order.order_code,
    'Vào khu làm việc để xem chi tiết và liên hệ khách.', '/work/orders/' || v_order.id);
  return v_order;
end;
$$;

-- 6) resolve_refund: admin HOẶC role_can('resolve_refund') -------------------
create or replace function public.resolve_refund(p_order_id uuid, p_approve boolean, p_note text default null)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare v_order public.orders;
begin
  if not (public.is_admin() or public.role_can('resolve_refund')) then
    raise exception 'Không có quyền duyệt hoàn tiền.';
  end if;
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

-- 7) confirm_payment: admin HOẶC role_can('confirm_payment') -----------------
--    (giữ nguyên nhánh instant delivery của 20b)
create or replace function public.confirm_payment(p_order_id uuid, p_ref text default null)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders;
  v_instant boolean := false;
  v_content text;
begin
  if not (public.is_admin() or public.role_can('confirm_payment')) then
    raise exception 'Không có quyền xác nhận thanh toán.';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.status <> 'pending_payment' then raise exception 'Đơn không ở trạng thái chờ thanh toán.'; end if;

  update public.orders
  set status = 'paid',
      payment_ref = coalesce(nullif(btrim(coalesce(p_ref, '')), ''), payment_ref),
      paid_confirmed_at = now(), paid_confirmed_by = auth.uid()
  where id = p_order_id returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, auth.uid(), 'payment_confirmed', 'Admin xác nhận đã nhận thanh toán.',
          jsonb_build_object('payment_ref', p_ref));
  perform public.notify_user(v_order.user_id, 'order_paid',
    'Đơn ' || v_order.order_code || ' đã được xác nhận thanh toán',
    'Chúng tôi sẽ xử lý đơn của bạn ngay.', '/orders/' || v_order.id);

  select p.instant_delivery, ps.content into v_instant, v_content
  from public.order_items oi
  join public.products p on p.id = oi.product_id
  left join public.product_secrets ps on ps.product_id = p.id
  where oi.order_id = p_order_id limit 1;

  if coalesce(v_instant, false) then
    update public.orders
    set status = 'completed', delivered_at = now(),
        delivery_content = v_content, delivery_note = 'Giao tự động (instant delivery).'
    where id = p_order_id returning * into v_order;
    insert into public.order_events (order_id, actor_id, event_type, note, meta)
    values (p_order_id, auth.uid(), 'status_changed', 'Giao ngay — đơn đã hoàn tất tự động.',
            jsonb_build_object('instant', true));
    perform public.notify_user(v_order.user_id, 'order_delivered',
      'Đơn ' || v_order.order_code || ' đã được giao ngay',
      'Xem nội dung giao trên trang đơn hàng của bạn.', '/orders/' || v_order.id);
  else
    perform public.notify_claimable_ctvs(p_order_id);
  end if;

  return v_order;
end;
$$;

-- Xong.
