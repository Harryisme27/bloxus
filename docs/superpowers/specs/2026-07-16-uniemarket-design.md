# Uniemarket — Bản thiết kế (Design Spec)

**Ngày:** 2026-07-16
**Loại dự án:** Website demo bán vật phẩm Roblox, phong cách gọn gàng kiểu bloxmart nhưng thương hiệu riêng.
**Chủ dự án:** Không chuyên kỹ thuật — website phải chạy trên máy Windows chỉ bằng vài cú nhấp chuột.

---

## 1. Tóm tắt & phạm vi (Scope)

Uniemarket là một **bản demo bấm-chạy-được** của một cửa hàng bán vật phẩm trong game Roblox
(pet, skin, vật phẩm, tiền tệ trong game). Mục tiêu: **trông đẹp, chuyên nghiệp, dùng mượt**,
để chủ shop xem/khoe/thử nghiệm trước khi quyết định lên thật.

**Các quyết định đã chốt (locked):**

- **Bán gì:** vật phẩm Roblox, phân loại theo game (giống bloxmart).
- **Loại bản:** DEMO chạy cục bộ (local) trên máy Windows. Dữ liệu là **dữ liệu mẫu (seed data)**, không có backend/database thật.
- **Thanh toán:** GIẢ LẬP — có giao diện thanh toán đẹp (thành công / thất bại / hủy) nhưng **không có tiền thật**, không cần tài khoản cổng thanh toán.
- **Giao diện:** bố cục/trải nghiệm gọn như bloxmart, nhưng thương hiệu riêng.
- **Tên thương hiệu:** **Uniemarket**.
- **Màu chủ đạo:** **Xanh lá (chính) + Vàng gold (điểm nhấn) + Đen/near-black (nền)** — trầm, dịu mắt, không chói. Dark theme là mặc định.
- **Ngôn ngữ giao diện:** **Tiếng Việt** làm mặc định (chủ shop người Việt), toàn bộ chữ gom một chỗ để dễ đổi; nút chuyển VI/EN là tính năng phụ (stretch).

**Ngoài phạm vi (Out of scope) cho bản demo:**

- Cổng thanh toán thật / bất kỳ dòng tiền thật nào.
- Backend/database thật (Supabase...), đăng nhập thật, gửi email thật.
- Tên miền, hosting, SSL, triển khai cloud.
- Tự động giao vật phẩm trong Roblox, gọi API bên thứ ba.
- Trang quản trị CRUD đầy đủ (chỉ có trang reset/điều khiển demo đơn giản).

---

## 2. Công nghệ (Tech stack)

Chọn theo 3 tiêu chí: (1) chủ shop không chuyên phải khởi động được bằng 1–2 cú nhấp;
(2) không cần server/database/cloud; (3) sau này nâng lên "thật" là **thay thế, không đập đi làm lại**.

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| Ngôn ngữ | TypeScript 5 | An toàn kiểu dữ liệu; định nghĩa 1 lần dùng cả đời, dễ nối DB sau. |
| Framework | React 18 + Vite 6 (SPA) | Cùng nền với bloxmart; khởi động nhanh, hot-reload. |
| Giao diện (CSS) | Tailwind CSS v3.4 | Nhiều ví dụ, ổn định; toàn bộ màu thương hiệu để trong 1 file, đổi màu 1 nơi. |
| Điều hướng | React Router v6 | Chuẩn phổ biến, map 1:1 với danh sách trang. |
| Trạng thái + dữ liệu | Seed data (file TS) + Zustand (persist → localStorage) | Không cần backend; giỏ hàng/đăng nhập/đơn hàng tự lưu vào trình duyệt. |
| Components | Radix UI + mẫu shadcn/ui + lucide-react (icon) | Sẵn accessible (Dialog, Accordion, Toast...), khớp phong cách bloxmart. |
| Font | Sora (tiêu đề) + Be Vietnam Pro (thân) — self-host | Đẹp, hỗ trợ đủ dấu tiếng Việt, chạy được cả khi offline. |

