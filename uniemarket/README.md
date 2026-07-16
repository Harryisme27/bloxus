# Uniemarket — Bản demo cửa hàng vật phẩm Roblox

Đây là một website **demo** (bản mẫu để xem trước) cho một cửa hàng bán vật phẩm trong
game Roblox (thú cưng Adopt Me, dao MM2, trái ác quỷ Blox Fruits, v.v...). Toàn bộ dữ liệu
(sản phẩm, đơn hàng, tài khoản...) đều là dữ liệu giả, được lưu ngay trên trình duyệt của
bạn (localStorage) — **không có máy chủ, không có thanh toán thật, không có kết nối
Roblox thật**.

## 1. Cách khởi động (không cần biết lập trình)

1. Mở thư mục `uniemarket` này.
2. Nháy đúp (double-click) vào file **`start.bat`**.
3. Một cửa sổ đen (command prompt) sẽ hiện ra. Lần đầu tiên chạy, máy sẽ tự tải các thư
   viện cần thiết — quá trình này có thể mất **2–5 phút** tuỳ tốc độ mạng. Các lần chạy
   sau sẽ nhanh hơn nhiều (chỉ vài giây).
4. Trình duyệt sẽ tự mở tại địa chỉ `http://localhost:5173`. Nếu không tự mở, hãy tự gõ
   địa chỉ đó vào trình duyệt (Chrome, Edge, Cờ-rôm...).
5. Muốn tắt demo: quay lại cửa sổ đen và đóng nó lại (hoặc bấm phím bất kỳ sau khi đóng
   trình duyệt).

> Yêu cầu: máy đã cài sẵn **Node.js** (tải miễn phí tại https://nodejs.org — bản
> "LTS" là ổn định nhất). Nếu chưa có, `start.bat` sẽ báo lỗi và nhắc bạn cài trước.

## 2. Bản demo này hoạt động như thế nào?

- Đây là một trang web hiển thị **giao diện đầy đủ** của một cửa hàng vật phẩm Roblox:
  trang chủ, danh mục game, chi tiết vật phẩm, giỏ hàng, thanh toán, lịch sử đơn hàng,
  trang "đã giao hàng thành công", trang FAQ, trang liên hệ, khu vực quản trị (admin)...
- Tất cả sản phẩm, game, đánh giá của khách, và "bằng chứng đã giao hàng" (proofs) đều là
  **dữ liệu mẫu** được viết sẵn trong mã nguồn (thư mục `src/data/`).
- Khi bạn "đăng nhập", "thêm vào giỏ", hay "đặt hàng", dữ liệu chỉ được lưu trong trình
  duyệt của bạn (localStorage) — **tắt trình duyệt hoặc bấm "Reset demo" là mất hết**,
  không ảnh hưởng đến ai khác và không gửi đi bất cứ đâu.
- Có sẵn một tài khoản demo để đăng nhập thử, xem file `src/data/demoAccount.ts` để biết
  email/mật khẩu (gợi ý cũng hiện ngay trên trang đăng nhập).

### ⚠️ ĐÂY LÀ DEMO — KHÔNG CÓ THANH TOÁN THẬT

Nút "Thanh toán" trong demo **không** kết nối tới bất kỳ cổng thanh toán, ngân hàng, hay
ví điện tử thật nào. Nó chỉ mô phỏng lại luồng mua hàng (thành công / thất bại / huỷ) để
bạn xem giao diện. Không có tiền thật, vật phẩm thật, hay tài khoản Roblox thật nào bị
ảnh hưởng khi dùng trang này.

## 3. Muốn đổi giá tiền hoặc thêm/sửa vật phẩm?

Mở thư mục `src/data/` bằng bất kỳ trình soạn thảo văn bản nào (Notepad, VS Code...):

- `games.ts` — danh sách các game (Adopt Me, MM2, Blox Fruits...).
- `items.ts` — danh sách vật phẩm, giá tiền (`priceUSD`), độ hiếm (`rarity`), tồn kho...
- `reviews.ts`, `proofs.ts` — đánh giá khách hàng và "bằng chứng đã giao" hiển thị trên trang.
- `demoAccount.ts` — tài khoản demo dùng để đăng nhập thử.

Mỗi file đều có chú thích tiếng Việt ngay trong mã nguồn, giải thích chủ shop có thể sửa
chỗ nào. Sửa xong, lưu file lại rồi chạy `start.bat` lại (hoặc refresh trang nếu demo đang
chạy) để thấy thay đổi.

## 4. Muốn đổi từ USD sang VNĐ?

Mặc định demo hiển thị giá bằng **USD** (đô la Mỹ). Nếu muốn đổi sang VNĐ, mở file
`src/lib/format.ts` — trong đó có chú thích hướng dẫn ngay cách đổi `currency: 'USD'`
thành `currency: 'VND'` và đổi locale `'en-US'` thành `'vi-VN'`.

## 5. Lưu ý về OneDrive

Nếu thấy thư mục dự án này đang nằm trong OneDrive (ví dụ
`C:\Users\...\OneDrive\Documents\...`), quá trình cài đặt/chạy đôi khi sẽ **chậm hơn** hoặc
gặp lỗi khoá file (vì OneDrive liên tục đồng bộ). Nếu gặp lỗi khi chạy `start.bat`, hãy thử:

1. Tạm dừng đồng bộ OneDrive (chuột phải vào icon OneDrive ở khay hệ thống → Pause syncing).
2. Hoặc tốt hơn: **copy toàn bộ thư mục `uniemarket` ra ngoài OneDrive**, ví dụ chuyển tới
   `C:\Uniemarket`, rồi chạy `start.bat` từ đó.

## 6. Muốn "reset" lại demo (xoá giỏ hàng, đơn hàng, tài khoản đã tạo)?

Cách 1 (trong trang web): kéo xuống cuối trang (Footer), bấm nút **"Reset demo"** — nó sẽ
xoá toàn bộ dữ liệu demo đã lưu trên trình duyệt (giỏ hàng, đơn hàng, tài khoản đăng nhập)
và tải lại trang như lúc mới mở lần đầu.

Cách 2 (thủ công): mở Developer Tools của trình duyệt (phím `F12`) → tab *Application*
(hoặc *Storage*) → *Local Storage* → xoá các mục bắt đầu bằng `uniemarket-`.

---

**Ghi chú kỹ thuật (dành cho lập trình viên):** dự án dùng Vite + React + TypeScript +
Tailwind CSS, dữ liệu 100% cục bộ (không gọi API, không backend). Chạy `npm run build`
để build bản production vào thư mục `dist/`.
