# HƯỚNG DẪN KẾT NỐI UNIEMARKET VỚI SUPABASE

Uniemarket cần một "cơ sở dữ liệu" để lưu tài khoản, sản phẩm, đơn hàng và tin
nhắn. Chúng ta dùng **Supabase** — dịch vụ miễn phí, **không cần thẻ ngân
hàng**, đăng ký chỉ mất vài phút.

Làm đúng theo 10 bước dưới đây, mỗi bước chỉ là bấm chuột và copy–paste.
Tổng thời gian: **khoảng 10–15 phút**.

---

## Bước 1 — Tạo tài khoản Supabase

1. Mở trình duyệt, vào địa chỉ: **https://supabase.com**
2. Bấm nút **Start your project** (hoặc **Sign in** nếu đã có tài khoản).
3. Đăng ký bằng tài khoản GitHub hoặc email. Hoàn toàn miễn phí, không hỏi thẻ.

## Bước 2 — Tạo project mới

1. Sau khi đăng nhập, bấm **New project**.
2. Đặt tên project: `uniemarket` (tên gì cũng được).
3. Ở ô **Database Password**: bấm **Generate a password** rồi **lưu lại mật
   khẩu này** vào chỗ an toàn (hiếm khi cần, nhưng đừng làm mất).
4. **Region**: chọn **Southeast Asia (Singapore)** cho nhanh với người dùng ở
   Việt Nam.
5. Bấm **Create new project** và đợi 1–2 phút cho project khởi tạo xong.

## Bước 3 — Chạy file tạo cơ sở dữ liệu (01-schema.sql)

1. Ở menu bên trái của Supabase, bấm biểu tượng **SQL Editor**.
2. Bấm **New query**.
3. Mở thư mục dự án trên máy bạn → thư mục `supabase` → mở file
   **`01-schema.sql`** bằng Notepad → bấm Ctrl+A (chọn hết) → Ctrl+C (copy).
4. Quay lại trình duyệt, dán (Ctrl+V) vào ô soạn thảo → bấm **Run** (góc dưới
   phải, hoặc phím Ctrl+Enter).
5. Đợi vài giây. Thấy chữ **Success** là xong. (File này chỉ chạy 1 lần duy
   nhất — đừng chạy lại lần 2.)

## Bước 4 — (Tùy chọn) Nạp dữ liệu mẫu (02-seed.sql)

Nếu muốn web có sẵn 8 danh mục game + 40 sản phẩm mẫu (từ bản demo cũ, giá đã
đổi sang VNĐ) để nhìn cho "có hàng":

1. Vẫn trong **SQL Editor**, bấm **New query**.
2. Copy toàn bộ nội dung file **`supabase/02-seed.sql`** → dán → **Run**.

Bạn hoàn toàn có thể bỏ qua bước này và tự tạo danh mục/sản phẩm sau trong
trang quản trị.

## Bước 5 — Tắt "Confirm email"

Gói miễn phí của Supabase chỉ gửi được 2 email/giờ, nên ta tắt bước xác nhận
email để đăng ký tài khoản không bị kẹt:

1. Menu trái → **Authentication** → **Sign In / Providers** (hoặc
   **Providers**).
2. Bấm vào **Email**.
3. TẮT công tắc **Confirm email** → bấm **Save**.

## Bước 6 — Lấy 2 chìa khóa kết nối

1. Menu trái → biểu tượng bánh răng **Project Settings** → **API** (hoặc **API
   Keys** / **Data API** tùy phiên bản giao diện).
2. Bạn cần copy 2 thứ:
   - **Project URL** — dạng `https://abcxyz.supabase.co`
   - **anon / public key** — một chuỗi ký tự rất dài
3. Cứ để tab này mở, sang bước 7.

## Bước 7 — Dán chìa khóa vào file .env.local

1. Mở thư mục dự án Uniemarket trên máy.
2. Tìm file **`.env.example`** → copy nó → đổi tên bản copy thành **`.env.local`**
   (đúng y như vậy, có dấu chấm ở đầu).
