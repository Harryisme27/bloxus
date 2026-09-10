-- ============================================================================
-- 14b-manager-perms.sql — Phân quyền cho vai trò MANAGER
-- ----------------------------------------------------------------------------
-- ⚠️ Chạy SAU khi 14a-manager-enum.sql đã chạy xong (2 lần bấm Run riêng).
--
-- Manager được:
--   - Quản lý danh mục & sản phẩm (giá, khu vực, ảnh, sắp xếp)
--   - Quản lý CTV (phân danh mục cho CTV)
--   - Giao đơn cho CTV + tự nhận đơn (mọi danh mục)
--   - Xem mọi đơn + chat hỗ trợ khách (mọi thread đơn + kênh staff)
--   - Nhận thông báo đơn mới / hàng đợi như admin
-- Manager KHÔNG được:
--   - Settings (cổng thanh toán, payout, timeout)
--   - Xác nhận thanh toán, duyệt hoàn tiền/hủy (quyền tiền bạc = admin)
--   - Đổi vai trò tài khoản
-- ============================================================================

-- 1) Helpers ------------------------------------------------------------------
create or replace function public.is_admin_or_manager()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'manager')
  );
$$;

-- is_staff: thêm manager (mở kênh chat staff, upload proof, claim...).
create or replace function public.is_staff()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'manager', 'ctv')
  );
$$;

-- 2) RLS: danh mục & sản phẩm — manager ghi được ------------------------------
drop policy if exists "categories: admin write" on public.categories;
create policy "categories: admin write" on public.categories
  for all to authenticated
  using (public.is_admin_or_manager())
  with check (public.is_admin_or_manager());

drop policy if exists "categories: public read active" on public.categories;
create policy "categories: public read active" on public.categories
  for select to anon, authenticated
  using (is_active = true or public.is_admin_or_manager());

drop policy if exists "products: admin write" on public.products;
create policy "products: admin write" on public.products
  for all to authenticated
  using (public.is_admin_or_manager())
  with check (public.is_admin_or_manager());

drop policy if exists "products: public read active" on public.products;
create policy "products: public read active" on public.products
  for select to anon, authenticated
  using (is_active = true or public.is_admin_or_manager());

-- 3) RLS: đơn hàng — manager xem mọi đơn (hỗ trợ khách) -----------------------
drop policy if exists "orders: owner ctv admin select" on public.orders;
create policy "orders: owner ctv admin select" on public.orders
  for select to authenticated
  using (user_id = auth.uid() or assigned_ctv = auth.uid() or public.is_admin_or_manager());

drop policy if exists "order_items: via parent order" on public.order_items;
create policy "order_items: via parent order" on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or o.assigned_ctv = auth.uid() or public.is_admin_or_manager())
  ));

drop policy if exists "order_events: via parent order" on public.order_events;
create policy "order_events: via parent order" on public.order_events
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or o.assigned_ctv = auth.uid() or public.is_admin_or_manager())
  ));

-- 4) RLS: phân danh mục CTV — manager quản lý được ----------------------------
drop policy if exists "ctv_categories admin all" on public.ctv_categories;
create policy "ctv_categories admin all" on public.ctv_categories
  for all using (public.is_admin_or_manager()) with check (public.is_admin_or_manager());

-- 5) Storage: manager upload ảnh sản phẩm / site ------------------------------
drop policy if exists "storage: admin write product/site" on storage.objects;
create policy "storage: admin write product/site" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('product-images', 'site-assets') and public.is_admin_or_manager());

drop policy if exists "storage: admin update product/site" on storage.objects;
create policy "storage: admin update product/site" on storage.objects
  for update to authenticated
  using (bucket_id in ('product-images', 'site-assets') and public.is_admin_or_manager())
  with check (bucket_id in ('product-images', 'site-assets') and public.is_admin_or_manager());

drop policy if exists "storage: admin delete product/site" on storage.objects;
create policy "storage: admin delete product/site" on storage.objects
  for delete to authenticated
  using (bucket_id in ('product-images', 'site-assets') and public.is_admin_or_manager());

-- 6) Chat: manager truy cập mọi thread đơn (hỗ trợ khách) ---------------------
create or replace function public.can_access_thread(p_thread_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.threads t
    where t.id = p_thread_id
      and (
        public.is_admin_or_manager()
        or (t.kind = 'staff' and public.is_staff())
        or (
          t.kind = 'order'
          and exists (
            select 1 from public.orders o
            where o.id = t.order_id
              and (o.user_id = auth.uid() or o.assigned_ctv = auth.uid())
          )
        )
      )
  );
$$;

