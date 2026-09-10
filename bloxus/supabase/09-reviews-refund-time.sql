-- ============================================================================
-- BLOXUS V2 — 09-reviews-refund-time.sql
-- ----------------------------------------------------------------------------
-- • Khách ĐÁNH GIÁ CTV sau khi đơn hoàn thành (1 đánh giá / đơn) — hiện lên
--   trang Proofs/Reviews và tính điểm trung bình cho từng CTV.
-- • Thời gian TỰ HOÀN TIỀN cấu hình được trong Settings (mặc định 60 phút).
-- Dán TOÀN BỘ file này vào SQL Editor và bấm Run.
-- ============================================================================

-- 1) reviews gắn với đơn + CTV -------------------------------------------------
alter table public.reviews
  add column if not exists order_id uuid references public.orders(id) on delete set null,
  add column if not exists ctv_id   uuid references public.profiles(id) on delete set null,
  add column if not exists user_id  uuid references public.profiles(id) on delete set null;

create unique index if not exists reviews_one_per_order_idx
  on public.reviews (order_id) where order_id is not null;

-- 2) Cài đặt thời gian tự hoàn tiền (phút). Mặc định 60. --------------------
insert into public.app_settings (key, value)
values ('refund_timeout_minutes', '60'::jsonb)
on conflict (key) do nothing;

-- 3) Khách gửi đánh giá cho đơn đã hoàn thành --------------------------------
create or replace function public.submit_order_review(
  p_order_id uuid,
  p_stars    integer,
  p_text     text default null
)
returns public.reviews
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid(); v_order public.orders; v_item public.order_items;
  v_buyer public.profiles; v_review public.reviews; v_cat_slug text;
begin
  if v_uid is null then raise exception 'Bạn cần đăng nhập.'; end if;
  if p_stars is null or p_stars < 1 or p_stars > 5 then
    raise exception 'Số sao phải từ 1 đến 5.';
  end if;

  select * into v_order from public.orders where id = p_order_id;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.user_id <> v_uid then raise exception 'Chỉ khách đặt đơn mới được đánh giá.'; end if;
  if v_order.status <> 'completed' then raise exception 'Chỉ đánh giá được đơn đã hoàn thành.'; end if;
  if exists (select 1 from public.reviews where order_id = p_order_id) then
    raise exception 'Đơn này đã được đánh giá rồi.';
  end if;

  select * into v_item from public.order_items where order_id = p_order_id limit 1;
  select * into v_buyer from public.profiles where id = v_uid;
  select c.slug into v_cat_slug from public.categories c where c.id = v_order.category_id;

  insert into public.reviews (
    author, stars, text, category_slug, item_name, verified_purchase, source,
    order_id, ctv_id, user_id
  ) values (
    coalesce(v_buyer.display_name, v_buyer.username), least(greatest(p_stars,1),5),
    nullif(btrim(coalesce(p_text,'')),''), v_cat_slug, v_item.name, true, 'On-site',
    p_order_id, v_order.assigned_ctv, v_uid
  ) returning * into v_review;

  perform public.notify_user(v_order.assigned_ctv, 'review_received',
    'Bạn nhận được đánh giá ' || p_stars || '★',
    'Đơn ' || v_order.order_code || coalesce(': "' || nullif(btrim(coalesce(p_text,'')),'') || '"', ''),
    '/work/orders/' || v_order.id);
  return v_review;
end;
$$;
grant execute on function public.submit_order_review(uuid, integer, text) to authenticated, service_role;

-- 4) finalize_refund đọc thời gian từ Settings --------------------------------
create or replace function public.finalize_refund(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_order public.orders; v_minutes int;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Không tìm thấy đơn hàng.'; end if;
  if v_order.user_id <> v_uid then raise exception 'Bạn không có quyền với đơn này.'; end if;
  if v_order.refund_requested_at is null then raise exception 'Đơn không có yêu cầu hoàn tiền.'; end if;

  select coalesce((value #>> '{}')::int, 60) into v_minutes
  from public.app_settings where key = 'refund_timeout_minutes';
  v_minutes := coalesce(v_minutes, 60);
  if v_minutes <= 0 then v_minutes := 60; end if;

  if now() - v_order.refund_requested_at < make_interval(mins => v_minutes) then
    raise exception 'Chưa đủ % phút kể từ khi yêu cầu hoàn tiền.', v_minutes;
  end if;
  return public.do_refund(p_order_id);
end;
$$;

-- Xong.
