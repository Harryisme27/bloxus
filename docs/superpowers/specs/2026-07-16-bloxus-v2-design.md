# Bloxus v2 — Bản thiết kế (Design Spec)

**Ngày:** 2026-07-16 · **Kế thừa:** Bloxus v1 (demo Roblox, đã hoàn thành & verify)
**Hướng mới:** Sàn bán **item + dịch vụ game đa danh mục** (CS2 trước, mở rộng tùy ý) với **backend Supabase thật**, khu làm việc riêng cho **Admin + CTV**, và **chat realtime**.

---

## 1. Các quyết định đã chốt (locked)

1. **Đa danh mục, không khóa game nào** — chủ shop tự tạo danh mục & sản phẩm qua trang quản trị (không sửa code).
2. Sản phẩm 2 loại: **ITEM** (hàng giao, vd skin CS2 qua Steam trade) và **SERVICE** (dịch vụ, vd cày thuê rank — có tùy chọn cấu hình giá).
3. **Backend thật: Supabase free tier** (Postgres + Auth + Realtime + Storage). App vẫn là Vite SPA, chạy local qua `start.bat`, deploy sau.
4. **3 vai trò:** `customer` / `ctv` / `admin`. CTV đăng ký ở trang `/ctv`, admin duyệt. **Admin giao đơn cho CTV** (CTV không tự nhận).
5. **Luồng đơn:** khách đặt → đơn vào DB → hiện ở khu làm việc (chỉ admin+CTV thấy) → admin xác nhận đã nhận tiền → admin giao CTV → CTV liên hệ khách, thực hiện, hoàn thành.
6. **Chat:** (a) thread theo từng đơn giữa khách ↔ CTV được giao + admin; (b) chat nội bộ staff (khách không bao giờ thấy). Realtime.
7. **Thanh toán thủ công:** checkout hiện STK ngân hàng / QR Momo (đọc từ cài đặt admin) + mã đơn làm nội dung CK; admin đối chiếu và xác nhận. Thiết kế sẵn chỗ cắm cổng tự động (PayOS/Casso) sau.
8. **Tiền:** VNĐ chính (lưu `amount + currency`), USD hiển thị là stretch.
9. UI tiếng Việt; giữ nguyên thương hiệu Bloxus (xanh lá/vàng gold/đen) và tái sử dụng tối đa giao diện v1.
10. **Bỏ chế độ mock/demo** — không duy trì 2 hệ song song; nguồn sự thật duy nhất là Supabase.

### Quyết định tổng hợp (do các planner đề xuất khác nhau, chốt như sau)
- **Trạng thái đơn (6):** `pending_payment` (Chờ thanh toán) → `paid` (Đã thanh toán) → `in_progress` (Đang thực hiện — tự set khi admin giao CTV, không có bước "assigned" riêng) → `completed` (Hoàn thành) | `cancelled` (Đã hủy) | `refunded` (Đã hoàn tiền). Việc giao đơn lưu ở cột `assigned_ctv/assigned_by/assigned_at` + audit log, không phải một status riêng.
- **Chat dùng 1 cặp bảng thống nhất** `threads` (kind: `order` | `staff`) + `messages` — không tách 2 bảng riêng.
- **Toàn bộ khu staff nằm dưới `/work`** (admin-only subroutes bên trong). `/admin` redirect về `/work`. Không có namespace quản trị thứ hai.
- **Route sản phẩm:** `/categories`, `/categories/:slug`, `/product/:id` (redirect từ `/games*`, `/item/:id` cũ).

---

## 2. Database (Supabase Postgres)

**Bảng:** `profiles` (1-1 auth.users; role; trigger tự tạo; **trigger chặn tự đổi role**), `categories` (slug, tên, ảnh, accent, contact_field_label riêng từng danh mục, active/featured/sort), `products` (kind item|service; giá `bigint` VNĐ; stock nullable — chỉ item; `images text[]`; `service_options jsonb` 2 dạng: `tiers` hoặc `rank_range` — mọi option phải tính được giá phía server), `orders` (order_code ngắn kiểu `UM-4F7K2Q` làm nội dung CK; contact khách; assigned_ctv; các mốc thời gian), `order_items` (snapshot giá/tên/option), `order_events` (audit log nuôi timeline), `threads` + `messages` (chat, attachments), `ctv_applications`, `proofs`, `reviews`, `app_settings` (STK bank, Momo, QR — admin sửa trên web), `notifications`.

