# Bật đăng nhập Google + Discord & email quên mật khẩu

Code web đã xong: nút Google/Discord ở trang Đăng nhập + Đăng ký (bấm là chuyển
sang trang OAuth, quay về tự có tài khoản — username lấy từ email, đổi được sau
trong hồ sơ). Còn lại là cấu hình 3 dashboard bên ngoài, làm 1 lần.

## 0. URL Configuration trong Supabase (làm trước tiên)

Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: `http://localhost:5173` (khi lên miền thật thì đổi thành `https://tenmien.com`)
- **Redirect URLs** thêm cả hai:
  - `http://localhost:5173/**`
  - `https://tenmien.com/**` (khi có miền)

> Thiếu bước này thì OAuth quay về sai chỗ và link reset mật khẩu bị chặn.

## 1. Google

1. Vào https://console.cloud.google.com → tạo project (tên gì cũng được).
2. **APIs & Services → OAuth consent screen**: chọn External → điền tên app +
   email → Save (không cần verify khi chỉ đăng nhập cơ bản).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized redirect URIs** thêm đúng 1 dòng:
     `https://xikeydfwdavqttagrtsj.supabase.co/auth/v1/callback`
4. Copy **Client ID** + **Client secret**.
5. Supabase Dashboard → **Authentication → Sign In / Providers → Google**:
   bật **Enable**, dán Client ID + Secret → Save.

## 2. Discord

1. Vào https://discord.com/developers/applications → **New Application**.
2. Tab **OAuth2**: copy **Client ID** và **Client Secret** (Reset Secret nếu chưa thấy).
3. Cũng trong OAuth2 → **Redirects** → Add:
   `https://xikeydfwdavqttagrtsj.supabase.co/auth/v1/callback`
4. Supabase Dashboard → **Authentication → Sign In / Providers → Discord**:
   bật **Enable**, dán Client ID + Secret → Save.

## 3. Email quên mật khẩu

Luồng đã có sẵn trong web: `/forgot-password` nhập email → Supabase gửi link →
bấm link về `/reset-password` đặt mật khẩu mới.

Cần biết:

- **Mặc định** Supabase gửi bằng SMTP nội bộ: giới hạn ~2 email/giờ, hay vào
  Spam — chỉ đủ để thử. **Lên production phải gắn SMTP riêng**:
  Authentication → **Emails → SMTP Settings** → bật Custom SMTP. Gợi ý miễn phí:
  đăng ký https://resend.com (3.000 email/tháng free) → lấy SMTP host/user/pass
  dán vào. Xong thì email đi tức thì, đến inbox tử tế.
- Sửa nội dung email (tiếng Việt): Authentication → **Emails → Templates** →
  "Reset Password". Trong template, `{{ .ConfirmationURL }}` là link đặt lại;
  muốn hiện thêm mã 6 số thì chèn `{{ .Token }}`.
- Đổi tên người gửi: trong SMTP Settings (Sender name / Sender email).

## 4. Thử

- Google: `/login` → bấm Google → chọn tài khoản → quay về web đã đăng nhập,
  avatar/username tự tạo từ email.
- Discord: tương tự.
- Quên mật khẩu: `/forgot-password` → nhập email → check hộp thư (cả Spam) →
  bấm link → đặt mật khẩu mới → đăng nhập lại.
