-- ============================================================================
-- 34 — Thanh toán Stripe qua Edge Functions
-- Chạy trong Supabase Dashboard → SQL Editor.
--
-- system_confirm_payment: bản "hệ thống" của confirm_payment — dành riêng cho
-- webhook Stripe (Edge Function gọi bằng SERVICE ROLE, không có auth.uid()).
-- Logic giống confirm_payment: đơn sang 'paid', ghi event, báo khách, giao
-- ngay nếu instant delivery, ngược lại báo CTV nhận đơn.
-- ============================================================================

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
  -- Idempotent: webhook Stripe có thể gọi lại — đơn đã xử lý thì trả về luôn.
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

-- Chỉ service role (Edge Function) được gọi — khách/CTV/admin dùng RPC thường.
revoke execute on function public.system_confirm_payment(uuid, text) from public, anon, authenticated;
grant execute on function public.system_confirm_payment(uuid, text) to service_role;

-- Xong.