**Nguyên tắc an ninh (RLS là ranh giới thật, không phải UI):**
- Khách chỉ SELECT đơn/thread của mình; CTV chỉ thấy đơn **được giao cho mình** + thread staff; admin thấy hết; anon chỉ thấy catalog active.
- **Mọi thao tác tiền & trạng thái qua RPC `SECURITY DEFINER`:** `place_order` (server tự tính lại giá + trừ kho atomic — không tin giá từ client), `confirm_payment`, `assign_order`, `update_order_status`, `cancel_order`. Trigger BEFORE UPDATE kiểm tra đồ thị chuyển trạng thái.
- Check role qua helper `is_admin()/is_staff()` SECURITY DEFINER (tránh RLS đệ quy). View `public_profiles` (tên + avatar) cho chat.

**Storage buckets:** `product-images` (public read, admin ghi), `proof-images` (public read, staff ghi), `chat-attachments` (private, signed URL, path theo thread_id), `site-assets` (QR/logo).
**Realtime:** `messages` (chat), `orders` (queue staff cập nhật live, khách theo dõi đơn), `threads` (inbox/unread), `notifications`.

---

## 3. Trang & luồng

### Storefront (khách) — tái sử dụng v1, đổi nguồn dữ liệu
- `/` giữ layout; Featured đọc từ DB. `/categories`, `/categories/:slug` (lọc/tìm như cũ). `/product/:id`: item = như cũ + ảnh thật; service = **bộ cấu hình option** (tier hoặc rank-from/to) tính giá trực tiếp.
- Cart giữ zustand+localStorage (thêm snapshot option). **Checkout yêu cầu đăng nhập** (bỏ guest — cần cho RLS/chat/tracking): form liên hệ (field theo danh mục, vd "Link trade Steam"), chọn Chuyển khoản/Momo → `place_order` → màn hình hướng dẫn CK kèm mã đơn.
- `/orders/:id` (mới): timeline trạng thái từ `order_events`, khối hướng dẫn thanh toán khi chờ, **chat với CTV/admin ngay trong trang**. `/messages` = inbox các thread. Xóa `/payment-failed`, `/payment-cancelled`, FakeCardForm, demoStore, DemoNotice/Chip.
- `/ctv` (mới, public): giới thiệu + form ứng tuyển (bắt buộc có tài khoản).
- `/proofs`, `/faq`, `/about`, `/tutorial`, legal: giữ, sửa copy sang đa game + luồng thanh toán thật; proofs/reviews chuyển dần sang DB.

### Khu làm việc `/work` (admin + CTV đã duyệt; RequireStaff + RLS)
- `/work` — dashboard: admin thấy hàng đợi xác nhận thanh toán + đơn chờ giao + thống kê; CTV thấy "Đơn của tôi" (mới giao viền gold).
- `/work/orders`, `/work/orders/:id` — workview 2 cột: thông tin khách + option dịch vụ + điều khiển trạng thái (CTV: hoàn thành/cần hỗ trợ; admin: mọi quyền + giao đơn) | chat đơn bên phải. Hoàn thành **bắt buộc upload ảnh bằng chứng**.
- `/work/payments` (admin) — hàng đợi đối chiếu chuyển khoản theo mã đơn, nút xác nhận.
- `/work/catalog`, `/work/catalog/product/:id|new` (admin) — CRUD danh mục + sản phẩm, upload ảnh, service-option builder.
- `/work/ctv` (admin) — duyệt đơn ứng tuyển (approve = flip role), danh sách CTV + số đơn hoàn thành.
- `/work/chat` — chat nội bộ: kênh `# Chung` + DM admin↔CTV.
- `/work/settings` (admin) — STK bank, Momo, ảnh QR, tên shop.
- Thông báo in-app: bảng `notifications` + Realtime + badge sidebar (đơn mới, được giao đơn, tin nhắn, ứng viên mới).

---

## 4. Kiến trúc code

