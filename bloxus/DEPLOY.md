# Deploy Bloxus lên Cloudflare Pages (miền riêng + chống DDoS mạnh nhất)

Web này là **SPA tĩnh** (Vite build → thư mục `dist/`), backend nằm ở **Supabase** cloud.
→ Không cần VPS. Host bằng **Cloudflare Pages**: miễn phí, CDN toàn cầu, HTTPS + chống DDoS tự động.

> **Hiểu đúng về chống DDoS:** Cloudflare bảo vệ **trang web** (miền của bạn). Trình duyệt gọi
> **thẳng** tới Supabase (`xikeydfwdavqttagrtsj.supabase.co`) — phần này do **Supabase** tự lo hạ tầng +
> rate limit, và **RLS** là lớp chặn truy cập thật. Xem mục 6 để bọc thêm cho Supabase.

---

## 0. Bạn đang ở tình huống nào?

**Đã deploy `unie.store` rồi, giờ chỉ đổi tên + đổi miền** → bỏ qua mục 1 và 2
(project Pages đã có sẵn). Làm theo đúng thứ tự này:

1. **Mục 9, dòng 1** — đổi **Root directory** của Pages từ `uniemarket` sang `bloxus`.
   *Làm việc này TRƯỚC KHI `git push`*, vì thư mục dự án đã đổi tên; không đổi thì build lỗi.
2. **Mục 5.1** — đưa `bloxus.store` vào Cloudflare, đổi nameserver ở GoDaddy, chờ Active.
3. **Mục 5.2 → 5.3** — gắn `bloxus.store` vào Pages, bật HTTPS.
4. **Mục 9, dòng 2–5** — Supabase Site URL, Turnstile, Stripe, chạy file SQL đổi tên.
5. `git push` — Pages tự build lại. Kiểm tra theo mục 8.
6. **Mục 5.4** — chỉ khi `bloxus.store` đã chạy ngon mới gỡ `unie.store`.

**Deploy lần đầu, chưa có gì** → làm tuần tự từ mục 1.

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

## 5. Gắn miền riêng `bloxus.store`

**Tình trạng hiện tại:** miền `bloxus.store` đang dùng nameserver của **GoDaddy**
(`ns47.domaincontrol.com`, `ns48.domaincontrol.com`). Phải chuyển nameserver sang
Cloudflare trước, vì 2 lý do:

- GoDaddy **không** cho trỏ CNAME ở tên miền gốc (apex `bloxus.store`), nên không gắn
  thẳng vào Pages được — chỉ `www.` mới trỏ được.
- Toàn bộ lớp bảo vệ ở mục 6 (WAF, rate limit, Bot Fight, Under Attack Mode) **chỉ hoạt
  động khi miền nằm trong Cloudflare**.

### 5.1. Đưa `bloxus.store` vào Cloudflare (một lần, ~10 phút + chờ)

1. Cloudflare Dashboard → **Add a site** → nhập `bloxus.store` → chọn gói **Free**.
2. Cloudflare quét DNS hiện có → bấm **Continue**. Nếu miền mới mua chưa có bản ghi gì
   thì danh sách rỗng cũng không sao.
3. Cloudflare hiện **2 nameserver** dạng `xxx.ns.cloudflare.com`. Chép lại cả hai.
4. Sang GoDaddy → **My Products** → `bloxus.store` → **DNS** → mục **Nameservers** →
   **Change** → chọn **I'll use my own nameservers** → xoá 2 dòng `domaincontrol.com`,
   dán 2 nameserver Cloudflare vào → **Save**.
5. Quay lại Cloudflare bấm **Check nameservers now**. Thường active sau **5 phút–2 giờ**
   (GoDaddy khá nhanh), chậm nhất là 24 giờ. Cloudflare gửi email khi xong.

> ⚠️ Trong lúc chờ, đừng đổi nameserver lần nữa — mỗi lần đổi là đếm lại từ đầu.

### 5.2. Gắn miền vào Pages

Khi miền đã **Active** trong Cloudflare:

Pages → project → **Custom domains** → **Set up a custom domain** → nhập `bloxus.store`
→ **Activate domain**. Làm thêm lần nữa cho `www.bloxus.store`.

Cloudflare tự tạo bản ghi DNS, không phải gõ tay. HTTPS cấp **tự động** sau vài phút.

### 5.3. Bắt buộc dùng HTTPS

SSL/TLS → **Overview**: chọn **Full (strict)**.
SSL/TLS → **Edge Certificates**: bật **Always Use HTTPS**.

### 5.4. Gỡ miền cũ `unie.store`

**Thứ tự cực kỳ quan trọng: chỉ gỡ `unie.store` SAU KHI `bloxus.store` đã chạy được.**

Sau khi đổi nameserver ở GoDaddy, `bloxus.store` mất **vài phút đến vài giờ** mới hoạt
động. Nếu gỡ `unie.store` ngay từ đầu thì web **không có miền nào chạy** trong suốt
khoảng thời gian đó.

**Bước 1 — Để `unie.store` chạy bình thường**, làm hết mục 5.1 → 5.3 cho `bloxus.store`.

