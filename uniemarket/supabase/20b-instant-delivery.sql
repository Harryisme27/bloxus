-- ============================================================================
-- 20b-instant-delivery.sql — Sản phẩm giao ngay + nội dung giao bí mật
-- ----------------------------------------------------------------------------
-- Chạy SAU 20a. Thêm:
--  - products.instant_delivery (bool): mua + xác nhận thanh toán -> giao NGAY.
--  - product_secrets(content): nội dung giao (tài khoản/mã...) — BÍ MẬT, khách
--    KHÔNG đọc được ở product; chỉ lộ vào ĐƠN của khách sau khi đã thanh toán.
--  - orders.delivery_content: nội dung đã giao cho đơn (khách xem trên trang đơn).
--  - confirm_payment: nếu sản phẩm instant_delivery -> tự hoàn tất + gắn nội dung.
--  - nới CHECK stock để 'account' cũng quản lý tồn kho như 'item'.
-- ============================================================================

alter table public.products add column if not exists instant_delivery boolean not null default false;
alter table public.orders   add column if not exists delivery_content text;

-- Nới ràng buộc stock: cho phép 'item' và 'account'.
alter table public.products drop constraint if exists products_stock_check;
alter table public.products
  add constraint products_stock_check
  check (stock is null or (kind in ('item', 'account') and stock >= 0));

-- Bảng nội dung giao bí mật (1 dòng/sản phẩm). CHỈ admin/manager đọc-ghi.
create table if not exists public.product_secrets (
  product_id uuid primary key references public.products(id) on delete cascade,
  content    text,
  updated_at timestamptz not null default now()
);
alter table public.product_secrets enable row level security;
drop policy if exists "product_secrets staff all" on public.product_secrets;
create policy "product_secrets staff all" on public.product_secrets
  for all to authenticated
  using (public.is_admin_or_manager()) with check (public.is_admin_or_manager());

-- RPC set/get nội dung giao (admin/manager).
create or replace function public.set_product_secret(p_product_id uuid, p_content text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin_or_manager() then raise exception 'Không có quyền.'; end if;
  insert into public.product_secrets (product_id, content, updated_at)
  values (p_product_id, nullif(btrim(coalesce(p_content,'')),''), now())
  on conflict (product_id) do update set content = excluded.content, updated_at = now();
end; $$;

create or replace function public.get_product_secret(p_product_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select case when public.is_admin_or_manager()
    then (select content from public.product_secrets where product_id = p_product_id) end;
$$;

-- confirm_payment: giữ luồng cũ, thêm nhánh instant delivery.
create or replace function public.confirm_payment(p_order_id uuid, p_ref text default null)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders;
  v_instant boolean := false;
  v_content text;
begin
  if not public.is_admin_or_manager() then
    raise exception 'Chỉ admin/manager mới được xác nhận thanh toán.';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.status <> 'pending_payment' then
    raise exception 'Đơn không ở trạng thái chờ thanh toán.';
  end if;

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

  -- Sản phẩm giao ngay? (đơn tách theo món nên 1 đơn = 1 sản phẩm)
  select p.instant_delivery, ps.content into v_instant, v_content
  from public.order_items oi
  join public.products p on p.id = oi.product_id
  left join public.product_secrets ps on ps.product_id = p.id
  where oi.order_id = p_order_id limit 1;

  if coalesce(v_instant, false) then
    -- Giao tự động + hoàn tất, gắn nội dung giao cho khách xem.
    update public.orders
    set status = 'completed', delivered_at = now(),
        delivery_content = v_content,
        delivery_note = 'Giao tự động (instant delivery).'
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

grant execute on function public.set_product_secret(uuid, text) to authenticated, service_role;
grant execute on function public.get_product_secret(uuid) to authenticated, service_role;

-- Xong.
