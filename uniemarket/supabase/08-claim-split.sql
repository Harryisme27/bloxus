-- ============================================================================
-- UNIEMARKET V2 — 08-claim-split.sql
-- ----------------------------------------------------------------------------
-- • TÁCH ĐƠN: mỗi món trong giỏ thành 1 đơn riêng (mỗi đơn 1 sản phẩm) để CTV
--   khác nhau có thể nhận từng món.
-- • CTV TỰ NHẬN ĐƠN sau khi admin xác nhận thanh toán, theo DANH MỤC được phân
--   (hoặc quyền truy cập toàn bộ danh mục).
-- • TIMEOUT chống ôm đơn: CTV nhận mà quá X phút không giao → trả về hàng đợi.
-- • CẤM hoàn tiền sau khi đơn đã HOÀN THÀNH (khách đã xác nhận).
-- Dán TOÀN BỘ file này vào SQL Editor và bấm Run.
-- ============================================================================

-- 1) Cột / bảng mới ------------------------------------------------------------
alter table public.orders    add column if not exists category_id uuid references public.categories(id);
alter table public.profiles  add column if not exists ctv_all_categories boolean not null default false;

-- Phân danh mục cho CTV (CTV chỉ nhận đơn thuộc danh mục được phân).
create table if not exists public.ctv_categories (
  ctv_id      uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (ctv_id, category_id)
);
alter table public.ctv_categories enable row level security;
drop policy if exists "ctv_categories admin all" on public.ctv_categories;
create policy "ctv_categories admin all" on public.ctv_categories
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "ctv_categories self read" on public.ctv_categories;
create policy "ctv_categories self read" on public.ctv_categories
  for select using (ctv_id = auth.uid());

-- Thời gian timeout nhận đơn (phút). 0 = tắt. Mặc định 15.
insert into public.app_settings (key, value)
values ('claim_timeout_minutes', '15'::jsonb)
on conflict (key) do nothing;

-- 2) Cho phép chuyển in_progress → paid (khi trả đơn về hàng đợi) --------------
create or replace function public.guard_order_status()
returns trigger language plpgsql as $$
begin
  if old.status = new.status then return new; end if;
  if not (
    (old.status = 'pending_payment' and new.status in ('paid', 'cancelled')) or
    (old.status = 'paid'            and new.status in ('in_progress', 'cancelled', 'refunded')) or
    (old.status = 'in_progress'     and new.status in ('paid', 'completed', 'cancelled', 'refunded')) or
    (old.status = 'completed'       and new.status = 'refunded')
  ) then
    raise exception 'Không thể chuyển trạng thái đơn từ % sang %.', old.status, new.status;
  end if;
  return new;
end;
$$;

-- 3) place_order: MỖI MÓN = 1 ĐƠN riêng (trả về nhiều đơn) --------------------
-- Hàm cũ trả về 1 đơn; bản mới trả về NHIỀU đơn nên phải xóa hàm cũ trước
-- (Postgres không cho đổi kiểu trả về bằng create or replace).
drop function if exists public.place_order(jsonb, public.payment_method, text, text, text, text);

create function public.place_order(
  p_items           jsonb,
  p_payment_method  public.payment_method,
  p_game_username   text,
  p_contact_channel text,
  p_contact_value   text,
  p_note            text default null
)
returns setof public.orders
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_order public.orders; v_item jsonb; v_product public.products;
  v_qty int; v_unit_price bigint; v_selected jsonb; v_opts_type text;
  v_tier jsonb; v_from_id text; v_to_id text; v_from_pos bigint; v_to_pos bigint;
  v_steps bigint; v_step_price bigint; v_game text; v_channel text; v_contact text; v_note text;
