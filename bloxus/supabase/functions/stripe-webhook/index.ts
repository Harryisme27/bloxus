// Edge Function: webhook Stripe — nhận sự kiện thanh toán, xác minh chữ ký,
// đánh dấu đơn đã thanh toán qua RPC system_confirm_payment (service role).
//
// Secrets cần đặt:
//   STRIPE_SECRET_KEY     = sk_live_... / sk_test_...
//   STRIPE_WEBHOOK_SECRET = whsec_... (Stripe Dashboard -> Webhooks -> endpoint)
//
// Deploy KHÔNG xác thực JWT (Stripe gọi ẩn danh, bảo mật bằng chữ ký whsec):
//   supabase functions deploy stripe-webhook --no-verify-jwt
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
});
// Verify chữ ký bằng SubtleCrypto (bắt buộc trong môi trường Deno/Edge).
const cryptoProvider = Stripe.createSubtleCryptoProvider();

async function confirmOrder(orderId: string, reference: string): Promise<string | null> {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { error } = await admin.rpc("system_confirm_payment", {
    p_order_id: orderId,
    p_ref: `stripe:${reference}`,
  });
  return error?.message ?? null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing stripe-signature", { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "",
      undefined,
      cryptoProvider,
    );
  } catch (e) {
    console.error("Webhook signature verification failed:", e);
    return new Response("Invalid signature", { status: 400 });
  }

  // checkout.session.completed: thanh toán thẻ xong ngay.
  // checkout.session.async_payment_succeeded: các phương thức trả chậm.
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") return new Response("ok (unpaid)", { status: 200 });

    const orderId = session.metadata?.order_id ?? session.client_reference_id;
    if (!orderId) {
      console.error("No order_id in session", session.id);
      return new Response("ok (no order_id)", { status: 200 });
    }

    const ref = typeof session.payment_intent === "string" ? session.payment_intent : session.id;
    const error = await confirmOrder(orderId, ref);
    if (error) {
      console.error("system_confirm_payment failed:", error);
      // Trả 500 để Stripe retry (đơn chưa được đánh dấu paid).
      return new Response("confirm failed", { status: 500 });
    }
  }

  // Stripe Elements dùng PaymentIntent thay cho Checkout Session.
  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata?.order_id;
    if (!orderId) return new Response("ok (no order_id)", { status: 200 });
    const error = await confirmOrder(orderId, intent.id);
    if (error) {
      console.error("system_confirm_payment failed:", error);
      return new Response("confirm failed", { status: 500 });
    }
  }

  return new Response("ok", { status: 200 });
});
