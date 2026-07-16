import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  AtSign,
  BadgeCheck,
  Gamepad2,
  Lock,
  MessageSquare,
  ServerCog,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { OrderItem } from "@/types";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useOrdersStore } from "@/store/ordersStore";
import { useDemoStore } from "@/store/demoStore";
import { getGameBySlug, getItemById } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { OrderSummary } from "@/components/commerce/OrderSummary";
import { DemoNotice } from "@/components/commerce/DemoNotice";
import { FakeCardForm } from "@/components/commerce/FakeCardForm";
import {
  PaymentMethodSelector,
  paymentMethodLabel,
  type PaymentMethodId,
} from "@/components/commerce/PaymentMethodSelector";
import { getAppliedPromo, promoRate, setAppliedPromo } from "@/components/commerce/promo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  robloxUsername?: string;
}

export function Checkout() {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal);
  const clear = useCartStore((state) => state.clear);
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const placeOrder = useOrdersStore((state) => state.placeOrder);
  const scenario = useDemoStore((state) => state.scenario);

  const [email, setEmail] = useState(session?.user.email ?? "");
  const [robloxUsername, setRobloxUsername] = useState("");
  const [discord, setDiscord] = useState("");
  const [method, setMethod] = useState<PaymentMethodId>("card");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  // Set the instant we place a successful order, BEFORE clearing the cart, so
  // the empty-cart guard below never redirects us to /cart mid-navigation.
  const placedRef = useRef(false);

  // A cart is required to check out — bounce back if it emptied out (but never
  // after we've just placed the order and are navigating to /order-success).
  if (items.length === 0 && !placedRef.current) {
    return <Navigate to="/cart" replace />;
  }

  const appliedCode = getAppliedPromo();
  const subtotalUSD = subtotal();
  const discountUSD = subtotalUSD * promoRate(appliedCode);
  const totalUSD = subtotalUSD - discountUSD;

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Vui lòng nhập email nhận biên lai.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Email không hợp lệ.";
    if (!robloxUsername.trim()) next.robloxUsername = "Cần username Roblox để giao vật phẩm.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handlePlaceOrder() {
    if (!validate()) {
      toast.error("Vui lòng kiểm tra lại thông tin giao hàng.");
      return;
    }

    // Demo scenario routing (change it on /admin).
    if (scenario === "failed") {
      navigate("/payment-failed");
      return;
    }
    if (scenario === "cancelled") {
      navigate("/payment-cancelled");
      return;
    }

    setSubmitting(true);

    const orderItems: OrderItem[] = items.map((line) => ({
      itemId: line.itemId,
      gameName: getGameBySlug(line.gameId)?.name ?? line.gameId,
      name: line.name,
      rarity: getItemById(line.itemId)?.rarity ?? "—",
      unitPriceUSD: line.unitPriceUSD,
      quantity: line.quantity,
    }));

    const order = placeOrder({
      userId: user?.id ?? "guest",
      items: orderItems,
      robloxUsername: robloxUsername.trim(),
      subtotalUSD,
      discountUSD,
      totalUSD,
      paymentMethod: paymentMethodLabel(method),
    });

    // Success: mark placed (so the empty-cart guard won't fire), clear the
    // cart + promo, then hand the id to the success page.
    placedRef.current = true;
    clear();
    setAppliedPromo(null);
    toast.success("Đặt hàng thành công!", { description: `Mã đơn: ${order.id}` });
    navigate("/order-success", { state: { orderId: order.id } });
  }

  return (
    <PageContainer className="py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-text sm:text-4xl">Thanh toán</h1>
        <p className="mt-2 text-text-muted">
          Hoàn tất đơn hàng và nhận vật phẩm giao ngay vào tài khoản Roblox của bạn.
        </p>
      </div>

      <DemoNotice className="mb-8" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: form */}
        <div className="space-y-6">
          {/* Contact / delivery */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gamepad2 className="h-4 w-4 text-yellow" aria-hidden="true" />
                Thông tin giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div>
                <Label htmlFor="email">Email nhận biên lai</Label>
                <div className="relative">
                  <AtSign
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
                    aria-hidden="true"
                  />
                  <Input
                    id="email"
                    type="email"
                    className="pl-9"
                    placeholder="ban@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email ? (
                  <p className="mt-1.5 text-xs text-danger">{errors.email}</p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="roblox">Username Roblox</Label>
                <div className="relative">
                  <Gamepad2
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
                    aria-hidden="true"
                  />
                  <Input
                    id="roblox"
                    className="pl-9"
                    placeholder="Tên đăng nhập Roblox của bạn"
                    value={robloxUsername}
                    onChange={(e) => setRobloxUsername(e.target.value)}
                    aria-invalid={!!errors.robloxUsername}
                  />
                </div>
                {errors.robloxUsername ? (
                  <p className="mt-1.5 text-xs text-danger">{errors.robloxUsername}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-text-subtle">
                    Nhân viên sẽ kết bạn và giao vật phẩm vào tài khoản này.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="discord">
                  Discord <span className="font-normal text-text-subtle">(không bắt buộc)</span>
                </Label>
                <div className="relative">
                  <MessageSquare
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
                    aria-hidden="true"
                  />
                  <Input
                    id="discord"
                    className="pl-9"
                    placeholder="username#0000"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment method */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-yellow" aria-hidden="true" />
                Phương thức thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <PaymentMethodSelector value={method} onChange={setMethod} />

              {method === "card" ? (
                <FakeCardForm />
              ) : (
                <div className="rounded-xl border border-dashed border-border-strong bg-surface-2 p-5 text-center">
                  <p className="text-sm text-text-muted">
                    Bạn đã chọn{" "}
                    <span className="font-semibold text-text">{paymentMethodLabel(method)}</span>. Ở
                    bản demo này, mọi phương thức đều được mô phỏng — không cần nhập thông tin thật.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reassurance badges */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Mã hoá SSL", desc: "Kết nối an toàn" },
              { icon: BadgeCheck, title: "Giao dịch bảo đảm", desc: "Hoàn tiền nếu lỗi" },
              { icon: Sparkles, title: "Giao tức thì", desc: "Trong vài phút" },
            ].map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.title}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-soft text-green">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">{badge.title}</p>
                    <p className="truncate text-xs text-text-subtle">{badge.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: summary sidebar */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary
            subtotalUSD={subtotalUSD}
            discountUSD={discountUSD}
            totalUSD={totalUSD}
            lines={items}
            promoCode={appliedCode}
          >
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full"
                onClick={handlePlaceOrder}
                disabled={submitting}
              >
                <Lock className="h-4 w-4" aria-hidden="true" />
                Đặt hàng · {formatPrice(totalUSD)}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-text-subtle">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Thanh toán được bảo mật (mô phỏng)
              </p>
            </div>
          </OrderSummary>

          {/* Demo scenario hint */}
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-text-muted">
              <ServerCog className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 text-xs leading-relaxed text-text-muted">
              <p className="font-semibold text-text">Kịch bản demo: {scenarioLabel(scenario)}</p>
              <p className="mt-0.5">
                Bạn có thể đổi kết quả thanh toán (thành công / thất bại / huỷ) tại trang{" "}
                <span className="font-semibold text-yellow">/admin</span> để thử các luồng khác nhau.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function scenarioLabel(scenario: "success" | "failed" | "cancelled"): string {
  if (scenario === "failed") return "Thất bại";
  if (scenario === "cancelled") return "Huỷ";
  return "Thành công";
}