begin
  if v_uid is null then raise exception 'Bạn cần đăng nhập để đặt hàng.'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Giỏ hàng trống hoặc không hợp lệ.';
  end if;
  if p_payment_method is null then raise exception 'Vui lòng chọn phương thức thanh toán.'; end if;

  v_game    := nullif(btrim(coalesce(p_game_username, '')), '');
  v_channel := nullif(btrim(coalesce(p_contact_channel, '')), '');
  v_contact := nullif(btrim(coalesce(p_contact_value, '')), '');
  v_note    := nullif(btrim(coalesce(p_note, '')), '');

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item ->> 'quantity')::integer, 1);
    if v_qty <= 0 or v_qty > 999 then raise exception 'Số lượng không hợp lệ.'; end if;

    select * into v_product from public.products
    where id = (v_item ->> 'product_id')::uuid and is_active = true for update;
    if not found then raise exception 'Sản phẩm không tồn tại hoặc đã ngừng bán.'; end if;

    v_selected := null;
    if v_product.kind = 'service' and v_product.service_options is not null then
      v_opts_type := v_product.service_options ->> 'type';
      if v_opts_type = 'tiers' then
        select t.value into v_tier from jsonb_array_elements(v_product.service_options -> 'tiers') as t(value)
        where t.value ->> 'id' = v_item -> 'selected_options' ->> 'tier_id';
        if v_tier is null then raise exception 'Vui lòng chọn gói dịch vụ hợp lệ cho "%".', v_product.name; end if;
        v_unit_price := (v_tier ->> 'price')::bigint;
        v_selected := jsonb_build_object('type','tiers','tier_id',v_tier->>'id','label',v_tier->>'label','price',v_unit_price);
      elsif v_opts_type = 'rank_range' then
        v_from_id := v_item -> 'selected_options' ->> 'from';
        v_to_id   := v_item -> 'selected_options' ->> 'to';
        v_step_price := (v_product.service_options ->> 'step_price')::bigint;
        select r.ord into v_from_pos from jsonb_array_elements(v_product.service_options -> 'ranks') with ordinality as r(value, ord) where r.value ->> 'id' = v_from_id;
        select r.ord into v_to_pos from jsonb_array_elements(v_product.service_options -> 'ranks') with ordinality as r(value, ord) where r.value ->> 'id' = v_to_id;
        if v_from_pos is null or v_to_pos is null or v_to_pos <= v_from_pos or v_step_price is null then
          raise exception 'Khoảng rank không hợp lệ cho "%".', v_product.name;
        end if;
        v_steps := v_to_pos - v_from_pos; v_unit_price := v_step_price * v_steps;
        v_selected := jsonb_build_object('type','rank_range','from',v_from_id,'to',v_to_id,'steps',v_steps,'step_price',v_step_price);
      else
        raise exception 'Cấu hình dịch vụ của "%" không hợp lệ.', v_product.name;
      end if;
    else
      v_unit_price := v_product.price;
    end if;

    if v_product.kind = 'item' and v_product.stock is not null then
      update public.products set stock = stock - v_qty where id = v_product.id and stock >= v_qty;
      if not found then raise exception 'Sản phẩm "%" không đủ hàng trong kho.', v_product.name; end if;
    end if;

    -- Tạo 1 ĐƠN cho riêng món này.
    insert into public.orders (
      user_id, status, payment_method, game_username, contact_channel, contact_value,
      customer_note, category_id, subtotal, discount, total
    ) values (
      v_uid, 'pending_payment', p_payment_method, v_game, v_channel, v_contact,
      v_note, v_product.category_id, v_unit_price * v_qty, 0, v_unit_price * v_qty
    ) returning * into v_order;

    insert into public.order_items (
      order_id, product_id, product_kind, name, category_name, image_url,
      unit_price, quantity, line_total, selected_options
    ) values (
      v_order.id, v_product.id, v_product.kind, v_product.name,
      (select name from public.categories where id = v_product.category_id),
      (case when array_length(v_product.images, 1) >= 1 then v_product.images[1] else null end),
      v_unit_price, v_qty, v_unit_price * v_qty, v_selected
    );

    insert into public.order_events (order_id, actor_id, event_type, note, meta)
    values (v_order.id, v_uid, 'created', 'Khách đặt đơn hàng.',
            jsonb_build_object('total', v_unit_price * v_qty, 'payment_method', p_payment_method));

    perform public.notify_admins('order_new', 'Đơn hàng mới ' || v_order.order_code,
      'Tổng tiền: ' || (v_unit_price * v_qty) || ' VNĐ — chờ xác nhận thanh toán.',
      '/work/orders/' || v_order.id);

    return next v_order;
  end loop;
  return;
end;
$$;

-- 4) CTV tự nhận đơn (paid + chưa ai nhận + đúng danh mục được phân) ----------
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

  -- Admin nhận được mọi đơn; CTV cần được phân danh mục (hoặc all-access).
  if not public.is_admin() then
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

-- 5) Hàng đợi đơn CTV có thể nhận (theo danh mục được phân) -------------------
create or replace function public.list_claimable_orders()
returns setof public.orders
language plpgsql security definer set search_path = public stable
as $$
declare v_uid uuid := auth.uid(); v_all boolean;
begin
  if not public.is_staff() then return; end if;
  if public.is_admin() then
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

