-- ============================================================================
-- BLOXUS V2 — 10-payment-gateways.sql
-- ----------------------------------------------------------------------------
-- Cổng thanh toán cấu hình được: admin nhập API/thông tin cho từng cổng
-- (Chuyển khoản, Momo, Stripe, Crypto, PayPal…) và CHỌN cổng nào HIỂN THỊ cho
-- khách. Đơn lưu thêm cột payment_gateway (id cổng khách chọn).
-- Dán TOÀN BỘ file này vào SQL Editor và bấm Run.
-- ============================================================================

-- 1) Cột mới + cấu hình mặc định ---------------------------------------------
alter table public.orders add column if not exists payment_gateway text;

-- payment_gateways: bật/tắt + cấu hình từng cổng. Admin sửa trong Cài đặt.
insert into public.app_settings (key, value)
values ('payment_gateways', jsonb_build_object(
  'bank_transfer', jsonb_build_object('enabled', true),
  'momo',          jsonb_build_object('enabled', true),
  'stripe',        jsonb_build_object('enabled', false, 'publishable_key', '', 'secret_key', '', 'link', ''),
  'crypto',        jsonb_build_object('enabled', false, 'network', '', 'wallet_address', ''),
  'paypal',        jsonb_build_object('enabled', false, 'client_id', '', 'link', '')
))
on conflict (key) do nothing;

-- 2) place_order: thêm p_gateway (id cổng khách chọn) ------------------------
drop function if exists public.place_order(jsonb, public.payment_method, text, text, text, text);

create function public.place_order(
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
  v_gateway text;
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

    perform public.notify_admins('order_new', 'Đơn hàng mới ' || v_order.order_code,
      'Tổng tiền: ' || (v_unit_price * v_qty) || ' VNĐ — chờ xác nhận thanh toán.',
      '/work/orders/' || v_order.id);

    return next v_order;
  end loop;
  return;
end;
$$;

grant execute on function public.place_order(jsonb, public.payment_method, text, text, text, text, text) to authenticated, service_role;

-- Xong.
