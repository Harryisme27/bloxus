-- ============================================================================
-- UNIEMARKET V2 — 01-schema.sql
-- ----------------------------------------------------------------------------
-- CÁCH DÙNG: Mở Supabase Dashboard → SQL Editor → New query → dán TOÀN BỘ file
-- này vào → bấm RUN. Chạy đúng 1 lần trên project mới.
-- File được chia thành 10 PHẦN, có đánh dấu rõ ràng để bạn theo dõi tiến độ.
-- ============================================================================


-- ============================================================================
-- PHẦN 1/10 — KIỂU DỮ LIỆU (ENUMS)
-- ============================================================================

create type public.user_role as enum ('customer', 'ctv', 'admin');
create type public.product_kind as enum ('item', 'service');
create type public.order_status as enum (
  'pending_payment', 'paid', 'in_progress', 'completed', 'cancelled', 'refunded'
);
create type public.payment_method as enum ('bank_transfer', 'momo');
create type public.thread_kind as enum ('order', 'staff');
create type public.ctv_application_status as enum ('pending', 'approved', 'rejected');
create type public.order_event_type as enum (
  'created', 'payment_confirmed', 'assigned', 'status_changed', 'note', 'cancelled', 'refunded'
);


-- ============================================================================
-- PHẦN 2/10 — BẢNG (TABLES)
-- ============================================================================

-- ---- profiles: hồ sơ người dùng, 1-1 với auth.users --------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null unique,
  display_name text,
  avatar_url   text,
  phone        text,
  discord      text,
  role         public.user_role not null default 'customer',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---- categories: danh mục (mỗi game / mỗi loại dịch vụ là một danh mục) ------
create table public.categories (
  id                        uuid primary key default gen_random_uuid(),
  slug                      text not null unique,
  name                      text not null,
  tagline                   text,
  description               text,
  icon_url                  text,
  banner_url                text,
  accent_color              text,
  contact_field_label       text,
  contact_field_placeholder text,
  sort_order                integer not null default 0,
  is_featured               boolean not null default false,
  is_active                 boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ---- products: sản phẩm (item = hàng giao; service = dịch vụ có tuỳ chọn) ----
create table public.products (
  id                 uuid primary key default gen_random_uuid(),
  category_id        uuid not null references public.categories (id),
  slug               text not null unique,
  kind               public.product_kind not null default 'item',
  name               text not null,
  description        text,
  price              bigint not null check (price >= 0),          -- VNĐ
  original_price     bigint check (original_price is null or original_price >= 0),
  currency           text not null default 'VND',
  stock              integer check (stock is null or (kind = 'item' and stock >= 0)),
  images             text[] not null default '{}',
  rarity             text,
  delivery_time_text text,
  service_options    jsonb check (service_options is null or kind = 'service'),
  tags               text[] not null default '{}',
  is_featured        boolean not null default false,
  is_active          boolean not null default true,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);

-- ---- orders: đơn hàng --------------------------------------------------------
create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_code         text not null unique,        -- 'UM-XXXXXX', trigger tự sinh
  user_id            uuid not null references public.profiles (id),
  status             public.order_status not null default 'pending_payment',
  subtotal           bigint not null default 0 check (subtotal >= 0),
  discount           bigint not null default 0 check (discount >= 0),
  total              bigint not null default 0 check (total >= 0),
  currency           text not null default 'VND',
  payment_method     public.payment_method,
  payment_ref        text,
  game_username      text,
  contact_channel    text,
  contact_value      text,
  customer_note      text,
  assigned_ctv       uuid references public.profiles (id),
  assigned_by        uuid references public.profiles (id),
  assigned_at        timestamptz,
  paid_confirmed_at  timestamptz,
  paid_confirmed_by  uuid references public.profiles (id),
  completed_at       timestamptz,
  cancelled_at       timestamptz,
  cancel_reason      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id);
create index orders_assigned_ctv_idx on public.orders (assigned_ctv);
create index orders_status_idx on public.orders (status);

-- ---- order_items: dòng hàng trong đơn (snapshot giá/tên tại thời điểm đặt) ---
create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  product_id       uuid references public.products (id) on delete set null,
  product_kind     public.product_kind not null,
  name             text not null,
  category_name    text,
  image_url        text,
  unit_price       bigint not null check (unit_price >= 0),
  quantity         integer not null check (quantity > 0),
  line_total       bigint not null check (line_total >= 0),
  selected_options jsonb
);

create index order_items_order_idx on public.order_items (order_id);

