-- ============================================================================
-- BLOXUS — 39-rebrand-bloxus.sql
-- ----------------------------------------------------------------------------
-- Doi thuong hieu "Uniemarket" -> "Bloxus" cho DU LIEU + HAM da nam san trong
-- database Supabase. Sua file .sql cu tren may KHONG tu dong doi database dang
-- chay, nen phai chay file nay 1 lan.
--
-- Cach chay: Supabase Dashboard -> SQL Editor -> New query -> dan toan bo file
-- nay -> Run. Chay lai nhieu lan cung an toan (idempotent).
-- ============================================================================

-- ---- 1. Ten shop trong Cai dat (hien o trang /work -> Cai dat) --------------
-- Gia tri co the la chuoi JSON ("Uniemarket") hoac object ({"shop_name": ...})
-- tuy admin da tung bam Luu hay chua. Xu ly ca hai dang.
update public.app_settings
set value = '"Bloxus"'::jsonb, updated_at = now()
where key = 'brand'
  and jsonb_typeof(value) = 'string'
  and value #>> '{}' = 'Uniemarket';

update public.app_settings
set value = jsonb_set(value, '{shop_name}', '"Bloxus"'), updated_at = now()
where key = 'brand'
  and jsonb_typeof(value) = 'object'
  and value ->> 'shop_name' = 'Uniemarket';

-- ---- 2. Cac ham SQL con chua chuoi "Uniemarket" -----------------------------
-- Vi du: confirm_received() ghi 'Uniemarket' lam ten mac dinh khi tao minh
-- chung, approve_ctv() gui thong bao "... tro thanh CTV cua Uniemarket".
-- Doan nay doc dinh nghia THUC TE dang chay, thay chuoi, roi tao lai ham —
-- nen khong phu thuoc vao viec file .sql nao dinh nghia ham do lan cuoi.
do $rebrand$
declare
  r record;
  v_def text;
begin
  for r in
    select p.oid, p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.prosrc like '%Uniemarket%'
  loop
    v_def := replace(pg_get_functiondef(r.oid), 'Uniemarket', 'Bloxus');
    execute v_def;
    raise notice 'Da cap nhat ham: %', r.proname;
  end loop;
end
$rebrand$;

-- ---- 3. Du lieu cu da luu ten thuong hieu -----------------------------------
-- Minh chung (proofs) tao truoc day co the ghi 'Uniemarket' o ten game hoac
-- ten nhan vien (do la gia tri mac dinh khi don thieu thong tin).
update public.proofs set game_name  = 'Bloxus' where game_name  = 'Uniemarket';
update public.proofs set staff_name = 'Bloxus' where staff_name = 'Uniemarket';

-- Thong bao in-app da gui truoc day (vd: "Ban da tro thanh CTV cua Uniemarket").
update public.notifications
set title = replace(title, 'Uniemarket', 'Bloxus')
where title like '%Uniemarket%';

update public.notifications
set body = replace(body, 'Uniemarket', 'Bloxus')
where body like '%Uniemarket%';

-- ---- 4. Danh muc / san pham nap tu 02-seed.sql ------------------------------
-- Mo ta cac game mau co nhac ten shop. Chi doi phan chu, khong dung toi gia
-- hay ton kho.
update public.categories
set description = replace(description, 'Uniemarket', 'Bloxus')
where description like '%Uniemarket%';

-- ---- 5. Kiem tra: cau lenh duoi phai tra ve 0 dong --------------------------
-- select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.prosrc like '%Uniemarket%';
