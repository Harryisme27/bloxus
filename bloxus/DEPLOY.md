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

### 5.4. Chuyển tiếp miền cũ `unie.store` sang miền mới

`unie.store` đang chạy và đã có khách (vài nghìn lượt truy cập). **Đừng xoá nó.**
Người cũ còn lưu bookmark, còn link trong Discord, còn kết quả Google. Cách đúng là
cho `unie.store` **chuyển hướng 301** sang `bloxus.store` — khách vào link cũ vẫn tới
được web, và Google dần chuyển uy tín SEO sang miền mới.

Cloudflare Dashboard → chọn miền **`unie.store`** → **Rules** → **Redirect Rules** →
**Create rule**:

| Ô | Điền |
|---|---|
| Rule name | `unie.store -> bloxus.store` |
| If — Custom filter expression | Field `Hostname`, Operator `contains`, Value `unie.store` |
| Then — Type | **Dynamic** |
| Expression | `concat("https://bloxus.store", http.request.uri.path)` |
| Status code | **301** |
| Preserve query string | **Bật** |

Giữ `unie.store` ở lại trong **Custom domains** của Pages thì cũng được, nhưng redirect
rule chạy trước nên khách sẽ luôn bị đẩy sang miền mới.

> Giữ redirect này **ít nhất 6–12 tháng**, và nhớ gia hạn miền `unie.store` trong thời
> gian đó. Xoá sớm là mất luôn lượng khách cũ.

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

## 9. ✅ Việc phải làm khi lên miền `bloxus.store`

Ngoài Cloudflare, có 4 dịch vụ bên ngoài vẫn đang trỏ về `localhost` hoặc tên cũ.
Thiếu bước nào thì phần đó hỏng, nên làm đủ cả 5 dòng dưới.

| # | Ở đâu | Đổi cái gì | Không làm thì sao |
|---|---|---|---|
| 1 | Cloudflare Pages → Settings → Build | **Root directory**: `uniemarket` → `bloxus` | Build lỗi ngay, không deploy được |
| 2 | Supabase → Authentication → URL Configuration | **Site URL** = `https://bloxus.store`; **Redirect URLs** giữ cả `https://bloxus.store/**`, `https://unie.store/**` và `http://localhost:5173/**` | Đăng nhập Google/Discord quay về sai chỗ, link đặt lại mật khẩu bị chặn |
| 3 | Cloudflare → Turnstile → widget của bạn | Thêm `bloxus.store` vào **Domains** (giữ nguyên `unie.store` và `localhost`) | Captcha ở trang đăng nhập/đăng ký không hiện, không đăng nhập được |
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