-- ---- order_events: nhật ký đơn hàng (nuôi timeline trạng thái) ---------------
create table public.order_events (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders (id) on delete cascade,
  actor_id   uuid references public.profiles (id),
  event_type public.order_event_type not null,
  note       text,
  meta       jsonb,
  created_at timestamptz not null default now()
);

create index order_events_order_idx on public.order_events (order_id);

-- ---- threads + messages: chat (thread theo đơn + kênh nội bộ staff) ----------
create table public.threads (
  id              uuid primary key default gen_random_uuid(),
  kind            public.thread_kind not null,
  order_id        uuid unique references public.orders (id) on delete cascade,
  title           text,
  created_by      uuid references public.profiles (id),
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  check (
    (kind = 'order' and order_id is not null) or
    (kind = 'staff' and order_id is null)
  )
);

create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.threads (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id),
  body        text not null check (length(btrim(body)) > 0),
  attachments text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create index messages_thread_idx on public.messages (thread_id, created_at);

-- ---- ctv_applications: đơn ứng tuyển CTV -------------------------------------
create table public.ctv_applications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id),
  full_name   text not null,
  contact     text not null,
  experience  text,
  games       text,
  status      public.ctv_application_status not null default 'pending',
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  note        text,
  created_at  timestamptz not null default now()
);

-- Mỗi người chỉ được có 1 đơn ứng tuyển đang chờ duyệt.
create unique index ctv_applications_one_pending_idx
  on public.ctv_applications (user_id)
  where status = 'pending';

-- ---- proofs: minh chứng giao hàng (trang /proofs) ----------------------------
create table public.proofs (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid references public.orders (id),
  game_name       text not null,
  item_name       text not null,
  rarity          text,
  buyer_masked    text,
  amount          bigint,                                          -- VNĐ
  staff_name      text,
  proof_image_url text,
  status          text not null default 'Verified',
  delivered_at    timestamptz not null default now()
);

-- ---- reviews: đánh giá của khách ---------------------------------------------
create table public.reviews (
  id                uuid primary key default gen_random_uuid(),
  author            text not null,
  avatar_url        text,
  stars             integer not null check (stars between 1 and 5),
  text              text not null,
  category_slug     text,
  item_name         text,
  verified_purchase boolean not null default false,
  source            text,
  created_at        timestamptz not null default now()
);

-- ---- app_settings: cài đặt shop (STK bank, Momo, QR...) — admin sửa trên web -
create table public.app_settings (
  key        text primary key,
  value      jsonb not null default '""'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---- notifications: thông báo in-app -----------------------------------------
create table public.notifications (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, read_at);


-- ============================================================================
-- PHẦN 3/10 — HÀM TRỢ GIÚP (HELPERS)
-- ============================================================================

-- Kiểm tra vai trò của người đang đăng nhập. SECURITY DEFINER để tránh RLS đệ quy.
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'ctv')
  );
$$;

-- Ai được xem/gửi tin trong một thread?
--   admin: tất cả; thread staff: mọi staff; thread đơn: chủ đơn hoặc CTV được giao.
create or replace function public.can_access_thread(p_thread_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.threads t
    where t.id = p_thread_id
      and (
        public.is_admin()
        or (t.kind = 'staff' and public.is_staff())
        or (
          t.kind = 'order'
          and exists (
            select 1 from public.orders o
            where o.id = t.order_id
              and (o.user_id = auth.uid() or o.assigned_ctv = auth.uid())
          )
        )
      )
  );
$$;

-- Vai trò hiện tại (tiện cho client gọi rpc('get_my_role')).
create or replace function public.get_my_role()
returns public.user_role
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Gửi thông báo (chỉ dùng nội bộ trong các RPC/trigger, không cho client gọi).
create or replace function public.notify_user(
  p_user_id uuid, p_type text, p_title text, p_body text, p_link text
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if p_user_id is null then return; end if;
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link);
end;
$$;

create or replace function public.notify_admins(
  p_type text, p_title text, p_body text, p_link text
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  select id, p_type, p_title, p_body, p_link
  from public.profiles
  where role = 'admin';
end;
$$;


-- ============================================================================
-- PHẦN 4/10 — TRIGGERS
-- ============================================================================

-- Tự cập nhật updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at   before update on public.profiles     for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories   for each row execute function public.set_updated_at();
create trigger products_set_updated_at   before update on public.products     for each row execute function public.set_updated_at();
create trigger orders_set_updated_at     before update on public.orders       for each row execute function public.set_updated_at();
create trigger app_settings_set_updated_at before update on public.app_settings for each row execute function public.set_updated_at();

-- Tự tạo profile khi có tài khoản mới đăng ký (auth.users).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_username text;
begin
  v_username := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user'
  );
  -- Nếu username đã tồn tại thì gắn thêm hậu tố ngẫu nhiên.
  if exists (select 1 from public.profiles where username = v_username) then
    v_username := v_username || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, v_username, v_username);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Chặn người dùng tự đổi role của mình. Chỉ admin (hoặc RPC nội bộ đã set
-- app.bypass_role_guard = '1') mới được đổi role.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role
     and not public.is_admin()
     and coalesce(current_setting('app.bypass_role_guard', true), '') is distinct from '1'
  then
    raise exception 'Bạn không có quyền thay đổi vai trò tài khoản.';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Sinh mã đơn 'UM-XXXXXX' (6 ký tự A-Z0-9) — dùng làm nội dung chuyển khoản.
