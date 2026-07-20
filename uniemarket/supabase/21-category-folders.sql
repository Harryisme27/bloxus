-- ============================================================================
-- 21-category-folders.sql — Folder (nhóm) cho danh mục: Roblox, CS2...
-- ----------------------------------------------------------------------------
-- Cấp trên của category: Folder -> Category (game) -> Product.
-- Storefront nhóm game theo folder để khách thấy shop có những "hệ" game nào.
-- Chạy 1 lần trong Supabase SQL Editor.
-- ============================================================================

create table if not exists public.category_folders (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.category_folders enable row level security;

drop policy if exists "folders public read" on public.category_folders;
create policy "folders public read" on public.category_folders
  for select to anon, authenticated using (true);

drop policy if exists "folders staff write" on public.category_folders;
create policy "folders staff write" on public.category_folders
  for all to authenticated
  using (public.is_admin_or_manager()) with check (public.is_admin_or_manager());

-- Gắn danh mục vào folder (null = chưa xếp folder).
alter table public.categories
  add column if not exists folder_id uuid references public.category_folders(id) on delete set null;

-- Xong.