- Thêm `@supabase/supabase-js` + **TanStack Query v5** (app sắp có ~30 hàm đọc/ghi async — cache/invalidate/loading thống nhất).
- `src/lib/supabase.ts` singleton; thiếu env → màn hình hướng dẫn tiếng Việt thay vì crash.
- `src/lib/api.ts` giữ vai trò seam: thay ruột thành query Supabase, **mọi hàm thành async** (refactor lớn nhất: các component đọc sync phải chuyển sang useQuery + skeleton có sẵn).
- cartStore giữ client-side; authStore → phiên Supabase Auth + profile/role; ordersStore bỏ (server là nguồn sự thật). Guards: `RequireAuth`, `RequireRole`.
- Đăng nhập điều hướng theo role: admin/ctv → `/work`, khách → `/dashboard`.

## 5. Setup cho chủ shop (10 bước copy-paste, có file SETUP.md tiếng Việt)

Tạo tài khoản supabase.com (miễn phí, không cần thẻ) → New project → chạy `supabase/01-schema.sql` trong SQL Editor → (tùy chọn) `02-seed.sql` → **tắt Confirm email** (giới hạn 2 email/giờ của gói free) → copy Project URL + anon key → dán vào `.env.local` → chạy `start.bat` → đăng ký tài khoản đầu tiên → chạy `03-make-admin.sql` (nâng email của bạn lên admin) → test tạo danh mục/sản phẩm.

**Giới hạn gói free đáng nhớ:** DB 500MB (thoải mái nhiều năm), Storage 1GB (nén ảnh ~200KB → ~4–5k ảnh), **project tự tạm dừng nếu 7 ngày không ai truy cập** (mở web ≥1 lần/tuần, hoặc nâng cấp khi kinh doanh thật), không có backup tự động (xuất dữ liệu định kỳ).

## 6. MVP / Stretch / Ngoài phạm vi

**MVP:** toàn bộ mục 2–3 ở trên (schema+RLS+RPC, auth 3 role, CRUD catalog + settings, storefront DB, checkout thủ công, vòng đời đơn, /work đầy đủ, chat đơn + chat nội bộ realtime, tuyển CTV, tracking khách, notifications badge).
**Stretch:** webhook Discord, khách gửi review sau đơn hoàn thành, USD toggle, cổng PayOS/Casso tự đối chiếu, deploy Vercel + domain, ảnh đính kèm chat, proofs từ đơn thật, thống kê CTV.
**Ngoài phạm vi:** bot giao hàng tự động, escrow/hoàn tiền tự động, CTV tự nhận đơn, sổ hoa hồng CTV, guest checkout, đa ngôn ngữ, SSR, coupon/wishlist, push notification, email marketing.

## 7. Lộ trình build (giống mô hình v1 đã chạy tốt)

- **Phase 1 — Nền móng (1 agent, chặn các phase sau):** migration SQL đầy đủ + RLS + RPC + **script smoke-test RLS 4 vai trò** (rủi ro cao nhất, phải chứng minh trước), supabase client, types, api.ts async, auth+guards, App.tsx route map v2 (stub), SETUP.md + sửa start.bat.
- **Phase 2 — 4 agent song song:** (2A) storefront DB + checkout + tracking khách; (2B) catalog CRUD + settings + duyệt CTV; (2C) khu `/work` orders + payments + realtime queue; (2D) hạ tầng chat (OrderChatPanel dùng chung) + `/work/chat` + `/messages` + trang `/ctv`.
- **Phase 3 — Tích hợp + verify (1 agent):** nối chat vào 2 phía, navbar theo role, E2E Playwright trên Supabase thật (admin tạo catalog → khách đặt → xác nhận → giao CTV → chat → hoàn thành), **negative test RLS trên trình duyệt** (khách vào /work, CTV xem đơn người khác), dọn code demo chết, chốt SETUP.md.

## 8. Rủi ro & cảnh báo trung thực

- **RLS sai = lộ dữ liệu** (anon key là public theo thiết kế) → phase 1 có smoke-test bắt buộc + phase 3 test lại trên trình duyệt.
- **Không tin số tiền từ client** → mọi tính giá qua RPC server-side.
- Refactor sync→async là khối lượng lớn nhất, dễ ước lượng thiếu.
- **ToS:** bán skin CS2 lấy tiền thật ngoài Steam Market và dịch vụ cày thuê **vi phạm điều khoản của Valve** (tương tự Roblox trước đây) — rủi ro khóa tài khoản Steam liên quan; đây là gray market phổ biến nhưng bạn cần biết rõ trước khi vận hành thật.
- Review/proof mẫu phải thay bằng dữ liệu thật khi kinh doanh thật (tránh quảng cáo gian dối).