create or replace function public.generate_order_code()
returns trigger
language plpgsql
as $$
declare
  v_chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_code  text;
begin
  if new.order_code is not null and btrim(new.order_code) <> '' then
    return new;
  end if;
  loop
    v_code := 'UM-' || (
      select string_agg(substr(v_chars, 1 + floor(random() * 36)::int, 1), '')
      from generate_series(1, 6)
    );
    exit when not exists (select 1 from public.orders where order_code = v_code);
  end loop;
  new.order_code := v_code;
  return new;
end;
$$;

create trigger orders_generate_code
  before insert on public.orders
  for each row execute function public.generate_order_code();

-- Đồ thị chuyển trạng thái đơn hàng — chặn mọi bước nhảy không hợp lệ:
--   pending_payment → paid | cancelled
--   paid            → in_progress | cancelled | refunded
--   in_progress     → completed | cancelled | refunded
--   completed       → refunded
create or replace function public.guard_order_status()
returns trigger
language plpgsql
as $$
begin
  if old.status = new.status then
    return new;
  end if;
  if not (
    (old.status = 'pending_payment' and new.status in ('paid', 'cancelled')) or
    (old.status = 'paid'            and new.status in ('in_progress', 'cancelled', 'refunded')) or
    (old.status = 'in_progress'     and new.status in ('completed', 'cancelled', 'refunded')) or
    (old.status = 'completed'       and new.status = 'refunded')
  ) then
    raise exception 'Không thể chuyển trạng thái đơn từ % sang %.', old.status, new.status;
  end if;
  return new;
end;
$$;

create trigger orders_guard_status
  before update on public.orders
  for each row execute function public.guard_order_status();

-- Tự tạo thread chat khi đơn hàng được tạo.
create or replace function public.handle_new_order_thread()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.threads (kind, order_id, title, created_by)
  values ('order', new.id, 'Đơn ' || new.order_code, new.user_id);
  return new;
end;
$$;

create trigger orders_create_thread
  after insert on public.orders
  for each row execute function public.handle_new_order_thread();

-- Cập nhật threads.last_message_at khi có tin nhắn mới.
create or replace function public.handle_new_message()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  update public.threads
  set last_message_at = new.created_at
  where id = new.thread_id;
  return new;
end;
$$;

create trigger messages_touch_thread
  after insert on public.messages
  for each row execute function public.handle_new_message();


-- ============================================================================
-- PHẦN 5/10 — VIEW HỒ SƠ CÔNG KHAI (cho chat hiển thị tên/avatar)
-- ============================================================================

create view public.public_profiles as
  select id, display_name, username, avatar_url, role
  from public.profiles;

revoke all on public.public_profiles from anon;
grant select on public.public_profiles to authenticated;


-- ============================================================================
-- PHẦN 6/10 — BẬT RLS + POLICIES (ranh giới bảo mật thật sự)
-- ============================================================================

alter table public.profiles         enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.order_events     enable row level security;
alter table public.threads          enable row level security;
alter table public.messages         enable row level security;
alter table public.ctv_applications enable row level security;
alter table public.proofs           enable row level security;
alter table public.reviews          enable row level security;
alter table public.app_settings     enable row level security;
alter table public.notifications    enable row level security;

-- ---- profiles ----------------------------------------------------------------
create policy "profiles: self or admin select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles: self or admin update" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "profiles: admin delete" on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- ---- categories / products: ai cũng xem được hàng đang bán; admin toàn quyền -
create policy "categories: public read active" on public.categories
  for select to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "categories: admin write" on public.categories
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "products: public read active" on public.products
  for select to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "products: admin write" on public.products
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- orders: khách thấy đơn mình, CTV thấy đơn được giao, admin thấy hết -----
-- KHÔNG có policy INSERT/UPDATE/DELETE cho người thường: mọi thao tác ghi
-- đi qua RPC SECURITY DEFINER (place_order, confirm_payment, ...).
create policy "orders: owner ctv admin select" on public.orders
  for select to authenticated
  using (user_id = auth.uid() or assigned_ctv = auth.uid() or public.is_admin());

