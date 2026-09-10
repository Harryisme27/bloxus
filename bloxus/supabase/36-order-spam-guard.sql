-- ============================================================================
-- 36 — Chống spam tạo đơn (checkout rồi bỏ)
-- Chạy trong Supabase Dashboard → SQL Editor.
--
-- Vấn đề: place_order trừ kho NGAY khi tạo đơn chờ thanh toán -> khách xấu có
-- thể spam đặt đơn không trả tiền để khóa kho + dội thông báo admin.
-- Giải pháp 2 lớp:
--   1. Mỗi tài khoản tối đa 5 đơn đang chờ thanh toán — vượt là chặn.
--   2. Đơn chờ thanh toán quá 24 giờ tự hủy + HOÀN KHO (dọn mỗi lần có người
--      đặt đơn mới — không cần cron).
-- ============================================================================

-- 1) Tự hủy đơn chờ thanh toán quá hạn + hoàn kho --------------------------
create or replace function public.expire_stale_pending_orders(p_max_age interval default interval '24 hours')
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_order record;
begin
  for v_order in
    select id from public.orders
    where status = 'pending_payment' and created_at < now() - p_max_age
    for update skip locked
  loop
    -- Hoàn kho các món quản lý tồn kho.
    update public.products p
    set stock = p.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = v_order.id and oi.product_id = p.id
      and p.kind = 'item' and p.stock is not null;

    update public.orders
    set status = 'cancelled', cancelled_at = now(),
        cancel_reason = 'Tự hủy: quá 24 giờ chưa thanh toán.'
    where id = v_order.id;

    insert into public.order_events (order_id, actor_id, event_type, note, meta)
    values (v_order.id, null, 'cancelled', 'Đơn tự hủy vì quá hạn thanh toán (24 giờ). Kho đã hoàn.',
            jsonb_build_object('auto_expired', true));
  end loop;
end;
$$;

revoke execute on function public.expire_stale_pending_orders(interval) from public, anon, authenticated;
grant execute on function public.expire_stale_pending_orders(interval) to service_role;

-- 2) place_order: dọn đơn quá hạn + giới hạn 5 đơn chờ / tài khoản ----------
create or replace function public.place_order(
  p_items           jsonb,
  p_payment_method  public.payment_method,
  p_game_username   text,
  p_contact_channel text,
  p_contact_value   text,
  p_note            text default null,
  p_gateway         text default null
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
  v_gateway text; v_pending int;
begin
  if v_uid is null then raise exception 'Bạn cần đăng nhập để đặt hàng.'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Giỏ hàng trống hoặc không hợp lệ.';
  end if;
  if p_payment_method is null then raise exception 'Vui lòng chọn phương thức thanh toán.'; end if;

  -- Dọn đơn chờ thanh toán quá hạn (hoàn kho) trước khi kiểm tra giới hạn.
  perform public.expire_stale_pending_orders();

  -- Giới hạn chống spam: tối đa 5 đơn đang chờ thanh toán mỗi tài khoản.
  select count(*) into v_pending from public.orders
  where user_id = v_uid and status = 'pending_payment';
  if v_pending + jsonb_array_length(p_items) > 5 then
    raise exception 'Bạn đang có % đơn chờ thanh toán. Vui lòng thanh toán hoặc hủy bớt trước khi đặt thêm.', v_pending;
  end if;

  v_game    := nullif(btrim(coalesce(p_game_username, '')), '');
  v_channel := nullif(btrim(coalesce(p_contact_channel, '')), '');
  v_contact := nullif(btrim(coalesce(p_contact_value, '')), '');
  v_note    := nullif(btrim(coalesce(p_note, '')), '');
  v_gateway := coalesce(nullif(btrim(coalesce(p_gateway, '')), ''), p_payment_method::text);

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

    insert into public.orders (
      user_id, status, payment_method, payment_gateway, game_username, contact_channel, contact_value,
      customer_note, category_id, subtotal, discount, total
    ) values (
      v_uid, 'pending_payment', p_payment_method, v_gateway, v_game, v_channel, v_contact,
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
            jsonb_build_object('total', v_unit_price * v_qty, 'gateway', v_gateway));

    -- Đơn Stripe: KHÔNG báo admin lúc tạo — chỉ báo khi tiền đã vào (webhook).
    -- Cổng thủ công vẫn báo như cũ (admin cần biết để chờ xác nhận CK).
    if v_gateway <> 'stripe' then
      perform public.notify_admins('order_new', 'Đơn hàng mới ' || v_order.order_code,
        'Tổng tiền: ' || (v_unit_price * v_qty) || ' VNĐ — chờ xác nhận thanh toán.',
        '/work/orders/' || v_order.id);
    end if;

    return next v_order;
  end loop;
  return;
end;
$$;

grant execute on function public.place_order(jsonb, public.payment_method, text, text, text, text, text) to authenticated, service_role;

-- 3) system_confirm_payment (webhook Stripe): BÁO ADMIN khi tiền vào ---------
-- (Bản 34 chưa báo admin — giờ đơn Stripe "xuất hiện" với admin đúng lúc này.)
create or replace function public.system_confirm_payment(p_order_id uuid, p_ref text default null)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders;
  v_instant boolean := false;
  v_content text;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.status <> 'pending_payment' then return v_order; end if;

  update public.orders
  set status = 'paid',
      payment_ref = coalesce(nullif(btrim(coalesce(p_ref, '')), ''), payment_ref),
      paid_confirmed_at = now()
  where id = p_order_id returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, null, 'payment_confirmed', 'Stripe xác nhận thanh toán thành công.',
          jsonb_build_object('payment_ref', p_ref, 'source', 'stripe'));
  perform public.notify_user(v_order.user_id, 'order_paid',
    'Đơn ' || v_order.order_code || ' đã được xác nhận thanh toán',
    'Chúng tôi sẽ xử lý đơn của bạn ngay.', '/orders/' || v_order.id);
  perform public.notify_admins('order_new', '💳 Đơn ' || v_order.order_code || ' đã thanh toán qua Stripe',
    'Tổng tiền: ' || v_order.total || ' VNĐ — sẵn sàng xử lý.', '/work/orders/' || v_order.id);

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
    values (p_order_id, null, 'status_changed', 'Giao ngay — đơn đã hoàn tất tự động.',
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

revoke execute on function public.system_confirm_payment(uuid, text) from public, anon, authenticated;
grant execute on function public.system_confirm_payment(uuid, text) to service_role;

-- Xong. Thử: đặt 6 đơn liên tiếp không trả tiền -> đơn thứ 6 bị chặn.
