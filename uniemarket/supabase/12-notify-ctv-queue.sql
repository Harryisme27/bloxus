-- ============================================================================
-- 12-notify-ctv-queue.sql — Báo CTV khi có ĐƠN MỚI trong HÀNG CHỜ NHẬN
-- ----------------------------------------------------------------------------
-- Khi admin xác nhận thanh toán (pending_payment -> paid), đơn vào hàng chờ để
-- CTV tự nhận. Migration này gửi thông báo (type 'order_claimable') tới đúng
-- các CTV đủ điều kiện danh mục đó -> client hiện toast + phát âm thanh.
-- Chạy 1 lần trong Supabase SQL Editor.
-- ============================================================================

-- 1) Helper: báo mọi CTV đủ điều kiện nhận đơn ------------------------------
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
  where p.role = 'ctv'
    and (
      p.ctv_all_categories
      or exists (
        select 1 from public.ctv_categories cc
        where cc.ctv_id = p.id and cc.category_id = v_order.category_id
      )
    );
end;
$$;

revoke execute on function public.notify_claimable_ctvs(uuid) from public, anon, authenticated;

-- 2) confirm_payment: thêm bước báo CTV sau khi chuyển 'paid' ----------------
create or replace function public.confirm_payment(p_order_id uuid, p_ref text default null)
returns public.orders
language plpgsql security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if not public.is_admin() then
    raise exception 'Chỉ admin mới được xác nhận thanh toán.';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Không tìm thấy đơn hàng.';
  end if;
  if v_order.status <> 'pending_payment' then
    raise exception 'Đơn không ở trạng thái chờ thanh toán.';
  end if;

  update public.orders
  set status = 'paid',
      payment_ref = coalesce(nullif(btrim(coalesce(p_ref, '')), ''), payment_ref),
      paid_confirmed_at = now(),
      paid_confirmed_by = auth.uid()
  where id = p_order_id
  returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, auth.uid(), 'payment_confirmed', 'Admin xác nhận đã nhận thanh toán.',
          jsonb_build_object('payment_ref', p_ref));

  perform public.notify_user(
    v_order.user_id, 'order_paid',
    'Đơn ' || v_order.order_code || ' đã được xác nhận thanh toán',
    'Chúng tôi sẽ xử lý đơn của bạn ngay.',
    '/orders/' || v_order.id
  );

  -- MỚI: đơn vào hàng chờ -> báo CTV đủ điều kiện (toast + âm thanh).
  perform public.notify_claimable_ctvs(p_order_id);

  return v_order;
end;
$$;

-- confirm_payment giữ nguyên quyền cũ (create or replace không đổi grants).

-- Xong.