create policy "orders: admin write" on public.orders
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- order_items / order_events: xem theo quyền của đơn cha ------------------
create policy "order_items: via parent order" on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or o.assigned_ctv = auth.uid() or public.is_admin())
  ));

create policy "order_items: admin write" on public.order_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "order_events: via parent order" on public.order_events
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or o.assigned_ctv = auth.uid() or public.is_admin())
  ));

create policy "order_events: admin write" on public.order_events
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- threads / messages -------------------------------------------------------
create policy "threads: participants select" on public.threads
  for select to authenticated
  using (public.can_access_thread(id));

create policy "messages: participants select" on public.messages
  for select to authenticated
  using (public.can_access_thread(thread_id));

create policy "messages: participants insert" on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.can_access_thread(thread_id));

-- ---- ctv_applications -----------------------------------------------------------
create policy "ctv_applications: own insert" on public.ctv_applications
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

create policy "ctv_applications: own select" on public.ctv_applications
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "ctv_applications: admin write" on public.ctv_applications
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- proofs / reviews: công khai đọc; staff/admin ghi ---------------------------
create policy "proofs: public read" on public.proofs
  for select to anon, authenticated
  using (true);

create policy "proofs: staff insert" on public.proofs
  for insert to authenticated
  with check (public.is_staff());

create policy "proofs: admin write" on public.proofs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "reviews: public read" on public.reviews
  for select to anon, authenticated
  using (true);

create policy "reviews: admin write" on public.reviews
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- app_settings: các khóa công khai ai cũng đọc được (checkout cần STK bank);
--      admin đọc/ghi tất cả -------------------------------------------------------
create policy "app_settings: public keys read" on public.app_settings
  for select to anon, authenticated
  using (
    key in ('bank_name', 'bank_account', 'bank_holder', 'momo_number', 'momo_qr_url', 'brand')
    or public.is_admin()
  );

create policy "app_settings: admin write" on public.app_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- notifications: chỉ chủ sở hữu đọc + đánh dấu đã đọc ------------------------
create policy "notifications: owner select" on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

create policy "notifications: owner update" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Người dùng chỉ được sửa cột read_at (không sửa nội dung thông báo).
revoke insert, update, delete on table public.notifications from anon, authenticated;
grant update (read_at) on table public.notifications to authenticated;


-- ============================================================================
-- PHẦN 7/10 — RPC (mọi thao tác tiền & trạng thái đi qua đây)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- place_order: khách đặt hàng.
--   * Server TỰ ĐỌC LẠI GIÁ từ bảng products — không bao giờ tin giá client gửi.
--   * service_options 2 dạng:
--       tiers:      {"type":"tiers","tiers":[{"id":"t1","label":"...","price":100000}, ...]}
--                   → client chọn: {"tier_id":"t1"} → giá = price của tier đó.
--       rank_range: {"type":"rank_range","step_price":50000,
--                    "ranks":[{"id":"r1","label":"Bạc"},{"id":"r2","label":"Vàng"}, ...]}
--                   → client chọn: {"from":"r1","to":"r3"} → giá = step_price × số bậc.
--   * Trừ kho atomic cho sản phẩm kind='item' có stock.
--   * p_items: [{"product_id":"<uuid>","quantity":1,"selected_options":{...}}, ...]
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_items           jsonb,
  p_payment_method  public.payment_method,
  p_game_username   text,
  p_contact_channel text,
  p_contact_value   text,
  p_note            text default null
)
returns public.orders
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid        uuid := auth.uid();
  v_order      public.orders;
  v_item       jsonb;
  v_product    public.products;
  v_qty        integer;
  v_unit_price bigint;
  v_selected   jsonb;
  v_subtotal   bigint := 0;
  v_opts_type  text;
  v_tier       jsonb;
  v_from_id    text;
  v_to_id      text;
  v_from_pos   bigint;
  v_to_pos     bigint;
  v_steps      bigint;
  v_step_price bigint;
