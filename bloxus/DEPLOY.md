# Deploy Bloxus lên Cloudflare Pages (miền riêng + chống DDoS mạnh nhất)

Web này là **SPA tĩnh** (Vite build → thư mục `dist/`), backend nằm ở **Supabase** cloud.
→ Không cần VPS. Host bằng **Cloudflare Pages**: miễn phí, CDN toàn cầu, HTTPS + chống DDoS tự động.

> **Hiểu đúng về chống DDoS:** Cloudflare bảo vệ **trang web** (miền của bạn). Trình duyệt gọi
> **thẳng** tới Supabase (`xikeydfwdavqttagrtsj.supabase.co`) — phần này do **Supabase** tự lo hạ tầng +
> rate limit, và **RLS** là lớp chặn truy cập thật. Xem mục 6 để bọc thêm cho Supabase.

---

## 1. Chuẩn bị repo GitHub

Cloudflare Pages build trực tiếp từ GitHub (mỗi lần `git push` là tự deploy).

1. Tạo 1 repo trên GitHub (private cũng được).
2. Push code lên (thư mục gốc chứa `bloxus/`).
3. Đảm bảo **KHÔNG** commit `bloxus/.env.local` (đã nằm trong `.gitignore` — khóa nằm trong biến môi trường của Pages, không nằm trong repo).

---

## 2. Tạo project Cloudflare Pages

Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → chọn repo.

Cấu hình build:

| Mục | Giá trị |
|---|---|
| **Framework preset** | None (hoặc Vite) |
| **Root directory** | `bloxus` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Node version** | 20 (thêm biến `NODE_VERSION=20` ở mục 3 nếu build lỗi) |

Bấm **Save and Deploy**. Lần đầu build ~1–2 phút.

---

## 3. Biến môi trường (Environment variables)

Pages → project → **Settings** → **Environment variables** → thêm cho cả **Production** và **Preview**:

```
VITE_SUPABASE_URL       = https://xikeydfwdavqttagrtsj.supabase.co
VITE_SUPABASE_ANON_KEY  = <anon public key>
```

> ⚠️ CHỈ đưa **anon key** (khóa công khai, an toàn). **KHÔNG BAO GIỜ** đưa `SERVICE_KEY`/`sb_secret_...` lên đây.

Thêm biến xong bấm **Retry deployment** để build lại với biến mới.

---

## 4. SPA routing + security headers (đã kèm sẵn trong repo)

2 file đã có sẵn trong `bloxus/public/` (Vite tự copy vào `dist/`):

- **`_redirects`** — `/* /index.html 200`: mọi đường dẫn (`/checkout`, `/work/orders/…`) trả về `index.html`
  để react-router xử lý, không bị 404 khi F5.
- **`_headers`** — security headers + CSP (chỉ cho phép gọi Supabase) + cache asset.

Không cần làm gì thêm — chúng tự động áp khi deploy.

---

## 5. Gắn miền riêng

Pages → project → **Custom domains** → **Set up a custom domain** → nhập `tenmien.com` (và `www.tenmien.com`).

- Nếu miền đã dùng nameserver Cloudflare → nó **tự tạo bản ghi DNS** cho bạn, xong luôn.
- Nếu chưa: thêm site vào Cloudflare trước (Dashboard → **Add a site** → đổi nameserver ở nơi mua miền
  sang 2 nameserver Cloudflare cung cấp), rồi quay lại gắn domain.

HTTPS cấp **tự động** (vài phút). Bật **Always Use HTTPS** ở SSL/TLS → Edge Certificates.

---

## 6. 🛡️ Chống DDoS MẠNH NHẤT — cấu hình từng lớp

Cloudflare Pages **đã** cho bạn: không lộ IP gốc + chống DDoS L3/4/7 tự động (không giới hạn, mọi gói).
Bật thêm các lớp sau ở **Dashboard → chọn miền của bạn**:

### 6.1. Security cơ bản
- **Security** → **Settings**: Security Level = **High**.
- **SSL/TLS** → Overview: chế độ **Full (strict)**.
- **SSL/TLS** → Edge Certificates: bật **Always Use HTTPS** + **HTTP Strict Transport Security (HSTS)**.

### 6.2. Chặn bot
- **Security** → **Bots**: bật **Bot Fight Mode** (miễn phí) — chặn bot tự động.
  (Gói Pro: **Super Bot Fight Mode** mạnh hơn.)

