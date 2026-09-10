-- ============================================================================
-- 31-refund-to-wallet.sql — Hoàn tiền đơn -> cộng thẳng vào ví khách
-- ----------------------------------------------------------------------------
-- Khi admin duyệt hoàn tiền (hoặc tự chốt sau 1h), số tiền đơn được cộng lại
-- vào credit_balance của khách + ghi sổ credit_transactions.
-- Nếu seller đã được ghi hoa hồng đơn (ctv_credited_at) thì thu hồi lại phần
-- đã cộng cho seller để sổ không bị lệch (cho phép âm = nợ, không chặn refund).
-- Dùng bypass-guard như các RPC ví khác. Chạy 1 lần (sau 27).
-- ============================================================================

create or replace function public.do_refund(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare v_order public.orders; v_bal bigint; v_earn bigint; v_pct numeric;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.status = 'refunded' then return v_order; end if;  -- chống hoàn 2 lần

  -- Hoàn kho nếu chưa giao (hàng chưa trao tay).
  if v_order.delivered_at is null then
    update public.products p set stock = p.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = p_order_id and oi.product_id = p.id
      and oi.product_kind = 'item' and p.stock is not null;
  end if;

  -- Cộng tiền đơn về ví khách.
  if v_order.total > 0 and v_order.user_id is not null then
    perform set_config('app.bypass_credit_guard', '1', true);
    update public.profiles set credit_balance = credit_balance + v_order.total
    where id = v_order.user_id returning credit_balance into v_bal;
    insert into public.credit_transactions (user_id, amount, type, note, balance_after, order_id)
    values (v_order.user_id, v_order.total, 'refund',
            'Hoàn tiền đơn ' || v_order.order_code, v_bal, v_order.id);
    perform public.notify_user(v_order.user_id, 'credit',
      'Đã hoàn ' || v_order.total || ' VNĐ vào ví',
      'Đơn ' || v_order.order_code || ' đã được hoàn tiền vào số dư.', '/dashboard');
  end if;

  -- Thu hồi hoa hồng seller nếu đã ghi (tránh trả tiền 2 lần).
  if v_order.ctv_credited_at is not null and v_order.assigned_ctv is not null then
    v_pct := public.commission_pct('order_commission_pct');
    v_earn := v_order.total - floor(v_order.total * v_pct / 100);
    if v_earn > 0 then
      perform set_config('app.bypass_credit_guard', '1', true);
      update public.profiles set credit_balance = credit_balance - v_earn
      where id = v_order.assigned_ctv returning credit_balance into v_bal;
      insert into public.credit_transactions (user_id, amount, type, note, balance_after, order_id)
      values (v_order.assigned_ctv, -v_earn, 'refund',
              'Thu hồi hoa hồng do hoàn đơn ' || v_order.order_code, v_bal, v_order.id);
    end if;
  end if;

  update public.orders
  set status = 'refunded', refund_requested_at = null
  where id = p_order_id returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, auth.uid(), 'refunded', 'Đơn đã được hoàn tiền vào ví.', null);
  perform public.notify_user(v_order.user_id, 'order_refunded',
    'Đơn ' || v_order.order_code || ' đã được hoàn tiền',
    'Yêu cầu hoàn tiền của bạn đã được xử lý (cộng vào ví).', '/orders/' || v_order.id);
  return v_order;
end;
$$;

revoke execute on function public.do_refund(uuid) from public, anon, authenticated;

-- Xong.