begin
  if v_uid is null then
    raise exception 'Bạn cần đăng nhập để đặt hàng.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Giỏ hàng trống hoặc không hợp lệ.';
  end if;
  if p_payment_method is null then
    raise exception 'Vui lòng chọn phương thức thanh toán.';
  end if;

  insert into public.orders (
    user_id, status, payment_method, game_username,
    contact_channel, contact_value, customer_note
  )
  values (
    v_uid, 'pending_payment', p_payment_method, nullif(btrim(coalesce(p_game_username, '')), ''),
    nullif(btrim(coalesce(p_contact_channel, '')), ''), nullif(btrim(coalesce(p_contact_value, '')), ''),
    nullif(btrim(coalesce(p_note, '')), '')
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item ->> 'quantity')::integer, 1);
    if v_qty <= 0 or v_qty > 999 then
      raise exception 'Số lượng không hợp lệ.';
    end if;

    -- Khóa dòng sản phẩm để trừ kho an toàn khi có nhiều đơn cùng lúc.
    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid and is_active = true
    for update;

    if not found then
      raise exception 'Sản phẩm không tồn tại hoặc đã ngừng bán.';
    end if;

    v_selected := null;

    if v_product.kind = 'service' and v_product.service_options is not null then
      v_opts_type := v_product.service_options ->> 'type';

      if v_opts_type = 'tiers' then
        select t.value into v_tier
        from jsonb_array_elements(v_product.service_options -> 'tiers') as t(value)
        where t.value ->> 'id' = v_item -> 'selected_options' ->> 'tier_id';

        if v_tier is null then
          raise exception 'Vui lòng chọn gói dịch vụ hợp lệ cho "%".', v_product.name;
        end if;
        v_unit_price := (v_tier ->> 'price')::bigint;
        v_selected := jsonb_build_object(
          'type', 'tiers',
          'tier_id', v_tier ->> 'id',
          'label', v_tier ->> 'label',
          'price', v_unit_price
        );

      elsif v_opts_type = 'rank_range' then
        v_from_id := v_item -> 'selected_options' ->> 'from';
        v_to_id   := v_item -> 'selected_options' ->> 'to';
        v_step_price := (v_product.service_options ->> 'step_price')::bigint;

        select r.ord into v_from_pos
        from jsonb_array_elements(v_product.service_options -> 'ranks')
             with ordinality as r(value, ord)
        where r.value ->> 'id' = v_from_id;

        select r.ord into v_to_pos
        from jsonb_array_elements(v_product.service_options -> 'ranks')
             with ordinality as r(value, ord)
        where r.value ->> 'id' = v_to_id;

        if v_from_pos is null or v_to_pos is null or v_to_pos <= v_from_pos or v_step_price is null then
          raise exception 'Khoảng rank không hợp lệ cho "%".', v_product.name;
        end if;
        v_steps := v_to_pos - v_from_pos;
        v_unit_price := v_step_price * v_steps;
        v_selected := jsonb_build_object(
          'type', 'rank_range',
          'from', v_from_id,
          'to', v_to_id,
          'steps', v_steps,
          'step_price', v_step_price
        );

      else
        raise exception 'Cấu hình dịch vụ của "%" không hợp lệ.', v_product.name;
      end if;
    else
      -- item (hoặc service không có option): dùng giá niêm yết.
      v_unit_price := v_product.price;
    end if;

    -- Trừ kho atomic cho item có quản lý tồn kho.
    if v_product.kind = 'item' and v_product.stock is not null then
      update public.products
      set stock = stock - v_qty
      where id = v_product.id and stock >= v_qty;
      if not found then
        raise exception 'Sản phẩm "%" không đủ hàng trong kho.', v_product.name;
      end if;
    end if;

    insert into public.order_items (
      order_id, product_id, product_kind, name, category_name, image_url,
      unit_price, quantity, line_total, selected_options
    )
    values (
      v_order.id, v_product.id, v_product.kind, v_product.name,
      (select name from public.categories where id = v_product.category_id),
      (case when array_length(v_product.images, 1) >= 1 then v_product.images[1] else null end),
      v_unit_price, v_qty, v_unit_price * v_qty, v_selected
    );

    v_subtotal := v_subtotal + v_unit_price * v_qty;
  end loop;

  update public.orders
  set subtotal = v_subtotal, discount = 0, total = v_subtotal
  where id = v_order.id;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (
    v_order.id, v_uid, 'created', 'Khách đặt đơn hàng.',
    jsonb_build_object('total', v_subtotal, 'payment_method', p_payment_method)
  );

  perform public.notify_admins(
    'order_new',
    'Đơn hàng mới ' || v_order.order_code,
    'Tổng tiền: ' || v_subtotal || ' VNĐ — chờ xác nhận thanh toán.',
    '/work/orders/' || v_order.id
  );

  select * into v_order from public.orders where id = v_order.id;
  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- confirm_payment: admin xác nhận đã nhận tiền (pending_payment → paid).