**Bước 2 — Kiểm tra `bloxus.store` thật sự chạy:**

- Mở `https://bloxus.store` → web hiện lên, khoá HTTPS xanh.
- Đăng nhập thử một tài khoản → vào được.
- Vào `/orders`, bấm F5 → không bị 404.

**Bước 3 — Khi cả 3 mục trên đều đạt, mới gỡ miền cũ:**

Pages → project → **Custom domains** → dòng `unie.store` → **…** → **Remove domain**.
Làm tương tự cho `www.unie.store` nếu có.

**Bước 4 — Xử lý nốt zone `unie.store` trong Cloudflare.** Chọn một trong hai:

- **Giữ lại và chuyển hướng** (nên làm, tốn 0 đồng ngoài phí gia hạn miền): Rules →
  Redirect Rules → Create rule → If `Hostname contains unie.store` → Then **Dynamic**,
  `concat("https://bloxus.store", http.request.uri.path)`, status **301**, bật Preserve
  query string. Khách cũ vẫn tới được web mới.
- **Xoá hẳn**: Cloudflare → miền `unie.store` → cuối trang Overview → **Remove site from
  Cloudflare**, rồi để miền hết hạn. Khách cũ sẽ gặp trang lỗi.

> Nếu chọn xoá hẳn, nhớ báo khách trong Discord và ghim tin nhắn địa chỉ mới trước
> khi gỡ, để họ không tưởng shop đã đóng cửa.

### 5.5. Cho `www` chuyển hướng về miền gốc (tuỳ chọn, nên làm)

Rules → **Redirect Rules** → **Create rule**:

- If: `Hostname equals www.bloxus.store`
- Then: **Dynamic redirect** → `concat("https://bloxus.store", http.request.uri.path)`
  → Status **301**, bật **Preserve query string**.

Như vậy web chỉ có **một** địa chỉ chính thức, tốt cho SEO.

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
  - Application domain: `bloxus.store/work`
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
Mua add-on **Supabase Custom Domain** (~$10/tháng) → trỏ `api.bloxus.store` (CNAME, bật proxy 🟠 Cloudflare)
tới Supabase → khi đó **cả traffic API** cũng qua WAF/DDoS của Cloudflare. Đây là mức bảo vệ tối đa.
(Đổi `VITE_SUPABASE_URL` sang `https://api.bloxus.store` + cập nhật CSP trong `_headers`.)

---

## 8. Kiểm tra sau khi deploy

- [ ] Mở `https://bloxus.store` → web load, đăng nhập được.
- [ ] F5 tại `/work/orders/<id>` → không 404 (nhờ `_redirects`).
- [ ] DevTools → Console: không có lỗi CSP đỏ. (Nếu có, xem host bị chặn rồi thêm vào `connect-src`/`img-src` trong `_headers`.)
- [ ] DevTools → Network → click 1 request → Response Headers có `content-security-policy`, `x-frame-options`.
- [ ] Cloudflare → **Security** → **Events**: theo dõi request bị chặn/challenge.

---

## 9. ✅ Việc phải làm khi lên miền `bloxus.store`

Ngoài Cloudflare, có 4 dịch vụ bên ngoài vẫn đang trỏ về `localhost` hoặc tên cũ.
Thiếu bước nào thì phần đó hỏng, nên làm đủ cả 5 dòng dưới.

| # | Ở đâu | Đổi cái gì | Không làm thì sao |
|---|---|---|---|
| 1 | Cloudflare Pages → Settings → Build | **Root directory**: `uniemarket` → `bloxus` | Build lỗi ngay, không deploy được |
| 2 | Supabase → Authentication → URL Configuration | **Site URL** = `https://bloxus.store`; **Redirect URLs** để `https://bloxus.store/**` và `http://localhost:5173/**` (giữ `https://unie.store/**` cho tới khi gỡ xong miền cũ) | Đăng nhập Google/Discord quay về sai chỗ, link đặt lại mật khẩu bị chặn |
| 3 | Cloudflare → Turnstile → widget của bạn | Thêm `bloxus.store` vào **Domains** (bỏ `unie.store` sau khi gỡ xong, giữ `localhost`) | Captcha ở trang đăng nhập/đăng ký không hiện, không đăng nhập được |
| 4 | Máy bạn, chạy `supabase secrets set` | `SITE_URL=https://bloxus.store` | Trả tiền Stripe xong không quay về được web |
| 5 | Supabase → SQL Editor | Chạy `supabase/39-rebrand-bloxus.sql` | Web hiện Bloxus nhưng thông báo và minh chứng vẫn ghi tên cũ |

Lệnh cho dòng 4:

```bash
cd bloxus
supabase secrets set SITE_URL=https://bloxus.store
supabase functions deploy create-checkout-session
```

**Google và Discord OAuth không cần đổi gì.** Redirect URI của chúng trỏ tới
`https://xikeydfwdavqttagrtsj.supabase.co/auth/v1/callback`, không dính tới miền web.

**Stripe webhook cũng không cần đổi.** Nó gọi vào Supabase Functions, không gọi vào miền web.

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


---
