# Bật thanh toán thẻ qua Stripe

Code đã có sẵn 3 phần:

- `supabase/functions/create-checkout-session/` — tạo phiên Stripe Checkout cho đơn.
- `supabase/functions/stripe-webhook/` — nhận báo "đã trả tiền" từ Stripe, tự xác nhận đơn
  (kể cả giao ngay instant delivery nếu sản phẩm bật).
- `supabase/34-stripe-payments.sql` — hàm `system_confirm_payment` cho webhook.
- Trang đơn hàng: chọn cổng **Stripe (thẻ)** sẽ hiện nút "Thanh toán bằng thẻ (Stripe)".

## Các bước bật (làm 1 lần, ~15 phút)

### 1. Chạy SQL
Supabase Dashboard → **SQL Editor** → dán toàn bộ `supabase/34-stripe-payments.sql` → **Run**.

### 2. Cài Supabase CLI + login (trên máy bạn)
```bash
npm i -g supabase
supabase login                      # mở trình duyệt xác nhận
cd bloxus
supabase link --project-ref xikeydfwdavqttagrtsj
```

### 3. Đặt secrets (lấy key ở Stripe Dashboard → Developers → API keys)
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...   # thử bằng test key trước!
supabase secrets set SITE_URL=http://localhost:5173  # khi lên miền thật thì đổi
```
> ⚠️ KHÔNG bao giờ dán `sk_...` vào code / chat / biến VITE_.

### 4. Deploy 2 functions
```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook --no-verify-jwt
```
(`--no-verify-jwt` vì Stripe gọi ẩn danh — bảo mật bằng chữ ký webhook.)

### 5. Khai báo webhook với Stripe
Stripe Dashboard → **Developers → Webhooks → Add endpoint**:

- URL: `https://xikeydfwdavqttagrtsj.supabase.co/functions/v1/stripe-webhook`
- Events: `checkout.session.completed` và `checkout.session.async_payment_succeeded`
- Tạo xong copy **Signing secret** (`whsec_...`) rồi:
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase functions deploy stripe-webhook --no-verify-jwt   # deploy lại cho ăn secret
```

### 6. Bật cổng trong web
`/work` → Cài đặt → Cổng thanh toán → bật **Stripe (thẻ)**.
(Không cần điền secret key ở đó nữa — key nằm trong Supabase secrets.)

### 7. Test (chế độ test)
1. Đặt 1 đơn, chọn cổng Stripe → trang đơn → bấm "Thanh toán bằng thẻ".
2. Trang Stripe hiện ra → thẻ test `4242 4242 4242 4242`, ngày bất kỳ tương lai, CVC bất kỳ.
3. Trả xong quay về trang đơn → vài giây sau trạng thái tự chuyển "Đã thanh toán"
   (webhook gọi `system_confirm_payment`).
4. Chạy ổn thì đổi sang key thật: `supabase secrets set STRIPE_SECRET_KEY=sk_live_...`,
   tạo webhook endpoint ở chế độ Live (whsec mới) và đặt lại `SITE_URL=https://tenmien.com`.

## Chống chargeback (khuyến nghị)
Stripe Dashboard → **Settings → Radar** → bật rule yêu cầu **3D Secure** khi có thể —
giao dịch qua 3DS thì tranh chấp dạng gian lận thẻ chuyển trách nhiệm về ngân hàng.
Lưu đủ minh chứng giao hàng (ảnh proof + chat) để phản hồi dispute.