-- 7) notify_admins: manager cũng nhận thông báo vận hành ----------------------
create or replace function public.notify_admins(
  p_type text, p_title text, p_body text, p_link text
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  select id, p_type, p_title, p_body, p_link
  from public.profiles
  where role in ('admin', 'manager');
end;
$$;

-- 8) assign_order: manager giao được đơn; người nhận là CTV hoặc manager ------
create or replace function public.assign_order(p_order_id uuid, p_ctv uuid)
returns public.orders
language plpgsql security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if not public.is_admin_or_manager() then
    raise exception 'Chỉ admin/manager mới được giao đơn.';
  end if;
  if not exists (select 1 from public.profiles where id = p_ctv and role in ('ctv', 'manager')) then
    raise exception 'Người được giao phải là CTV hoặc manager.';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Không tìm thấy đơn hàng.';
  end if;
  if v_order.status <> 'paid' then
    raise exception 'Chỉ giao được đơn đã xác nhận thanh toán.';
  end if;

  update public.orders
  set status = 'in_progress',
      assigned_ctv = p_ctv,
      assigned_by = auth.uid(),
      assigned_at = now()
  where id = p_order_id
  returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, auth.uid(), 'assigned', 'Admin giao đơn cho CTV.',
          jsonb_build_object('ctv_id', p_ctv));

  perform public.notify_user(
    p_ctv, 'order_assigned',
    'Bạn được giao đơn ' || v_order.order_code,
    'Vào khu làm việc để xem chi tiết và liên hệ khách.',
    '/work/orders/' || v_order.id
  );

  return v_order;
end;
$$;

-- 9) claim_order / list_claimable_orders: manager nhận mọi danh mục ----------
create or replace function public.claim_order(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_order public.orders; v_all boolean;
begin
  if not public.is_staff() then raise exception 'Chỉ nhân viên mới nhận được đơn.'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.status <> 'paid' or v_order.assigned_ctv is not null then
    raise exception 'Đơn này không còn trong hàng đợi để nhận.';
  end if;

  -- Admin/manager nhận được mọi đơn; CTV cần được phân danh mục (hoặc all-access).
  if not public.is_admin_or_manager() then
    select ctv_all_categories into v_all from public.profiles where id = v_uid;
    if not coalesce(v_all, false)
       and not exists (select 1 from public.ctv_categories
                       where ctv_id = v_uid and category_id = v_order.category_id) then
      raise exception 'Bạn không được phân công danh mục của đơn này.';
    end if;
  end if;

  update public.orders
  set status = 'in_progress', assigned_ctv = v_uid, assigned_by = v_uid, assigned_at = now()
  where id = p_order_id returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, v_uid, 'assigned', 'CTV tự nhận đơn.', jsonb_build_object('ctv_id', v_uid));
  perform public.notify_user(v_order.user_id, 'order_assigned',
    'Đơn ' || v_order.order_code || ' đã có người xử lý',
    'Một cộng tác viên đã nhận đơn và sẽ liên hệ với bạn.', '/orders/' || v_order.id);
  return v_order;
end;
$$;

create or replace function public.list_claimable_orders()
returns setof public.orders
language plpgsql security definer set search_path = public stable
as $$
declare v_uid uuid := auth.uid(); v_all boolean;
begin
  if not public.is_staff() then return; end if;
  if public.is_admin_or_manager() then
    return query select * from public.orders
      where status = 'paid' and assigned_ctv is null order by created_at asc;
    return;
  end if;
  select ctv_all_categories into v_all from public.profiles where id = v_uid;
  return query select o.* from public.orders o
    where o.status = 'paid' and o.assigned_ctv is null
      and (coalesce(v_all, false)
           or exists (select 1 from public.ctv_categories c where c.ctv_id = v_uid and c.category_id = o.category_id))
    order by o.created_at asc;
end;
$$;

-- 10) set_ctv_categories: manager phân danh mục cho CTV -----------------------
create or replace function public.set_ctv_categories(p_ctv uuid, p_category_ids uuid[], p_all boolean default false)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin_or_manager() then raise exception 'Chỉ admin/manager mới phân danh mục.'; end if;
  update public.profiles set ctv_all_categories = coalesce(p_all, false) where id = p_ctv;
  delete from public.ctv_categories where ctv_id = p_ctv;
  if not coalesce(p_all, false) and p_category_ids is not null then
    insert into public.ctv_categories (ctv_id, category_id)
    select p_ctv, unnest(p_category_ids) on conflict do nothing;
  end if;
end;
$$;

-- 11) notify_claimable_ctvs: manager cũng nhận thông báo hàng đợi -------------
create or replace function public.notify_claimable_ctvs(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id;
  if not found then return; end if;

  insert into public.notifications (user_id, type, title, body, link)
  select p.id, 'order_claimable',
         '🧾 Hàng đợi mới · ' || v_order.order_code,
         'Có đơn mới trong hàng chờ — vào nhận ngay.',
         '/work/orders'
  from public.profiles p
  where (
      p.role = 'manager'
      or (p.role = 'ctv' and (
        p.ctv_all_categories
        or exists (
          select 1 from public.ctv_categories cc
          where cc.ctv_id = p.id and cc.category_id = v_order.category_id
        )
      ))
    );
end;
$$;

-- Xong. (guard_profile_role giữ nguyên: chỉ admin đổi được vai trò.)