-- ---------------------------------------------------------------------------
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

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- assign_order: admin giao đơn cho CTV (paid → in_progress).
-- ---------------------------------------------------------------------------
create or replace function public.assign_order(p_order_id uuid, p_ctv uuid)
returns public.orders
language plpgsql security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if not public.is_admin() then
    raise exception 'Chỉ admin mới được giao đơn.';
  end if;
  if not exists (select 1 from public.profiles where id = p_ctv and role = 'ctv') then
    raise exception 'Người được giao phải là CTV đã duyệt.';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Không tìm thấy đơn hàng.';
  end if;
  if v_order.status <> 'paid' then
    raise exception 'Chỉ giao được đơn đã xác nhận thanh toán.';
  end if;

  update public.orders
  set status = 'in_progress',
      assigned_ctv = p_ctv,
      assigned_by = auth.uid(),
      assigned_at = now()
  where id = p_order_id
  returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, auth.uid(), 'assigned', 'Admin giao đơn cho CTV.',
          jsonb_build_object('ctv_id', p_ctv));

  perform public.notify_user(
    p_ctv, 'order_assigned',
    'Bạn được giao đơn ' || v_order.order_code,
    'Vào khu làm việc để xem chi tiết và liên hệ khách.',
    '/work/orders/' || v_order.id
  );

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- update_order_status: admin đổi mọi trạng thái hợp lệ;
-- CTV chỉ được in_progress → completed trên đơn ĐƯỢC GIAO CHO MÌNH.
-- ---------------------------------------------------------------------------
create or replace function public.update_order_status(
  p_order_id uuid,
  p_status   public.order_status,
  p_note     text default null
)
returns public.orders
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_order public.orders;
begin
  if v_uid is null then
    raise exception 'Bạn cần đăng nhập.';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Không tìm thấy đơn hàng.';
  end if;

  if not public.is_admin() then
    -- Không phải admin: chỉ CTV được giao, và chỉ được hoàn thành đơn đang làm.
    if v_order.assigned_ctv is distinct from v_uid
       or v_order.status <> 'in_progress'
       or p_status <> 'completed'
    then
      raise exception 'Bạn không có quyền thực hiện thao tác này.';
    end if;
  end if;

  update public.orders
  set status = p_status,
      completed_at = case when p_status = 'completed' then now() else completed_at end,
      cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end
  where id = p_order_id
  returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, v_uid, 'status_changed', nullif(btrim(coalesce(p_note, '')), ''),
          jsonb_build_object('status', p_status));

  perform public.notify_user(
    v_order.user_id, 'order_status',
    'Đơn ' || v_order.order_code || ' cập nhật trạng thái',
    case p_status
      when 'completed' then 'Đơn hàng của bạn đã hoàn thành. Cảm ơn bạn!'
      when 'refunded'  then 'Đơn hàng của bạn đã được hoàn tiền.'
      when 'cancelled' then 'Đơn hàng của bạn đã bị hủy.'
      else 'Trạng thái mới: ' || p_status
    end,
    '/orders/' || v_order.id
  );

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- cancel_order: khách hủy đơn CỦA MÌNH khi còn chờ thanh toán;
-- admin hủy bất kỳ lúc nào trước khi hoàn thành. Hoàn kho cho item.
-- ---------------------------------------------------------------------------
create or replace function public.cancel_order(p_order_id uuid, p_reason text default null)
returns public.orders
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_order public.orders;
begin
  if v_uid is null then
    raise exception 'Bạn cần đăng nhập.';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Không tìm thấy đơn hàng.';
  end if;

  if public.is_admin() then
    if v_order.status not in ('pending_payment', 'paid', 'in_progress') then
      raise exception 'Không thể hủy đơn ở trạng thái %.', v_order.status;
    end if;
  else
    if v_order.user_id <> v_uid or v_order.status <> 'pending_payment' then
      raise exception 'Bạn chỉ có thể hủy đơn của mình khi đơn còn chờ thanh toán.';
    end if;
  end if;

  -- Hoàn kho cho các item có quản lý tồn kho.
  update public.products p
  set stock = p.stock + oi.quantity
  from public.order_items oi
  where oi.order_id = p_order_id
    and oi.product_id = p.id
    and oi.product_kind = 'item'
    and p.stock is not null;

  update public.orders
  set status = 'cancelled',
      cancelled_at = now(),
      cancel_reason = nullif(btrim(coalesce(p_reason, '')), '')
  where id = p_order_id
  returning * into v_order;

  insert into public.order_events (order_id, actor_id, event_type, note, meta)
  values (p_order_id, v_uid, 'cancelled', nullif(btrim(coalesce(p_reason, '')), ''), null);

  if public.is_admin() then
    perform public.notify_user(
      v_order.user_id, 'order_cancelled',
      'Đơn ' || v_order.order_code || ' đã bị hủy',
      coalesce(nullif(btrim(coalesce(p_reason, '')), ''), 'Liên hệ hỗ trợ nếu bạn cần thêm thông tin.'),
      '/orders/' || v_order.id
    );
  else
    perform public.notify_admins(
      'order_cancelled',
      'Khách hủy đơn ' || v_order.order_code,
      coalesce(nullif(btrim(coalesce(p_reason, '')), ''), 'Khách không ghi lý do.'),
      '/work/orders/' || v_order.id
    );
  end if;

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- approve_ctv: admin duyệt/từ chối đơn ứng tuyển CTV.
-- Duyệt = nâng profiles.role lên 'ctv' (qua bypass guard nội bộ).
-- ---------------------------------------------------------------------------
create or replace function public.approve_ctv(
  p_application_id uuid,
  p_approve        boolean,
  p_note           text default null
)
returns public.ctv_applications
language plpgsql security definer
set search_path = public
as $$
declare
  v_app public.ctv_applications;
