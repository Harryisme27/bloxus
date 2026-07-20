-- ============================================================================
-- 19-deletable-order-statuses.sql — Chỉ cho xóa đơn ở trạng thái admin cho phép
-- ----------------------------------------------------------------------------
-- Setting 'deletable_order_statuses' (jsonb array) quyết định trạng thái nào
-- được phép xóa. Mặc định: KHÔNG cho xóa 'pending_payment' (chờ thanh toán) và
-- 'in_progress' (đang xử lý) — chỉ xóa được paid/completed/cancelled/refunded.
-- admin_delete_orders / admin_delete_all_orders enforce ở server (không tin UI).
-- Chạy 1 lần trong Supabase SQL Editor (sau 17).
-- ============================================================================

-- Seed mặc định nếu chưa có.
insert into public.app_settings (key, value)
values ('deletable_order_statuses', '["paid","completed","cancelled","refunded"]'::jsonb)
on conflict (key) do nothing;

-- Helper: tập trạng thái được phép xóa (đọc từ setting, fallback mặc định).
create or replace function public.deletable_order_statuses()
returns text[]
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select array(select jsonb_array_elements_text(value))
     from public.app_settings where key = 'deletable_order_statuses'),
    array['paid','completed','cancelled','refunded']
  );
$$;

create or replace function public.admin_delete_orders(p_ids uuid[])
returns integer
language plpgsql security definer set search_path = public
as $$
declare v_count integer; v_allowed text[];
begin
  if not public.is_admin() then
    raise exception 'Chỉ admin mới được xóa đơn hàng.';
  end if;
  if p_ids is null or array_length(p_ids, 1) is null then return 0; end if;
  v_allowed := public.deletable_order_statuses();

  -- Chỉ xóa các đơn thuộc trạng thái được phép.
  update public.proofs set order_id = null
   where order_id = any(p_ids)
     and order_id in (select id from public.orders where status::text = any(v_allowed));
  delete from public.orders
   where id = any(p_ids) and status::text = any(v_allowed);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.admin_delete_all_orders()
returns integer
language plpgsql security definer set search_path = public
as $$
declare v_count integer; v_allowed text[];
begin
  if not public.is_admin() then
    raise exception 'Chỉ admin mới được xóa đơn hàng.';
  end if;
  v_allowed := public.deletable_order_statuses();

  update public.proofs set order_id = null
   where order_id in (select id from public.orders where status::text = any(v_allowed));
  delete from public.orders where status::text = any(v_allowed);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.deletable_order_statuses() to authenticated, service_role;

-- 'ctv_apply_open' cần khách đọc để trang /ctv biết mở hay đóng đơn ứng tuyển.
-- Thêm vào whitelist đọc công khai của app_settings (không nhạy cảm).
drop policy if exists "app_settings: public keys read" on public.app_settings;
create policy "app_settings: public keys read" on public.app_settings
  for select to anon, authenticated
  using (
    key in ('bank_name', 'bank_account', 'bank_holder', 'momo_number', 'momo_qr_url', 'brand', 'ctv_apply_open')
    or public.is_admin()
  );

-- Xong.