**Nguyên tắc kiến trúc quan trọng:** mọi component **không đọc/ghi dữ liệu trực tiếp**, mà đi qua một lớp
`src/lib/api.ts`. Hôm nay lớp này trả về seed data + localStorage; mai này chỉ cần thay ruột bằng
Supabase là lên thật, **không phải sửa giao diện**.

### Cách chạy cho người không chuyên (Windows)

1. Cài **Node.js** một lần (máy này đã có Node v24 → có thể bỏ qua).
2. Nên để thư mục dự án **ngoài OneDrive** (ví dụ `C:\Uniemarket`) để OneDrive không đồng bộ hàng nghìn file gây chậm.
3. **Nhấp đúp `start.bat`** → lần đầu tự cài (cần internet vài phút), xong tự mở trình duyệt tại `http://localhost:5173`.
4. Bấm thử: chọn game → thêm vào giỏ → thanh toán giả → xem màn hình thành công/thất bại. Không mất tiền.
5. Tắt: đóng cửa sổ đen. Mở lại: nhấp đúp `start.bat` (lần sau chạy trong vài giây, không cần internet).

---

## 3. Bộ nhận diện Uniemarket (Design system)

**Cảm giác thương hiệu:** một "phòng game cao cấp về đêm" — nền đen ngả xanh rất nhẹ, xanh lá emerald trầm tự tin,
vàng gold dùng tiết chế như "điểm nhấn kho báu". Sang trọng, đáng tin, hơi vui — **không chói, không neon**.

### Bảng màu (một số token chính, mã HEX)

| Token | HEX | Dùng cho |
|---|---|---|
| `bg` | `#0B0F0D` | Nền trang chính (đen ngả xanh nhẹ). |
| `surface` | `#131A16` | Thẻ, tile sản phẩm, navbar. |
| `surface-2` | `#1B241E` | Modal, dropdown, thẻ khi hover. |
| `green` | `#2FAE6B` | **Màu chính**: nút, link, focus, icon quan trọng (chữ đen trên nền xanh). |
| `green-hover` | `#37BE77` | Trạng thái hover của nút xanh. |
| `yellow` | `#E8B93B` | **Điểm nhấn** (gold trầm): giá tiền, sao đánh giá, badge "Hot/Featured". |
| `text` | `#F4F7F3` | Chữ chính (trắng ngà) — tương phản ~17:1, đạt AAA. |
| `text-muted` | `#A7B0A9` | Chữ phụ, mô tả, metadata. |
| `success` | `#35C06F` | Đặt hàng thành công, còn hàng, đã giao. |
| `danger` | `#E5484D` | Lỗi, thanh toán thất bại, hết hàng. |
| `warning` | `#E8A93B` | Chờ xử lý, đã hủy. |

**Quy tắc màu:** không bao giờ đặt chữ xanh lên nền vàng hay ngược lại (tương phản chỉ ~1.5:1) — luôn tách
bằng nền tối. Trên nút xanh/vàng dùng chữ **near-black**; không dùng chữ trắng trên nền xanh (fail contrast).

### Typography

- **Tiêu đề:** Sora (600/700/800). **Thân/label:** Be Vietnam Pro (400/500/600). **Số/mã đơn:** JetBrains Mono (tabular).
- Lưới 8px; body 16px, không nhỏ hơn 12px cho chữ có nghĩa; line-height 1.5 cho đoạn văn.

### Logo & motif

- **Logo:** chữ "Uniemarket" (Sora 700) + icon **khối lập phương isometric** kiểu "loot block/gem" — thân xanh,
  mặt trên vàng, thêm 1 tia sparkle nhỏ → gợi "vật phẩm hiếm vừa mở hộp". Có 3 biến thể: ngang (navbar), dọc (splash), icon rời (favicon).
