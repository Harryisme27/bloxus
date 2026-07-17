-- ============================================================================
-- 15-manager-money.sql — Manager: xác nhận thanh toán + duyệt hoàn tiền;
--                        Cấp quyền: manager ĐỀ XUẤT, admin DUYỆT.
-- ----------------------------------------------------------------------------
-- Chạy SAU 14a + 14b. Chạy 1 lần trong Supabase SQL Editor.
-- ============================================================================

-- 1) confirm_payment: admin HOẶC manager ---------------------------------------
create or replace function public.confirm_payment(p_order_id uuid, p_ref text default null)
returns public.orders
language plpgsql security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if not public.is_admin_or_manager() then
    raise exception 'Chỉ admin/manager mới được xác nhận thanh toán.';
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

  perform public.notify_claimable_ctvs(p_order_id);

  return v_order;
end;
$$;

-- 2) resolve_refund: admin HOẶC manager ----------------------------------------
create or replace function public.resolve_refund(p_order_id uuid, p_approve boolean, p_note text default null)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare v_order public.orders;
begin
  if not public.is_admin_or_manager() then raise exception 'Chỉ admin/manager mới được duyệt hoàn tiền.'; end if;
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

-- 3) Bảng đề xuất cấp quyền ----------------------------------------------------
create table if not exists public.role_requests (
  id             uuid primary key default gen_random_uuid(),
  requester      uuid not null references public.profiles(id) on delete cascade,
  target_email   text not null,
  requested_role public.user_role not null,
  status         text not null default 'pending', -- pending | approved | rejected
  note           text,
  reviewed_by    uuid references public.profiles(id),
  review_note    text,
  created_at     timestamptz not null default now(),
  reviewed_at    timestamptz
);
alter table public.role_requests enable row level security;

drop policy if exists "role_requests admin all" on public.role_requests;
create policy "role_requests admin all" on public.role_requests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "role_requests requester read" on public.role_requests;
create policy "role_requests requester read" on public.role_requests
  for select to authenticated using (requester = auth.uid());

-- 4) Manager gửi đề xuất cấp quyền (ctv/manager) -------------------------------
create or replace function public.request_role_grant(
  p_email text, p_role public.user_role, p_note text default null
)
returns public.role_requests
language plpgsql security definer set search_path = public
as $$
declare v_req public.role_requests; v_target uuid;
begin
  if not public.is_admin_or_manager() then
    raise exception 'Chỉ admin/manager mới được đề xuất cấp quyền.';
  end if;
  if p_role not in ('ctv', 'manager') then
    raise exception 'Chỉ đề xuất được quyền CTV hoặc Manager.';
  end if;
  select u.id into v_target from auth.users u where lower(u.email) = lower(btrim(p_email));
  if v_target is null then
    raise exception 'Không tìm thấy tài khoản với email này.';
  end if;
  if exists (select 1 from public.role_requests
             where lower(target_email) = lower(btrim(p_email)) and status = 'pending') then
    raise exception 'Đã có đề xuất đang chờ duyệt cho email này.';
  end if;

  insert into public.role_requests (requester, target_email, requested_role, note)
  values (auth.uid(), btrim(p_email), p_role, nullif(btrim(coalesce(p_note,'')),''))
  returning * into v_req;

  -- báo các ADMIN (không phải manager) để duyệt
  insert into public.notifications (user_id, type, title, body, link)
  select id, 'role_request',
         'Đề xuất cấp quyền ' || p_role || ' cho ' || btrim(p_email),
         'Vào trang CTV để duyệt hoặc từ chối.',
         '/work/ctv'
  from public.profiles where role = 'admin';

  return v_req;
end;
$$;

-- 5) Admin duyệt/từ chối đề xuất ----------------------------------------------
create or replace function public.review_role_grant(
  p_request_id uuid, p_approve boolean, p_note text default null
)
returns public.role_requests
language plpgsql security definer set search_path = public
as $$
declare v_req public.role_requests; v_target uuid;
begin
  if not public.is_admin() then raise exception 'Chỉ admin mới được duyệt cấp quyền.'; end if;
  select * into v_req from public.role_requests where id = p_request_id for update;
  if not found then raise exception 'Không tìm thấy đề xuất.'; end if;
  if v_req.status <> 'pending' then raise exception 'Đề xuất đã được xử lý.'; end if;

  if p_approve then
    select u.id into v_target from auth.users u where lower(u.email) = lower(v_req.target_email);
    if v_target is null then raise exception 'Không tìm thấy tài khoản với email này.'; end if;
    update public.profiles set role = v_req.requested_role where id = v_target;
  end if;

  update public.role_requests
  set status = case when p_approve then 'approved' else 'rejected' end,
      reviewed_by = auth.uid(), review_note = nullif(btrim(coalesce(p_note,'')),''),
      reviewed_at = now()
  where id = p_request_id
  returning * into v_req;

  perform public.notify_user(v_req.requester, 'role_request_reviewed',
    (case when p_approve then 'Đề xuất cấp quyền đã được duyệt' else 'Đề xuất cấp quyền bị từ chối' end)
      || ' — ' || v_req.target_email,
    coalesce(v_req.review_note, ''),
    '/work/ctv');

  return v_req;
end;
$$;

revoke execute on function public.request_role_grant(text, public.user_role, text) from public, anon;
revoke execute on function public.review_role_grant(uuid, boolean, text) from public, anon;
grant execute on function public.request_role_grant(text, public.user_role, text) to authenticated, service_role;
grant execute on function public.review_role_grant(uuid, boolean, text) to authenticated, service_role;

-- Xong.