### 6.3. WAF + Rate limiting
- **Security** → **WAF** → **Managed rules**: bật **Cloudflare Managed Ruleset** (chặn tấn công phổ biến).
- **Security** → **WAF** → **Rate limiting rules** → tạo 1 rule (gói free có 1 rule):
  - **If** incoming requests match: `(http.request.uri.path contains "/")`  (tức mọi request)
  - **When rate exceeds**: ví dụ **50 requests / 10 giây** mỗi IP
  - **Then**: **Managed Challenge** (hoặc Block)
  → 1 IP spam quá nhanh sẽ bị đố CAPTCHA / chặn.
- (Tùy chọn) **WAF** → **Custom rules**: chặn theo quốc gia/ASN nếu bạn chỉ bán ở vài nước.

### 6.4. Nút khẩn cấp khi ĐANG bị tấn công
- **Security** → **Settings** → **Security Level** = **I'm Under Attack** (Under Attack Mode).
  → Mọi khách phải qua trang kiểm tra JS ~5 giây trước khi vào. Bật khi bị tấn công, tắt khi yên.

### 6.5. Khóa khu admin bằng Cloudflare Access (rất khuyến nghị)
Bảo vệ `/work` (khu làm việc admin/CTV) để **người lạ còn không tải nổi trang đó**:
- **Zero Trust** (Cloudflare One) → **Access** → **Applications** → **Add an application** → **Self-hosted**
  - Application domain: `tenmien.com/work`
  - Policy: **Allow** → include **Emails** = danh sách email nhân viên của bạn
- → Vào `/work` phải xác thực email (OTP) trước, DDoS/bot không chạm tới được khu quản trị.

---

## 7. 🛡️ Bảo vệ Supabase (phần Cloudflare không đứng trước)

Vì trình duyệt gọi thẳng Supabase, hãy siết ở phía Supabase:

### 7.1. Bật CAPTCHA cho đăng nhập/đăng ký (quan trọng)
Supabase Dashboard → **Authentication** → **Settings** → **Bot and Abuse Protection** → bật **Enable Captcha**
→ chọn **Turnstile** (của Cloudflare, miễn phí) hoặc hCaptcha → dán site key + secret.
→ Chặn brute-force mật khẩu và spam tạo tài khoản. (Cần thêm widget Turnstile vào form login/register —
báo tôi nếu muốn tôi code phần này vào web.)

### 7.2. Những lớp đã có sẵn
- **RLS** (Row Level Security) — lớp chặn truy cập thật, đã bật trên mọi bảng.
- Supabase tự **rate limit** endpoint Auth + có hạ tầng chống DDoS riêng.

### 7.3. (Nâng cao, tùy chọn) Đưa cả API sau Cloudflare
Mua add-on **Supabase Custom Domain** (~$10/tháng) → trỏ `api.tenmien.com` (CNAME, bật proxy 🟠 Cloudflare)
tới Supabase → khi đó **cả traffic API** cũng qua WAF/DDoS của Cloudflare. Đây là mức bảo vệ tối đa.
(Đổi `VITE_SUPABASE_URL` sang `https://api.tenmien.com` + cập nhật CSP trong `_headers`.)

---

## 8. Kiểm tra sau khi deploy

- [ ] Mở `https://tenmien.com` → web load, đăng nhập được.
- [ ] F5 tại `/work/orders/<id>` → không 404 (nhờ `_redirects`).
- [ ] DevTools → Console: không có lỗi CSP đỏ. (Nếu có, xem host bị chặn rồi thêm vào `connect-src`/`img-src` trong `_headers`.)
- [ ] DevTools → Network → click 1 request → Response Headers có `content-security-policy`, `x-frame-options`.
- [ ] Cloudflare → **Security** → **Events**: theo dõi request bị chặn/challenge.

---

## Tóm tắt các lớp chống DDoS đang bật

| Lớp | Ở đâu | Tác dụng |
|---|---|---|
| Ẩn IP gốc + DDoS L3/4/7 | Cloudflare Pages (mặc định) | Không có server để đánh trực tiếp |
| Security High + Bot Fight | Security → Settings/Bots | Chặn bot & request đáng ngờ |
| WAF Managed + Rate limit | Security → WAF | Chặn tấn công + giới hạn tốc độ theo IP |
| Under Attack Mode | Security → Settings | Nút khẩn cấp: đố JS toàn bộ khách |
| Cloudflare Access | Zero Trust → Access | Người lạ không vào nổi `/work` |
| CAPTCHA Auth + RLS | Supabase | Chặn brute-force/spam tài khoản, khóa quyền dữ liệu |
