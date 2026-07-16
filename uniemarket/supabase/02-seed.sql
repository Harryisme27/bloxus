-- ============================================================================
-- UNIEMARKET V2 — 02-seed.sql (TÙY CHỌN)
-- ----------------------------------------------------------------------------
-- Dữ liệu mẫu: 8 danh mục game Roblox + 40 sản phẩm + 10 minh chứng + 10 đánh
-- giá (chuyển từ bản demo v1). Giá đã quy đổi USD → VNĐ (x25.000, làm tròn
-- đến 1.000đ). Chạy SAU 01-schema.sql. Bạn có thể bỏ qua file này nếu muốn
-- tự tạo danh mục/sản phẩm từ trang quản trị /work.
-- ============================================================================

-- ============================ DANH MỤC (8 game) =============================

insert into public.categories
  (slug, name, tagline, description, accent_color, contact_field_label, contact_field_placeholder, sort_order, is_featured, is_active)
values
  ('adopt-me', 'Adopt Me', 'The most-played pet-trading game on Roblox.',
   'Adopt Me là tựa game nuôi và giao dịch thú cưng nổi tiếng nhất Roblox. Tại Uniemarket, bạn có thể mua các thú cưng Legendary, Rare hiếm có khó tìm với giá tốt và giao hàng nhanh chóng.',
   '#7BD0F0', 'Username Roblox', 'VD: RobloxPlayer123', 1, true, true),
  ('murder-mystery-2', 'Murder Mystery 2', 'Iconic MM2 knives and guns.',
   'Murder Mystery 2 (MM2) nổi tiếng với các con dao (knife) và súng Chroma, Godly cực đẹp. Uniemarket cung cấp đầy đủ các vật phẩm Godly hot nhất với độ uy tín cao.',
   '#E5484D', 'Username Roblox', 'VD: RobloxPlayer123', 2, true, true),
  ('blox-fruits', 'Blox Fruits', 'Permanent fruits, rare swords, Beli.',
   'Blox Fruits là game phiêu lưu chiến đấu lấy cảm hứng từ One Piece. Chúng tôi bán trái ác quỷ vĩnh viễn (Permanent), kiếm hiếm và Beli với mức giá cạnh tranh nhất thị trường.',
   '#4CC2FF', 'Username Roblox', 'VD: RobloxPlayer123', 3, true, true),
  ('grow-a-garden', 'Grow a Garden', 'Rare pollinating pets and seed bundles.',
   'Grow a Garden là game trồng trọt kết hợp thú cưng thụ phấn đang gây sốt. Sở hữu ngay các thú cưng Godly, Mythical hiếm và bundle hạt giống chỉ có tại Uniemarket.',
   '#6FCF5B', 'Username Roblox', 'VD: RobloxPlayer123', 4, true, true),
  ('pet-simulator-99', 'Pet Simulator 99', 'Huge and Titanic pets plus Diamonds.',
   'Pet Simulator 99 nổi bật với các thú cưng khổng lồ Huge và Titanic cực kỳ hiếm, cùng nguồn Diamonds dồi dào. Giao dịch an toàn, nhanh chóng tại Uniemarket.',
   '#C77BF0', 'Username Roblox', 'VD: RobloxPlayer123', 5, true, true),
  ('steal-a-brainrot', 'Steal a Brainrot', 'Collect the viral brainrot characters.',
   'Steal a Brainrot cho phép bạn sưu tầm các nhân vật brainrot viral đang làm mưa làm gió trên mạng xã hội. Uniemarket có đầy đủ các nhân vật Secret cực hiếm.',
   '#F0A93B', 'Username Roblox', 'VD: RobloxPlayer123', 6, true, true),
  ('anime-vanguards', 'Anime Vanguards', 'Top-tier tower units, gems, rerolls.',
   'Anime Vanguards là game tower-defense chủ đề anime với các unit Secret, Mythical mạnh mẽ. Chúng tôi bán unit hiếm, gói reroll và gems giúp bạn build đội hình mạnh nhanh chóng.',
   '#F05B8C', 'Username Roblox', 'VD: RobloxPlayer123', 7, false, true),
  ('anime-defenders', 'Anime Defenders', 'Secret and mythic units, gems, rerolls.',
   'Anime Defenders là đối thủ đáng gờm trong dòng game tower-defense anime, với các unit Secret, Mythic cực mạnh. Mua unit, gems và reroll ngay tại Uniemarket.',
   '#8C7BF0', 'Username Roblox', 'VD: RobloxPlayer123', 8, false, true)