- **Motif:** mặt khối, sparkle 4 cánh, lưới chấm mờ ở hero/empty state; glow xanh nhẹ khi hover.
- **Mascot (tùy chọn):** "Unie" — viên gem/slime xanh dễ thương, chỉ dùng ở khoảnh khắc vui (giỏ trống, 404, đặt hàng thành công), **không dùng** ở trang thanh toán thất bại/chính sách.

### Accessibility

- Tương phản đạt WCAG-AA (nhiều chỗ AAA). Luôn kèm **icon/chữ** cùng với màu trạng thái (không chỉ dựa vào màu).
- Focus xanh 2px rõ ràng, touch target ≥ 44px, tôn trọng `prefers-reduced-motion`, `lang="vi"`.

---

## 4. Dữ liệu (Data model) & nội dung mẫu

**Các thực thể (entities):** `Game`, `Item`, `User`, `CartItem`, `Order` (+ `OrderItem`), `Proof`, `Review`, `ChatThread`, `ChatMessage`.
Các trường được đặt để **mô phỏng đúng bảng DB tương lai** (khớp schema kiểu bloxmart) → nâng lên thật rất mượt.

**Catalog mẫu (8 game, mỗi game 3–5 vật phẩm, giá ~$1–$55):**

- **Adopt Me** — Neon Frost Dragon, Shadow Dragon, Mega Neon Unicorn, Bat Dragon, Ride Giraffe.
- **Murder Mystery 2** — Chroma Lightbringer, Chroma Seer, Elderwood Scythe, Nebula, Batwing.
- **Blox Fruits** — Kitsune, Leopard, Dragon, Dough, 10,000,000 Beli.
- **Grow a Garden** — Disco Bee, Raccoon, Dragonfly, Queen Bee, Mythical Egg Bundle.
- **Pet Simulator 99** — Titanic Cat, Huge Storm Agony, Huge Hell Rock, Huge Pixel Cat, 1 Trillion Diamonds.
- **Steal a Brainrot** — La Vacca Saturno, Graipuss Medusi, Los Tralaleritos, Tung Tung Sahur, Tralalero Tralala.
- **Anime Vanguards** — Song Jinwu, Cha-In, The Struggler, Reroll Bundle, Gems Pack.
- **Anime Defenders** — Fallen, Kaiser, Cursed Ghoul, Trait Reroll, 100,000 Gems.

Kèm sẵn: ~10 dòng **proof giao hàng** (mã đơn, item, buyer ẩn danh, thời gian, nhân viên xác minh) và ~10 **review**
(có cả tiếng Việt lẫn tiếng Anh, 3–5 sao). Đơn vị tiền: dùng nhất quán một loại trên toàn site (khuyến nghị chốt ở bước triển khai).

---

## 5. Danh sách trang (Pages)

**Trang có trong demo (bấm chạy được):**

| Trang | Route | Thật/Giả lập |
|---|---|---|
| Trang chủ / Storefront | `/` | Thật (seed + giỏ hàng thật) |
| Danh mục game | `/games` | Thật (tìm kiếm/lọc chạy được) |
| Trang 1 game (danh sách item) | `/games/:slug` | Thật (lọc/sắp xếp/tìm) |
| Chi tiết vật phẩm | `/item/:id` | Thật (thêm vào giỏ) |
| Giỏ hàng | `/cart` | Thật (lưu localStorage) |
| Thanh toán (demo) | `/checkout` | Luồng thật, thanh toán giả |
| Đặt hàng thành công | `/order-success` | Thật (đọc đơn vừa tạo) |
| Thanh toán thất bại | `/payment-failed` | Giả lập (bật qua kịch bản demo) |
| Thanh toán bị hủy | `/payment-cancelled` | Giả lập |
| Đăng nhập / Đăng ký | `/login`, `/register` | Thật (auth giả lập bằng localStorage) |
| Hồ sơ / Dashboard / Lịch sử đơn | `/profile`, `/dashboard`, `/orders` | Thật (đọc từ local) |
| Proofs / Đánh giá | `/proofs` | Giả lập (seed, chỉ hiển thị) |
| About / FAQ / Contact | `/about`, `/faq`, `/contact` | Tĩnh / FAQ có accordion chạy được |
| Chính sách (Terms/Privacy/Refund) | `/terms`, `/privacy`, `/refund` | Tĩnh (stub) |
| Chat hỗ trợ (giả lập) | widget nổi + `/messages` | Giả lập (bot trả lời theo kịch bản) — stretch |
| Trang điều khiển demo | `/admin` | Thật (reset dữ liệu, bật kịch bản demo) |
| 404 | `*` | Thật |

