// Edge Function: tạo PaymentIntent cho một đơn hàng.
// Luôn trả clientSecret để Stripe Elements thanh toán ngay trong Bloxus;
// endpoint này không tạo URL checkout.stripe.com.
//
// Secrets cần đặt (supabase secrets set ...):
//   STRIPE_SECRET_KEY  = sk_live_... (hoặc sk_test_... khi thử)
//   SITE_URL           = https://bloxus.store (URL web, cho success/cancel)
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY được inject sẵn.
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
});

// Giá lưu VND -> charge bằng USD (khớp tỉ giá hiển thị của shop:
// src/store/currencyStore.ts USD_VND_RATE).
const USD_VND_RATE = 26_000;
// Phí xử lý cộng vào cho khách khi trả thẻ (bù phí Stripe).
// Chỉnh 2 số này là đổi công thức: fee = subtotal * PERCENT + FIXED.
// (Nhớ chỉnh STRIPE_FEE_* trong src/lib/paymentGateways.ts cho khớp.)
const PROCESSING_FEE_PERCENT = 0.05; // 5%
const PROCESSING_FEE_FIXED_CENTS = 30; // + $0.30

/** VND -> cent USD, làm tròn. */
function vndToUsdCents(vnd: number): number {
  return Math.round((vnd / USD_VND_RATE) * 100);
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { order_id } = await req.json();
    if (!order_id) return json(400, { error: "Thiếu order_id" });

    // Xác thực người gọi từ JWT.
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData.user) return json(401, { error: "Chưa đăng nhập" });

    // Đọc đơn bằng service role (kiểm tra chủ đơn + trạng thái).
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select("id, order_code, user_id, status, total, order_items(name, unit_price, quantity)")
      .eq("id", order_id)
      .single();
    if (orderErr || !order) return json(404, { error: "Không tìm thấy đơn hàng" });
    if (order.user_id !== userData.user.id) return json(403, { error: "Không phải đơn của bạn" });
    if (order.status !== "pending_payment") {
      return json(400, { error: "Đơn không ở trạng thái chờ thanh toán" });
    }

    const items = (order.order_items ?? []) as Array<{
      name: string;
      unit_price: number;
      quantity: number;
    }>;

    // Phí xử lý tính trên tổng đơn (theo cent USD cho khớp phần làm tròn).
    const subtotalCents = items.reduce(
      (sum, it) => sum + vndToUsdCents(it.unit_price) * it.quantity,
      0,
    );
    const feeCents =
      Math.round(subtotalCents * PROCESSING_FEE_PERCENT) + PROCESSING_FEE_FIXED_CENTS;

    // Bloxus only uses Stripe Elements. Never create or return a hosted
    // checkout.stripe.com URL from this endpoint.
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: subtotalCents + feeCents,
        currency: "usd",
        payment_method_types: ["card"],
        receipt_email: userData.user.email ?? undefined,
        metadata: { order_id: order.id, order_code: order.order_code },
        description: `Bloxus order ${order.order_code}`,
      },
      { idempotencyKey: `bloxus-elements-${order.id}` },
    );
    return json(200, { clientSecret: paymentIntent.client_secret });
  } catch (e) {
    console.error("create-checkout-session error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Internal error" });
  }
});