on conflict (slug) do nothing;

-- ============================ SẢN PHẨM (40 item) ============================
-- Giá VNĐ = giá USD cũ x 25.000, làm tròn đến 1.000đ (vd $34.99 → 875.000đ).

insert into public.products
  (category_id, slug, kind, name, description, price, original_price, stock, rarity, delivery_time_text, tags, is_featured, is_active, sort_order)
values
  -- ------------------------------- Adopt Me -------------------------------
  ((select id from public.categories where slug = 'adopt-me'), 'adopt-me-neon-frost-dragon', 'item',
   'Neon Frost Dragon', 'Rồng Frost phiên bản Neon phát sáng lung linh, một trong những thú cưng được săn lùng nhiều nhất Adopt Me.',
   875000, null, 6, 'Legendary', 'Instant', '{neon,dragon,hot}', true, true, 1),
  ((select id from public.categories where slug = 'adopt-me'), 'adopt-me-shadow-dragon', 'item',
   'Shadow Dragon', 'Rồng bóng đêm huyền bí, thú cưng Legendary kinh điển của Adopt Me.',
   688000, null, 5, 'Legendary', '5-10 phút', '{dragon}', false, true, 2),
  ((select id from public.categories where slug = 'adopt-me'), 'adopt-me-mega-neon-unicorn', 'item',
   'Mega Neon Unicorn', 'Kỳ lân Mega Neon hiếm có, hiệu ứng phát sáng cấp cao nhất trong game.',
   475000, 575000, 4, 'Legendary', 'Instant', '{mega-neon,unicorn,sale}', false, true, 3),
  ((select id from public.categories where slug = 'adopt-me'), 'adopt-me-bat-dragon', 'item',
   'Bat Dragon', 'Rồng Dơi huyền thoại từ sự kiện Halloween, một trong những pet giá trị nhất Adopt Me.',
   550000, null, 0, 'Legendary', '5-10 phút', '{dragon,halloween}', false, true, 4),
  ((select id from public.categories where slug = 'adopt-me'), 'adopt-me-ride-giraffe', 'item',
   'Ride Giraffe', 'Hươu cao cổ cưỡi được (Ride), thú cưng Rare phổ biến và dễ mua.',
   250000, null, 12, 'Rare', 'Instant', '{ride,giraffe}', false, true, 5),

  -- --------------------------- Murder Mystery 2 ---------------------------
  ((select id from public.categories where slug = 'murder-mystery-2'), 'mm2-chroma-lightbringer', 'item',
   'Chroma Lightbringer', 'Dao Chroma Lightbringer đổi màu liên tục, vật phẩm đỉnh cao của MM2.',
   1125000, null, 3, 'Godly', 'Instant', '{chroma,knife,hot}', true, true, 1),
  ((select id from public.categories where slug = 'murder-mystery-2'), 'mm2-chroma-seer', 'item',
   'Chroma Seer', 'Dao Chroma Seer với hiệu ứng ánh sáng huyền ảo, cực kỳ được săn đón.',
   750000, null, 0, 'Godly', 'Instant', '{chroma,knife}', false, true, 2),
  ((select id from public.categories where slug = 'murder-mystery-2'), 'mm2-elderwood-scythe', 'item',
   'Elderwood Scythe', 'Lưỡi hái Elderwood chạm khắc gỗ cổ, vật phẩm Godly được nhiều người sưu tầm.',
   425000, 500000, 7, 'Godly', 'Instant', '{scythe,sale}', false, true, 3),
  ((select id from public.categories where slug = 'murder-mystery-2'), 'mm2-nebula', 'item',
   'Nebula', 'Dao Nebula họa tiết thiên hà lấp lánh, độ hiếm Godly.',
   313000, null, 9, 'Godly', 'Instant', '{knife}', false, true, 4),
  ((select id from public.categories where slug = 'murder-mystery-2'), 'mm2-batwing', 'item',
   'Batwing', 'Dao Batwing hình cánh dơi, vật phẩm Godly quen thuộc trong mọi bộ sưu tập MM2.',
   225000, null, 15, 'Godly', 'Instant', '{knife,bat}', false, true, 5),

  -- ------------------------------ Blox Fruits ------------------------------
  ((select id from public.categories where slug = 'blox-fruits'), 'blox-fruits-kitsune', 'item',
   'Kitsune (Permanent)', 'Trái ác quỷ Kitsune vĩnh viễn, biến hình cáo chín đuôi huyền thoại, cực mạnh trong PvP.',
   1000000, null, 4, 'Mythical', 'Instant', '{permanent,mythical,hot}', true, true, 1),
  ((select id from public.categories where slug = 'blox-fruits'), 'blox-fruits-leopard', 'item',
   'Leopard (Permanent)', 'Trái Leopard vĩnh viễn, tốc độ di chuyển và sát thương cận chiến cực cao.',
   375000, 450000, 8, 'Legendary', 'Instant', '{permanent,sale}', false, true, 2),
  ((select id from public.categories where slug = 'blox-fruits'), 'blox-fruits-dragon', 'item',
   'Dragon (Permanent)', 'Trái Dragon vĩnh viễn, biến hình rồng Đông phương với sức mạnh áp đảo.',
   325000, null, 0, 'Mythical', 'Instant', '{permanent,dragon}', false, true, 3),
  ((select id from public.categories where slug = 'blox-fruits'), 'blox-fruits-dough', 'item',
   'Dough (Permanent)', 'Trái Dough vĩnh viễn, một trong những trái Logia mạnh nhất hiện tại của Blox Fruits.',
   175000, null, 10, 'Legendary', 'Instant', '{permanent}', false, true, 4),
  ((select id from public.categories where slug = 'blox-fruits'), 'blox-fruits-beli-10m', 'item',
   '10,000,000 Beli', 'Gói 10 triệu Beli, tiền tệ trong game dùng để nâng cấp trang bị và mua đồ.',
   125000, null, 20, 'Common', 'Instant', '{currency,beli}', false, true, 5),

  -- ----------------------------- Grow a Garden -----------------------------
  ((select id from public.categories where slug = 'grow-a-garden'), 'grow-a-garden-disco-bee', 'item',
   'Disco Bee', 'Ong Disco Bee huyền thoại, hiệu ứng thụ phấn cực mạnh và ngoại hình cực chất.',
   625000, null, 5, 'Godly', 'Instant', '{bee,hot}', true, true, 1),
  ((select id from public.categories where slug = 'grow-a-garden'), 'grow-a-garden-raccoon', 'item',
   'Raccoon', 'Gấu mèo Raccoon, thú cưng Legendary hỗ trợ thu hoạch vườn hiệu quả.',
   450000, null, 6, 'Legendary', 'Instant', '{raccoon}', false, true, 2),
  ((select id from public.categories where slug = 'grow-a-garden'), 'grow-a-garden-dragonfly', 'item',
   'Dragonfly', 'Chuồn chuồn Dragonfly hiếm, thụ phấn nhanh và bay đẹp mắt.',
   325000, null, 7, 'Mythical', 'Instant', '{dragonfly}', false, true, 3),
  ((select id from public.categories where slug = 'grow-a-garden'), 'grow-a-garden-queen-bee', 'item',
   'Queen Bee', 'Ong chúa Queen Bee, thú cưng Mythical đầu đàn hiếm có.',
   250000, null, 0, 'Mythical', 'Instant', '{bee,queen}', false, true, 4),
  ((select id from public.categories where slug = 'grow-a-garden'), 'grow-a-garden-mythical-egg-bundle', 'item',
   'Mythical Egg Bundle', 'Gói trứng Mythical Egg Bundle, cơ hội nở ra thú cưng hiếm cho khu vườn của bạn.',
   150000, null, 14, 'Rare', 'Instant', '{bundle,egg}', false, true, 5),

  -- --------------------------- Pet Simulator 99 ---------------------------
  ((select id from public.categories where slug = 'pet-simulator-99'), 'ps99-titanic-cat', 'item',
   'Titanic Cat', 'Mèo Titanic Cat khổng lồ, một trong những thú cưng hiếm và có giá trị cao nhất Pet Simulator 99.',
   1375000, null, 2, 'Titanic', '5-10 phút', '{titanic,cat,hot}', true, true, 1),
  ((select id from public.categories where slug = 'pet-simulator-99'), 'ps99-huge-storm-agony', 'item',
   'Huge Storm Agony', 'Thú cưng Huge Storm Agony cực hiếm với hiệu ứng bão sấm sét ấn tượng.',
   825000, null, 0, 'Huge', 'Instant', '{huge,storm}', false, true, 2),
  ((select id from public.categories where slug = 'pet-simulator-99'), 'ps99-huge-hell-rock', 'item',
   'Huge Hell Rock', 'Thú cưng Huge Hell Rock với ngoại hình đá lửa dữ dội, chỉ số cực khủng.',
   500000, null, 5, 'Huge', 'Instant', '{huge,rock}', false, true, 3),
  ((select id from public.categories where slug = 'pet-simulator-99'), 'ps99-huge-pixel-cat', 'item',
   'Huge Pixel Cat', 'Mèo pixel phong cách retro, thú cưng Huge được nhiều người yêu thích.',
   300000, null, 8, 'Huge', 'Instant', '{huge,pixel}', false, true, 4),
  ((select id from public.categories where slug = 'pet-simulator-99'), 'ps99-diamonds-1t', 'item',
   '1 Trillion Diamonds', 'Gói 1 nghìn tỷ Diamonds, dùng để nâng cấp và mở khoá vật phẩm trong game.',
   200000, null, 25, 'Common', 'Instant', '{currency,diamonds}', false, true, 5),

  -- --------------------------- Steal a Brainrot ---------------------------
  ((select id from public.categories where slug = 'steal-a-brainrot'), 'sab-la-vacca-saturno-saturnita', 'item',
   'La Vacca Saturno Saturnita', 'Nhân vật brainrot Secret cực hiếm, một trong những nhân vật viral nhất hiện nay.',
   750000, null, 4, 'Secret', 'Instant', '{secret,hot}', true, true, 1),
  ((select id from public.categories where slug = 'steal-a-brainrot'), 'sab-graipuss-medusi', 'item',
   'Graipuss Medusi', 'Nhân vật Graipuss Medusi độ hiếm Secret, ngoại hình độc đáo và giá trị cao.',
   625000, null, 0, 'Secret', 'Instant', '{secret}', false, true, 2),
  ((select id from public.categories where slug = 'steal-a-brainrot'), 'sab-los-tralaleritos', 'item',
   'Los Tralaleritos', 'Nhóm nhân vật Los Tralaleritos, độ hiếm Secret được nhiều người săn đón.',
   500000, null, 6, 'Secret', 'Instant', '{secret}', false, true, 3),
  ((select id from public.categories where slug = 'steal-a-brainrot'), 'sab-tung-tung-tung-sahur', 'item',
   'Tung Tung Tung Sahur', 'Nhân vật Tung Tung Tung Sahur nổi tiếng, độ hiếm Legendary, giá phải chăng.',
   175000, 225000, 11, 'Legendary', 'Instant', '{legendary,sale}', false, true, 4),
  ((select id from public.categories where slug = 'steal-a-brainrot'), 'sab-tralalero-tralala', 'item',
   'Tralalero Tralala', 'Nhân vật Tralalero Tralala vui nhộn, độ hiếm Epic, phù hợp cho người mới sưu tầm.',
   100000, null, 18, 'Epic', 'Instant', '{epic}', false, true, 5),

  -- --------------------------- Anime Vanguards ----------------------------
  ((select id from public.categories where slug = 'anime-vanguards'), 'av-song-jinwu', 'item',
   'Song Jinwu (Monarch)', 'Unit Song Jinwu (Monarch) độ hiếm Secret, sát thương và hỗ trợ đội hình hàng đầu.',
   700000, null, 3, 'Secret', 'Instant', '{secret,monarch,hot}', true, true, 1),
  ((select id from public.categories where slug = 'anime-vanguards'), 'av-cha-in-blade-dancer', 'item',
   'Cha-In (Blade Dancer)', 'Unit Cha-In (Blade Dancer) độ hiếm Mythical, tốc độ tấn công cực nhanh.',
   325000, null, 9, 'Mythical', 'Instant', '{mythical}', false, true, 2),
  ((select id from public.categories where slug = 'anime-vanguards'), 'av-the-struggler', 'item',
   'The Struggler', 'Unit The Struggler độ hiếm Mythical, khả năng gây choáng diện rộng.',
   250000, null, 0, 'Mythical', 'Instant', '{mythical}', false, true, 3),
  ((select id from public.categories where slug = 'anime-vanguards'), 'av-reroll-bundle-x50', 'item',
   'Reroll Bundle (x50)', 'Gói 50 lượt reroll trait, giúp bạn tối ưu chỉ số unit nhanh hơn.',
   175000, null, 20, 'Rare', 'Instant', '{bundle,reroll}', false, true, 4),
  ((select id from public.categories where slug = 'anime-vanguards'), 'av-gems-pack-5000', 'item',
   'Gems Pack (5,000)', 'Gói 5,000 Gems, tiền tệ cao cấp dùng để triệu hồi unit hiếm.',
   125000, null, 30, 'Common', 'Instant', '{currency,gems}', false, true, 5),

  -- --------------------------- Anime Defenders ----------------------------
  ((select id from public.categories where slug = 'anime-defenders'), 'ad-fallen', 'item',
   'Fallen (Secret)', 'Unit Fallen độ hiếm Secret, một trong những unit mạnh nhất Anime Defenders hiện tại.',
   575000, null, 4, 'Secret', '5-10 phút', '{secret,hot}', true, true, 1),
  ((select id from public.categories where slug = 'anime-defenders'), 'ad-kaiser', 'item',
   'Kaiser (Mythic)', 'Unit Kaiser độ hiếm Mythic, sát thương diện rộng cực mạnh.',
   350000, null, 7, 'Mythic', 'Instant', '{mythic}', false, true, 2),
  ((select id from public.categories where slug = 'anime-defenders'), 'ad-cursed-ghoul', 'item',
   'Cursed Ghoul', 'Unit Cursed Ghoul độ hiếm Mythic, khả năng hồi máu và hỗ trợ đội hình.',
   250000, null, 0, 'Mythic', 'Instant', '{mythic}', false, true, 3),
  ((select id from public.categories where slug = 'anime-defenders'), 'ad-trait-reroll-x25', 'item',
   'Trait Reroll (x25)', 'Gói 25 lượt reroll trait cho unit, tối ưu hoá chỉ số chiến đấu.',
   112000, null, 22, 'Rare', 'Instant', '{bundle,reroll}', false, true, 4),
  ((select id from public.categories where slug = 'anime-defenders'), 'ad-gems-100000', 'item',
   '100,000 Gems', 'Gói 100,000 Gems, dùng để triệu hồi và nâng cấp unit hiếm.',
   150000, null, 28, 'Common', 'Instant', '{currency,gems}', false, true, 5)