begin
  if not public.is_admin() then
    raise exception 'Chỉ admin mới được duyệt CTV.';
  end if;

  select * into v_app from public.ctv_applications where id = p_application_id for update;
  if not found then
    raise exception 'Không tìm thấy đơn ứng tuyển.';
  end if;
  if v_app.status <> 'pending' then
    raise exception 'Đơn ứng tuyển này đã được xử lý.';
  end if;

  update public.ctv_applications
  set status = case when p_approve then 'approved'::public.ctv_application_status
                    else 'rejected'::public.ctv_application_status end,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      note = nullif(btrim(coalesce(p_note, '')), '')
  where id = p_application_id
  returning * into v_app;

  if p_approve then
    -- Cho phép trigger guard_profile_role đi qua (admin cũng đã thỏa is_admin()).
    perform set_config('app.bypass_role_guard', '1', true);
    update public.profiles set role = 'ctv' where id = v_app.user_id;
    perform set_config('app.bypass_role_guard', '', true);
  end if;

  perform public.notify_user(
    v_app.user_id, 'ctv_application',
    case when p_approve then 'Chúc mừng! Bạn đã trở thành CTV của Uniemarket'
         else 'Đơn ứng tuyển CTV của bạn chưa được duyệt' end,
    coalesce(nullif(btrim(coalesce(p_note, '')), ''),
             case when p_approve then 'Vào khu làm việc /work để bắt đầu nhận đơn.'
                  else 'Bạn có thể ứng tuyển lại sau.' end),
    case when p_approve then '/work' else '/ctv' end
  );

  return v_app;
end;
$$;

-- ---------------------------------------------------------------------------
-- post_message: gửi tin nhắn vào thread (đơn hoặc kênh staff) + thông báo.
-- ---------------------------------------------------------------------------
create or replace function public.post_message(
  p_thread_id   uuid,
  p_body        text,
  p_attachments text[] default null
)
returns public.messages
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_thread  public.threads;
  v_order   public.orders;
  v_message public.messages;
  v_sender  text;
begin
  if v_uid is null then
    raise exception 'Bạn cần đăng nhập để nhắn tin.';
  end if;
  if p_body is null or btrim(p_body) = '' then
    raise exception 'Tin nhắn không được để trống.';
  end if;
  if not public.can_access_thread(p_thread_id) then
    raise exception 'Bạn không có quyền truy cập cuộc trò chuyện này.';
  end if;

  select * into v_thread from public.threads where id = p_thread_id;

  insert into public.messages (thread_id, sender_id, body, attachments)
  values (p_thread_id, v_uid, btrim(p_body), coalesce(p_attachments, '{}'))
  returning * into v_message;

  select coalesce(display_name, username) into v_sender
  from public.profiles where id = v_uid;

  if v_thread.kind = 'staff' then
    -- Thông báo cho toàn bộ staff trừ người gửi.
    insert into public.notifications (user_id, type, title, body, link)
    select id, 'message',
           'Tin nhắn mới trong ' || coalesce(v_thread.title, 'kênh nội bộ'),
           v_sender || ': ' || left(btrim(p_body), 120),
           '/work/chat'
    from public.profiles
    where role in ('admin', 'ctv') and id <> v_uid;
  else
    select * into v_order from public.orders where id = v_thread.order_id;
    -- Người tham gia thread đơn: khách + CTV được giao + các admin (trừ người gửi).
    insert into public.notifications (user_id, type, title, body, link)
    select distinct pid, 'message',
           'Tin nhắn mới về đơn ' || v_order.order_code,
           v_sender || ': ' || left(btrim(p_body), 120),
           case when pid = v_order.user_id
                then '/orders/' || v_order.id
                else '/work/orders/' || v_order.id end
    from (
      select v_order.user_id as pid
      union select v_order.assigned_ctv
      union select id from public.profiles where role = 'admin'
    ) participants
    where pid is not null and pid <> v_uid;
  end if;

  return v_message;