-- 6) Trả đơn quá hạn về hàng đợi (chống ôm đơn) ------------------------------
create or replace function public.reclaim_stale_orders()
returns integer
language plpgsql security definer set search_path = public
as $$
declare v_minutes int; v_count int := 0; v_row public.orders;
begin
  if not public.is_staff() then return 0; end if;
  select coalesce((value #>> '{}')::int, 0) into v_minutes from public.app_settings where key = 'claim_timeout_minutes';
  if v_minutes is null or v_minutes <= 0 then return 0; end if;

  for v_row in
    select * from public.orders
    where status = 'in_progress' and delivered_at is null
      and cancel_requested_at is null and refund_requested_at is null
      and assigned_at is not null and assigned_at < now() - make_interval(mins => v_minutes)
    for update
  loop
    update public.orders
    set status = 'paid', assigned_ctv = null, assigned_by = null, assigned_at = null
    where id = v_row.id;
    insert into public.order_events (order_id, actor_id, event_type, note, meta)
    values (v_row.id, null, 'note', 'Quá hạn xử lý — đơn được trả về hàng đợi.', null);
    perform public.notify_user(v_row.assigned_ctv, 'order_reclaimed',
      'Đơn ' || v_row.order_code || ' đã bị thu hồi', 'Quá thời gian xử lý — đơn quay lại hàng đợi.', '/work');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- 7) Admin phân danh mục cho CTV --------------------------------------------
create or replace function public.set_ctv_categories(p_ctv uuid, p_category_ids uuid[], p_all boolean default false)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Chỉ admin mới phân danh mục.'; end if;
  update public.profiles set ctv_all_categories = coalesce(p_all, false) where id = p_ctv;
  delete from public.ctv_categories where ctv_id = p_ctv;
  if not coalesce(p_all, false) and p_category_ids is not null then
    insert into public.ctv_categories (ctv_id, category_id)
    select p_ctv, unnest(p_category_ids) on conflict do nothing;
  end if;
end;
$$;

-- 8) Cấm hoàn tiền sau khi đã HOÀN THÀNH (chỉ paid / in_progress) -------------
create or replace function public.request_refund(p_order_id uuid, p_reason text)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_order public.orders;
begin
  if v_uid is null then raise exception 'Bạn cần đăng nhập.'; end if;
  if nullif(btrim(coalesce(p_reason,'')),'') is null then raise exception 'Vui lòng nhập lý do hoàn tiền.'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.user_id <> v_uid then raise exception 'Bạn không có quyền với đơn này.'; end if;
  if v_order.status not in ('paid', 'in_progress') then
    raise exception 'Đơn đã hoàn thành hoặc không ở trạng thái được hoàn tiền.';
  end if;
  if v_order.refund_requested_at is not null then raise exception 'Đơn đã có yêu cầu hoàn tiền đang chờ xử lý.'; end if;

  update public.orders set refund_requested_at = now(), refund_reason = btrim(p_reason), refund_request_by = v_uid
  where id = p_order_id returning * into v_order;
  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, v_uid, 'note', 'Khách yêu cầu hoàn tiền: ' || btrim(p_reason), null);
  perform public.notify_user(v_order.assigned_ctv, 'refund_requested',
    '⚠️ Đơn ' || v_order.order_code || ' yêu cầu HOÀN TIỀN', 'Lý do: ' || btrim(p_reason), '/work/orders/' || v_order.id);
  perform public.notify_admins('refund_requested', '⚠️ Yêu cầu hoàn tiền ' || v_order.order_code,
    'Lý do: ' || btrim(p_reason) || ' — tự động sau 1h nếu admin chưa xử lý.', '/work/orders/' || v_order.id);
  return v_order;
end;
$$;

-- 9) Quyền + view public_profiles không đổi. Grants cho hàm mới. --------------
-- place_order vừa bị drop + tạo lại nên phải cấp lại quyền.
grant execute on function public.place_order(jsonb, public.payment_method, text, text, text, text) to authenticated, service_role;
grant execute on function public.claim_order(uuid)                      to authenticated, service_role;
grant execute on function public.list_claimable_orders()                to authenticated, service_role;
grant execute on function public.reclaim_stale_orders()                 to authenticated, service_role;
grant execute on function public.set_ctv_categories(uuid, uuid[], boolean) to authenticated, service_role;

-- Xong.