on conflict (slug) do nothing;

-- ========================= MINH CHỨNG GIAO HÀNG (10) =========================
-- order_id để null vì đây là dữ liệu mẫu, không gắn với đơn hàng thật nào.

insert into public.proofs
  (game_name, item_name, rarity, buyer_masked, amount, staff_name, status, delivered_at)
values
  ('Adopt Me',          'Neon Frost Dragon',           'Legendary', 'Kh***lyn',       875000,  'Minh', 'Verified', '2026-07-16T11:58:00Z'),
  ('Murder Mystery 2',  'Chroma Lightbringer',         'Godly',     'Sn***per_99',    1125000, 'An',   'Verified', '2026-07-16T11:40:00Z'),
  ('Blox Fruits',       'Kitsune',                     'Mythical',  'Dr***King',      1000000, 'Huy',  'Verified', '2026-07-16T11:22:00Z'),
  ('Pet Simulator 99',  '1 Trillion Diamonds',         'Common',    'xX***Zoe',       200000,  'Linh', 'Verified', '2026-07-16T11:04:00Z'),
  ('Steal a Brainrot',  'La Vacca Saturno Saturnita',  'Secret',    'Br***Lord',      750000,  'Minh', 'Verified', '2026-07-16T10:46:00Z'),
  ('Anime Vanguards',   'Song Jinwu',                  'Secret',    'Sh***wMonarch',  700000,  'An',   'Verified', '2026-07-16T10:28:00Z'),
  ('Grow a Garden',     'Disco Bee',                   'Godly',     'Ga***Queen',     625000,  'Huy',  'Verified', '2026-07-16T10:10:00Z'),
  ('Pet Simulator 99',  'Titanic Cat',                 'Titanic',   'Me***Collector', 1375000, 'Linh', 'Verified', '2026-07-16T09:52:00Z'),
  ('Adopt Me',          'Shadow Dragon',               'Legendary', 'Lu***Pets',      688000,  'Minh', 'Verified', '2026-07-16T09:26:00Z'),
  ('Anime Defenders',   'Fallen',                      'Secret',    'Fr***Blade',     575000,  'An',   'Verified', '2026-07-16T09:00:00Z');