end;
$$;

-- ---- Phân quyền gọi RPC: chỉ người đã đăng nhập ---------------------------------
revoke execute on function public.place_order(jsonb, public.payment_method, text, text, text, text) from public, anon;
revoke execute on function public.confirm_payment(uuid, text) from public, anon;
revoke execute on function public.assign_order(uuid, uuid) from public, anon;
revoke execute on function public.update_order_status(uuid, public.order_status, text) from public, anon;
revoke execute on function public.cancel_order(uuid, text) from public, anon;
revoke execute on function public.approve_ctv(uuid, boolean, text) from public, anon;
revoke execute on function public.post_message(uuid, text, text[]) from public, anon;
revoke execute on function public.notify_user(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.notify_admins(text, text, text, text) from public, anon, authenticated;

grant execute on function public.place_order(jsonb, public.payment_method, text, text, text, text) to authenticated, service_role;
grant execute on function public.confirm_payment(uuid, text) to authenticated, service_role;
grant execute on function public.assign_order(uuid, uuid) to authenticated, service_role;
grant execute on function public.update_order_status(uuid, public.order_status, text) to authenticated, service_role;
grant execute on function public.cancel_order(uuid, text) to authenticated, service_role;
grant execute on function public.approve_ctv(uuid, boolean, text) to authenticated, service_role;
grant execute on function public.post_message(uuid, text, text[]) to authenticated, service_role;


-- ============================================================================
-- PHẦN 8/10 — STORAGE (kho ảnh)
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('product-images',   'product-images',   true),
  ('proof-images',     'proof-images',     true),
  ('site-assets',      'site-assets',      true),
  ('chat-attachments', 'chat-attachments', false)
on conflict (id) do nothing;

-- Ai cũng xem được ảnh trong 3 bucket công khai.
create policy "storage: public read" on storage.objects
  for select
  using (bucket_id in ('product-images', 'proof-images', 'site-assets'));

-- Ảnh sản phẩm & tài nguyên site: chỉ admin ghi.
create policy "storage: admin write product/site" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('product-images', 'site-assets') and public.is_admin());

create policy "storage: admin update product/site" on storage.objects
  for update to authenticated
  using (bucket_id in ('product-images', 'site-assets') and public.is_admin())
  with check (bucket_id in ('product-images', 'site-assets') and public.is_admin());

create policy "storage: admin delete product/site" on storage.objects
  for delete to authenticated
  using (bucket_id in ('product-images', 'site-assets') and public.is_admin());

-- Ảnh minh chứng: staff (admin + CTV) được tải lên.
create policy "storage: staff write proofs" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'proof-images' and public.is_staff());

create policy "storage: staff update proofs" on storage.objects
  for update to authenticated
  using (bucket_id = 'proof-images' and public.is_staff())
  with check (bucket_id = 'proof-images' and public.is_staff());

-- File đính kèm chat: đường dẫn dạng <thread_id>/<file> — chỉ người trong thread.
create policy "storage: chat attachments read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'chat-attachments'
    and public.can_access_thread(((storage.foldername(name))[1])::uuid)
  );

create policy "storage: chat attachments write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and public.can_access_thread(((storage.foldername(name))[1])::uuid)
  );


-- ============================================================================
-- PHẦN 9/10 — REALTIME (chat, hàng đợi đơn, thông báo cập nhật trực tiếp)
-- ============================================================================

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.threads;
alter publication supabase_realtime add table public.notifications;


-- ============================================================================
-- PHẦN 10/10 — DỮ LIỆU KHỞI TẠO (cài đặt shop + kênh chat nội bộ)
-- ============================================================================

insert into public.app_settings (key, value)
values
  ('bank_name',    '""'::jsonb),
  ('bank_account', '""'::jsonb),
  ('bank_holder',  '""'::jsonb),
  ('momo_number',  '""'::jsonb),
  ('momo_qr_url',  '""'::jsonb),
  ('brand',        '{"shop_name": "Uniemarket"}'::jsonb)
on conflict (key) do nothing;

-- Kênh chat nội bộ mặc định cho staff.
insert into public.threads (kind, title)
values ('staff', '# Chung');

-- ============================================================================
-- ✅ XONG! Schema đã sẵn sàng. Bước tiếp theo: chạy 02-seed.sql (tùy chọn),
-- rồi làm theo SETUP.md để kết nối web với Supabase.
-- ============================================================================