3. Mở `.env.local` bằng Notepad và điền 2 dòng (dán giá trị ngay sau dấu `=`,
   không có dấu cách, không có ngoặc kép):

   ```
   VITE_SUPABASE_URL=https://abcxyz.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   ```

4. Lưu file (Ctrl+S).

> Yên tâm: anon key là khóa **công khai**, thiết kế để nằm trong web. Dữ liệu
> được bảo vệ bởi các luật bảo mật đã cài ở Bước 3, không phải bằng cách giấu
> key.

## Bước 8 — Khởi động web

1. Chạy file **`start.bat`** trong thư mục dự án (nháy đúp).
2. Nếu web đang chạy từ trước thì tắt cửa sổ đen đi và chạy lại `start.bat`
   (cần khởi động lại để web đọc file `.env.local` mới).
3. Trình duyệt tự mở `http://localhost:5173`.

## Bước 9 — Đăng ký tài khoản đầu tiên và tự phong admin

1. Trên web, bấm **Đăng nhập** → **Đăng ký ngay** → tạo tài khoản bằng email
   của bạn (ví dụ `miding471@gmail.com`).
2. Quay lại Supabase → **SQL Editor** → **New query**.
3. Copy toàn bộ file **`supabase/03-make-admin.sql`** → dán → **Run**.
   (File này nâng đúng email của bạn lên quyền admin. Nếu bạn đăng ký bằng
   email khác, mở file bằng Notepad và sửa email trước khi chạy.)
4. Kết quả phải hiện 1 dòng có chữ **admin** — vậy là bạn đã là chủ shop.

## Bước 10 — Kiểm tra khu làm việc

1. Quay lại web, **đăng xuất rồi đăng nhập lại** (để web nhận vai trò mới).
2. Vào địa chỉ `http://localhost:5173/work` — bạn phải thấy **khu làm việc**
   với menu: Bảng làm việc, Đơn hàng, Xác nhận thanh toán, Danh mục & sản
   phẩm, CTV, Chat nội bộ, Cài đặt.
3. Ai không phải admin/CTV vào đây sẽ thấy "Không có quyền truy cập" — đúng
   như thiết kế.

🎉 **Xong!** Web của bạn đã kết nối cơ sở dữ liệu thật.

---

## Những điều cần nhớ về gói miễn phí của Supabase

- ⚠️ **Project tự "ngủ đông" nếu 7 ngày không ai truy cập.** Mở web ít nhất
  1 lần mỗi tuần, hoặc vào Dashboard Supabase bấm **Restore** khi bị tạm dừng.
  Khi kinh doanh thật nghiêm túc, cân nhắc nâng cấp gói trả phí (~$25/tháng)
  để không bao giờ bị dừng.
- ⚠️ **Không có sao lưu tự động.** Thỉnh thoảng vào **Database → Backups**
  hoặc dùng **Table Editor → Export CSV** để tải dữ liệu quan trọng (đơn hàng,
  khách) về máy.
- Dung lượng miễn phí: **500MB database** (nhiều năm mới đầy với shop nhỏ) và
  **1GB ảnh** (nén ảnh sản phẩm ~200KB thì chứa được ~4–5 nghìn ảnh).
- Gói miễn phí chỉ gửi **2 email/giờ** — vì vậy ta đã tắt Confirm email ở
  Bước 5.

## Khi có sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| Web báo "Chưa kết nối cơ sở dữ liệu" | Kiểm tra `.env.local` (Bước 7) rồi chạy lại `start.bat` |
| Đăng ký báo lỗi email | Kiểm tra đã tắt Confirm email (Bước 5) |
| Vào /work bị "Không có quyền truy cập" | Chạy lại Bước 9 (03-make-admin.sql) rồi đăng xuất/đăng nhập lại |
| Web chậm bất thường sau vài ngày không dùng | Project đang ngủ đông — vào Dashboard Supabase bấm Restore |

Kiểm tra bảo mật nâng cao (không bắt buộc): mở cửa sổ dòng lệnh trong thư mục
dự án và chạy `node supabase/rls-smoke-test.mjs` — tất cả các dòng phải là
**PASS**.