**Bỏ qua trong demo:** forgot/reset password, verify email, admin CRUD đầy đủ, các trang cộng đồng (`/iceberg`, `/vector`).

### Tín hiệu tạo niềm tin (Trust signals — điểm mấu chốt của loại shop này)

Proof giao hàng đã xác minh, đánh giá kiểu Trustpilot, badge "giao tức thì", badge "thanh toán an toàn/SSL",
chat hỗ trợ 24/7 (có chỉ báo online), bộ đếm số đơn đã giao (animated), link Discord cộng đồng, tồn kho + "verified seller",
và một dòng thông báo **"DEMO — không thanh toán thật"** rõ ràng để trung thực với người xem.

---

## 6. Kế hoạch build theo giai đoạn (Build phases)

> Bố trí để **chia nhiều agent làm song song** sau khi có nền móng.

- **Phase 0 — Nền móng (1 agent, làm trước, chặn các phase sau):**
  scaffold Vite+React+TS, cấu hình Tailwind + màu thương hiệu, khai báo mọi route (stub), dựng store
  (cart/auth/orders + cờ demo-scenario), tạo seed data + `resetSeed()`, dựng UI primitives (Button/Card/Badge/Input/Dialog/Toast),
  dựng khung app (Navbar/Footer/layout), gom chữ tiếng Việt vào 1 file, và tạo `start.bat` + README.

- **Phase 1 — Duyệt cửa hàng (agent A):** GameCard/ProductCard, Trang chủ, Danh mục game, Trang 1 game (lọc/sắp xếp/tìm),
  Chi tiết vật phẩm, nối "thêm vào giỏ".

- **Phase 2 — Giỏ hàng & đơn hàng (agent B):** Giỏ hàng, Checkout demo, logic tạo đơn + sinh mã đơn, Order Success (có tracker giao hàng giả lập), Payment Failed/Cancelled.

- **Phase 3 — Tài khoản & khu người mua (agent C):** Login/Register giả lập, bảo vệ route, Profile, Dashboard, Lịch sử đơn + reorder.

- **Phase 4 — Niềm tin, nội dung, hỗ trợ (agent D):** Proofs/Reviews, About, FAQ, Contact, các trang Legal, Tutorial, và chat hỗ trợ giả lập (stretch).

- **Phase 5 — Admin, hoàn thiện, bàn giao (1 agent, cuối, tích hợp):** Trang điều khiển demo, 404, rà soát responsive + accessibility,
  skeleton/empty state/toast, QA bấm-thử toàn bộ hành trình, kiểm tra `start.bat`/README từ trạng thái sạch, và làm 1 tờ "hướng dẫn nhanh" cho chủ shop.

---

## 7. Đường nâng cấp lên "thật" (sau này)

Vì mọi dữ liệu đi qua `src/lib/api.ts`, để lên thật chỉ cần: thêm `@supabase/supabase-js`, tạo client từ biến môi trường,
và viết lại ruột các hàm (`getGames`, `placeOrder`, `login`...) bằng truy vấn Supabase — **giao diện giữ nguyên**.
Auth đổi sang Supabase Auth; deploy `npm run build` lên Netlify/Vercel/Cloudflare Pages (miễn phí, không cần server);
thanh toán thật chỉ thêm khi muốn (Stripe/cổng VN). Chat và proof map thẳng vào bảng Supabase khi sẵn sàng.