-- ============================== ĐÁNH GIÁ (10) ================================

insert into public.reviews
  (author, stars, text, category_slug, item_name, verified_purchase, source, created_at)
values
  ('Kaylin R.',     5, 'Bought a Neon Frost Dragon for Adopt Me and it was in my account within 3 minutes. Staff even sent a screenshot as proof!',
   'adopt-me', 'Neon Frost Dragon', true, 'Trustpilot', '2026-06-02T14:20:00Z'),
  ('Marcus T.',     5, 'Been buying MM2 knives here for months. Chroma Lightbringer delivered instantly.',
   'murder-mystery-2', 'Chroma Lightbringer', true, 'Trustpilot', '2026-06-05T09:12:00Z'),
  ('Sniper_99',     4, 'Good prices and fast delivery on Blox Fruits.',
   'blox-fruits', null, true, 'On-site', '2026-06-08T18:45:00Z'),
  ('Minh Le',       5, 'Giao dịch nhanh, nhân viên hỗ trợ nhiệt tình. Rất uy tín!',
   null, null, true, 'Discord', '2026-06-10T11:03:00Z'),
  ('GardenQueen',   5, 'The Disco Bee was way cheaper than other sites and 100% legit.',
   'grow-a-garden', 'Disco Bee', true, 'Trustpilot', '2026-06-14T20:31:00Z'),
  ('Zoe M.',        5, 'Customer service is amazing, they fixed my delivery right away.',
   'pet-simulator-99', null, true, 'On-site', '2026-06-18T08:52:00Z'),
  ('BrainrotLord',  4, 'La Vacca came fast and the proof log gave me confidence.',
   'steal-a-brainrot', 'La Vacca Saturno Saturnita', true, 'On-site', '2026-06-22T16:09:00Z'),
  ('Huy Nguyen',    5, 'Website đẹp, dễ dùng, thanh toán mượt mà.',
   null, null, true, 'Discord', '2026-06-27T13:40:00Z'),
  ('ShadowMonarch', 5, 'The verified proofs feed convinced me to trust the site.',
   'anime-vanguards', 'Song Jinwu', true, 'Trustpilot', '2026-07-02T10:17:00Z'),
  ('Emma P.',       3, 'Item delivered correctly but took ~20 min during peak hours.',
   null, null, true, 'On-site', '2026-07-10T21:55:00Z');

-- ============================================================================
-- ✅ XONG! Đã có 8 danh mục, 40 sản phẩm, 10 minh chứng, 10 đánh giá mẫu.
-- ============================================================================
