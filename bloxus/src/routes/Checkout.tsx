import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Elements, ExpressCheckoutElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { AtSign, Check, CreditCard, Gamepad2, Lock, MessageSquare, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequireAuth } from "@/components/account/RequireAuth";
import { OrderSummary } from "@/components/commerce/OrderSummary";
import { PaymentMethodSelector } from "@/components/commerce/PaymentMethodSelector";
import { useCartStore, type CartLine } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { TurnstileWidget, turnstileEnabled } from "@/components/account/TurnstileWidget";
import { placeOrder } from "@/lib/db/orders";
import { payOrderWithCredit } from "@/lib/db/credit";
import { getPublicGateways } from "@/lib/db/settings";
import { enabledGateways, stripeProcessingFeeVnd } from "@/lib/paymentGateways";
import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    orderCreated: "Đã tạo đơn hàng!",
    orderCodePrefix: "Mã đơn: ",
    ordersCreatedMulti: (n: number) => `Đã tạo ${n} đơn (mỗi món một đơn riêng).`,
    createFailed: "Không tạo được đơn hàng.",
    title: "Thanh toán",
    subtitle:
      "Hoàn tất đơn hàng - sau khi đặt, bạn trao đổi trực tiếp với người bán ngay trong trang đơn hàng.",
    deliveryInfo: "Thông tin nhận hàng",
    accountEmail: "Email tài khoản",
    gameUsernameLabel: "Tên tài khoản trong game ",
    optional: "(không bắt buộc)",
    gameUsernamePlaceholder: "Username / ID nhận hàng trong game",
    gameUsernameHint:
      "Người xử lý đơn sẽ giao hàng hoặc thực hiện dịch vụ trực tiếp trên tài khoản này.",
    noteLabel: "Ghi chú ",
    notePlaceholder: "Yêu cầu thêm cho đơn hàng...",
    chatNotice:
      "Sau khi đặt, bạn trao đổi trực tiếp với người bán ngay trong trang đơn hàng - không cần cung cấp liên hệ bên ngoài.",
    paymentMethod: "Phương thức thanh toán",
    payWithCredit: "Thanh toán bằng số dư ví",
    balanceLabel: "Số dư",
    insufficientCredit: "không đủ",
    creditPayNotice: "Đơn sẽ được thanh toán ngay bằng số dư ví và xử lý luôn.",
    manualPayment: "Thanh toán thủ công",
    manualPaymentDesc:
      "Sau khi tạo đơn, bạn sẽ thấy thông tin chuyển khoản kèm mã đơn. Shop xác nhận nhận được tiền rồi mới bắt đầu xử lý - mọi trao đổi diễn ra ngay trong trang đơn hàng.",
    stripePayment: "Thanh toán bằng thẻ / Apple Pay",
    stripePaymentDesc:
      "Bấm \"Đặt hàng\" là chuyển thẳng tới trang thanh toán bảo mật (hỗ trợ thẻ quốc tế và Apple Pay). Giá được quy đổi sang USD và cộng phí xử lý thẻ 5% + $0.30 (phí cổng thanh toán quốc tế - số cuối cùng hiển thị rõ trước khi bạn trả). Thanh toán xong, đơn tự xác nhận trong vài giây.",
    stripeRedirecting: "Đã tạo đơn - đang chuyển tới trang thanh toán…",
    stripeConfigMissing: "Stripe chưa có publishable key. Hãy kiểm tra cấu hình thanh toán.",
    stripeLoadFailed: "Không mở được biểu mẫu thanh toán Stripe.",
    securePayment: "Thanh toán an toàn",
    badgeCodeTitle: "Có mã đơn riêng",
    badgeCodeDesc: "Ghi mã khi chuyển khoản",
    badgeChatTitle: "Chat trực tiếp",
    badgeChatDesc: "Trao đổi với người xử lý đơn",
    creatingOrder: "Đang tạo đơn...",
    placeOrder: "Đặt hàng",
    walletZeroHint: "Mẹo: nạp tiền vào ví để lần sau thanh toán tức thì, không cần chờ xác nhận.",
    walletZeroLink: "Nạp ví ngay",
    signinTitle: "Đăng nhập để tiếp tục",
    signinDesc: "Giỏ hàng của bạn vẫn được giữ nguyên - đăng nhập xong sẽ tiếp tục thanh toán tại đây.",
    signinId: "Username hoặc email",
    signinPassword: "Mật khẩu",
    signinBtn: "Đăng nhập và tiếp tục mua",
    signinBusy: "Đang đăng nhập...",
    signinOk: "Đã đăng nhập - tiếp tục thanh toán!",
    signinNoAccount: "Chưa có tài khoản?",
    signinRegister: "Đăng ký ngay",
  },
  en: {
    orderCreated: "Order created!",
    orderCodePrefix: "Order code: ",
    ordersCreatedMulti: (n: number) => `Created ${n} orders (one per item).`,
    createFailed: "Couldn't create the order.",
    title: "Checkout",
    subtitle:
      "Complete your order - after placing it, you'll chat directly with the seller right on the order page.",
    deliveryInfo: "Delivery details",
    accountEmail: "Account email",
    gameUsernameLabel: "In-game username ",
    optional: "(optional)",
    gameUsernamePlaceholder: "Username / ID to receive items in game",
    gameUsernameHint:
      "The person handling your order will deliver or perform the service directly on this account.",
    noteLabel: "Note ",
    notePlaceholder: "Any extra requests for your order...",
    chatNotice:
      "After you place the order, you'll chat directly with the seller on the order page - no external contact needed.",
    paymentMethod: "Payment method",
    payWithCredit: "Pay with wallet balance",
    balanceLabel: "Balance",
    insufficientCredit: "insufficient",
    creditPayNotice: "The order is paid instantly from your wallet balance and processed right away.",
    manualPayment: "Manual payment",
    manualPaymentDesc:
      "After creating the order, you'll see the transfer details along with your order code. The shop starts processing only after confirming payment - all communication happens on the order page.",
    stripePayment: "Card / Apple Pay",
    stripePaymentDesc:
      "After placing the order, the secure card or Apple Pay form opens here on Bloxus. The final USD total includes the processing fee shown before payment.",
    stripeRedirecting: "Order created - loading the secure payment form...",
    stripeConfigMissing: "Stripe publishable key is missing. Check the payment settings.",
    stripeLoadFailed: "Could not open the Stripe payment form.",
    securePayment: "Secure checkout",
    badgeCodeTitle: "Your own order code",
    badgeCodeDesc: "Include the code when transferring",
    badgeChatTitle: "Direct chat",
    badgeChatDesc: "Talk with the person handling your order",
    creatingOrder: "Creating order...",
    placeOrder: "Place order",
    walletZeroHint: "Tip: top up your wallet to pay instantly next time - no waiting for confirmation.",
    walletZeroLink: "Top up now",
    signinTitle: "Sign in to continue",
    signinDesc: "Your cart is saved - after signing in you'll continue checking out right here.",
    signinId: "Username or email",
    signinPassword: "Password",
    signinBtn: "Sign in and keep checking out",
    signinBusy: "Signing in...",
    signinOk: "Signed in - continue your checkout!",
    signinNoAccount: "No account yet?",
    signinRegister: "Sign up now",
  },
};

type StripePromise = ReturnType<typeof loadStripe>;

function StripePaymentForm({
  orderId,
  total,
  initialMethod,
  onComplete,
}: {
  orderId: string;
  total: number;
  initialMethod: "apple" | "card";
  onComplete: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [method, setMethod] = useState<"apple" | "card">(initialMethod);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState<boolean | null>(null);

  async function confirmPayment() {
    if (!stripe || !elements || busy) return;
    setBusy(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}?stripe=success`,
      },
      redirect: "if_required",
    });
    if (result.error) {
      setError(result.error.message ?? "Payment could not be completed.");
      setBusy(false);
      return;
    }
    onComplete();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#343844] bg-[#111218] p-2">
        <button
          type="button"
          onClick={() => setMethod("apple")}
          className={cn(
            "flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all",
            method === "apple" ? "bg-yellow text-[#17200f] shadow-glow-amber" : "text-text-muted hover:bg-[#252833] hover:text-text",
          )}
        >
          <Smartphone className="h-4 w-4" aria-hidden />
          Apple Pay
        </button>
        <button
          type="button"
          onClick={() => setMethod("card")}
          className={cn(
            "flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all",
            method === "card" ? "bg-yellow text-[#17200f] shadow-glow-amber" : "text-text-muted hover:bg-[#252833] hover:text-text",
          )}
        >
          <CreditCard className="h-4 w-4" aria-hidden />
          Card
        </button>
      </div>

      {method === "apple" ? (
        <div className="rounded-2xl border border-[#343844] bg-[#1a1c23] p-4">
          <div className="mb-4 text-center">
            <p className="font-heading text-base font-bold text-text">Pay with Apple Pay</p>
            <p className="mt-1 text-xs text-text-muted">
              Open Apple Pay below. On supported computers, Apple may offer a code to scan with your iPhone.
            </p>
          </div>
          <ExpressCheckoutElement
            options={{
              buttonHeight: 48,
              buttonType: { applePay: "plain" },
              buttonTheme: { applePay: "white" },
              paymentMethods: {
                applePay: "always",
                googlePay: "never",
                link: "never",
                paypal: "never",
                amazonPay: "never",
                klarna: "never",
              },
              layout: { maxColumns: 1, maxRows: 1, overflow: "never" },
            }}
            onReady={({ availablePaymentMethods }) => {
              setAppleAvailable(Boolean(availablePaymentMethods?.applePay));
            }}
            onConfirm={() => void confirmPayment()}
          />
          {appleAvailable === false ? (
            <p className="mt-3 rounded-xl border border-yellow/25 bg-yellow/10 p-3 text-center text-xs text-text-muted">
              Apple Pay is not available on this browser or device. Use Safari on an Apple device, or choose Card.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#343844] bg-[#1a1c23] p-4 sm:p-5">
          <PaymentElement
            options={{
              layout: { type: "accordion", defaultCollapsed: false, radios: "never", spacedAccordionItems: false },
              wallets: { applePay: "never", googlePay: "never" },
            }}
          />
          <button
            type="button"
            disabled={!stripe || !elements || busy}
            onClick={() => void confirmPayment()}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-yellow font-heading text-sm font-extrabold text-[#17200f] transition-colors hover:bg-yellow-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Lock className="h-4 w-4" aria-hidden />
            {busy ? "Processing..." : `Pay ${formatPrice(total)}`}
          </button>
        </div>
      )}

      {error ? <p className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
      <p className="flex items-center justify-center gap-2 text-center text-xs text-text-subtle">
        <Lock className="h-3.5 w-3.5" aria-hidden />
        Payment details are encrypted and handled securely by Stripe.
      </p>
    </div>
  );
}

function StripeInlineCheckout({
  stripePromise,
  clientSecret,
  orderId,
  total,
  initialMethod,
  onComplete,
}: {
  stripePromise: StripePromise;
  clientSecret: string;
  orderId: string;
  total: number;
  initialMethod: "apple" | "card";
  onComplete: () => void;
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        fonts: [
          {
            cssSrc:
              "https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap",
          },
        ],
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#7cc35a",
            colorBackground: "#20222b",
            colorText: "#ffffff",
            colorTextSecondary: "#e2e4e8",
            colorDanger: "#ff6b6b",
            borderRadius: "12px",
            fontFamily: "'Baloo 2', Arial, sans-serif",
            spacingUnit: "4px",
          },
          rules: {
            ".Input": { border: "1px solid #444957", boxShadow: "none", color: "#ffffff" },
            ".Input:focus": { border: "1px solid #7cc35a", boxShadow: "0 0 0 3px rgba(124,195,90,.14)" },
            ".Input::placeholder": { color: "#9298a3" },
            ".Label": { color: "#ffffff", fontWeight: "600" },
            ".TabLabel": { color: "#ffffff", fontWeight: "700" },
            ".AccordionItem": { color: "#ffffff" },
            ".Block": { color: "#ffffff" },
            ".Text": { color: "#e2e4e8" },
          },
        },
      }}
    >
      <StripePaymentForm orderId={orderId} total={total} initialMethod={initialMethod} onComplete={onComplete} />
    </Elements>
  );
}

/** Món "Mua ngay" gửi kèm khi navigate("/checkout", { state: { buyNow } }).
 * Nằm trong history state nên sống qua remount (StrictMode) và cả F5;
 * rời checkout bằng điều hướng bình thường là tự mất — không cần dọn dẹp. */
function useBuyNowLine(): CartLine | null {
  const state = useLocation().state as { buyNow?: CartLine } | null;
  return state?.buyNow ?? null;
}

export function Checkout() {
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);

  // Chưa đăng nhập: KHÔNG đá về /login — hiện form đăng nhập ngay trong
  // checkout (giữ nguyên giỏ hàng), đăng nhập xong tiếp tục tại chỗ.
  if (!loading && !session) return <GuestCheckout />;

  return (
    <RequireAuth>
      <CheckoutContent />
    </RequireAuth>
  );
}

/** Checkout cho khách CHƯA đăng nhập: tóm tắt đơn + form đăng nhập inline. */
function GuestCheckout() {
  const t = usePick(STR);
  const cartItems = useCartStore((state) => state.items);
  const buyNowLine = useBuyNowLine();
  const login = useAuthStore((state) => state.login);

  const items = buyNowLine !== null ? [buyNowLine] : cartItems;
  const total = items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  if (items.length === 0) return <Navigate to="/cart" replace />;

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(identity, password, captchaToken ?? undefined);
    if (result.success) {
      toast.success(t.signinOk);
      // Session cập nhật -> Checkout tự render CheckoutContent, giỏ giữ nguyên.
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <PageContainer className="py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-extrabold text-text sm:text-4xl">
          <span className="bg-gradient-to-r from-white via-[#eff7e9] to-yellow bg-clip-text text-transparent">{t.title}</span>
        </h1>
        <p className="mt-2 max-w-3xl text-[#a9bda8]">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: inline sign-in */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-yellow" aria-hidden="true" />
                {t.signinTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <p className="mb-4 text-sm text-text-muted">{t.signinDesc}</p>
              <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                <div>
                  <Label htmlFor="co-identity">{t.signinId}</Label>
                  <div className="relative">
                    <AtSign
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
                      aria-hidden="true"
                    />
                    <Input
                      id="co-identity"
                      className="pl-9"
                      autoComplete="username"
                      value={identity}
                      onChange={(e) => setIdentity(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="co-password">{t.signinPassword}</Label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
                      aria-hidden="true"
                    />
                    <Input
                      id="co-password"
                      type="password"
                      className="pl-9"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                <TurnstileWidget onToken={setCaptchaToken} />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={submitting || (turnstileEnabled && !captchaToken)}
                >
                  {submitting ? t.signinBusy : t.signinBtn}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-text-muted">
                {t.signinNoAccount}{" "}
                <Link
                  to="/register?next=/checkout"
                  className="font-semibold text-yellow hover:text-yellow-hover"
                >
                  {t.signinRegister}
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: summary (nút đặt hàng khoá tới khi đăng nhập) */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary subtotal={total} total={total} lines={items}>
            <Button size="lg" className="w-full" disabled>
              <Lock className="h-4 w-4" aria-hidden="true" />
              {t.placeOrder}
            </Button>
          </OrderSummary>
        </div>
      </div>
    </PageContainer>
  );
}

function CheckoutContent() {
  const t = usePick(STR);
  const navigate = useNavigate();
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const buyNowLine = useBuyNowLine();
  const balance = useAuthStore((state) => state.user?.credit_balance ?? 0);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  const [gameUsername, setGameUsername] = useState("");
  const [gatewayId, setGatewayId] = useState<string>("");
  const [stripeMethod, setStripeMethod] = useState<"apple" | "card">("card");
  const [useCredit, setUseCredit] = useState(false);
  const [embeddedPayment, setEmbeddedPayment] = useState<{
    clientSecret: string;
    orderId: string;
    total: number;
    method: "apple" | "card";
  } | null>(null);
  const placedRef = useRef(false);

  // Mua ngay: chỉ hiện đúng món đó; ngược lại dùng giỏ hàng.
  const isBuyNow = buyNowLine !== null;
  const items = isBuyNow ? [buyNowLine] : cartItems;
  const total = items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const canUseCredit = total > 0 && balance >= total;

  // Cổng thanh toán admin bật (RPC công khai — khách đọc được, đã bỏ secret_key).
  const settingsQuery = useQuery({
    queryKey: ["public-gateways"],
    queryFn: getPublicGateways,
    enabled: isSupabaseConfigured,
  });
  const gateways = useMemo(
    () => enabledGateways(settingsQuery.data ?? {}),
    [settingsQuery.data],
  );
  const configuredStripeKey = String(settingsQuery.data?.stripe?.publishable_key ?? "").trim();
  const localStripeKey = String(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "").trim();
  const stripePublishableKey = configuredStripeKey.startsWith("pk_")
    ? configuredStripeKey
    : localStripeKey;
  const stripePromise = useMemo(
    () => (stripePublishableKey.startsWith("pk_") ? loadStripe(stripePublishableKey) : null),
    [stripePublishableKey],
  );
  // Chọn mặc định cổng đầu tiên khi tải xong.
  useEffect(() => {
    if (!gatewayId && gateways.length > 0) setGatewayId(gateways[0].id);
  }, [gateways, gatewayId]);

  const selectedGateway = gateways.find((g) => g.id === gatewayId) ?? gateways[0];
  // Chọn Stripe -> hiện phí xử lý ngay trong tóm tắt (khớp số trên trang Stripe).
  const stripeFee =
    !useCredit && selectedGateway?.id === "stripe" ? stripeProcessingFeeVnd(items) : 0;

  const orderItems = useMemo(
    () =>
      items.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        selectedOptions: line.selectedOptions ?? undefined,
      })),
    [items],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const orders = await placeOrder({
        items: orderItems,
        // Enum lưu vào đơn chỉ bank_transfer|momo; id cổng thật lưu ở gateway.
        paymentMethod: useCredit ? "bank_transfer" : selectedGateway?.method ?? "bank_transfer",
        gateway: useCredit ? "credit" : selectedGateway?.id,
        gameUsername: gameUsername.trim(),
        // Trao đổi qua chat trên trang đơn hàng — không cần kênh liên hệ ngoài.
        contactChannel: "",
        contactValue: "",
        note: undefined,
      });
      // Thanh toán bằng số dư: trả từng đơn ngay, rồi làm mới hồ sơ (số dư đổi).
      if (useCredit) {
        for (const o of orders) await payOrderWithCredit(o.id);
        await refreshProfile();
      }
      return orders;
    },
    onSuccess: async (orders) => {
      placedRef.current = true;
      // Mua ngay không đụng giỏ; đặt từ giỏ thì xoá giỏ.
      if (!isBuyNow) clearCart();

      // Chọn Stripe (1 đơn): tạo Embedded Checkout và hiển thị ngay trong Bloxus.
      if (!useCredit && selectedGateway?.id === "stripe" && orders.length === 1) {
        try {
          const sb = requireSupabase();
          const { data, error } = await sb.functions.invoke("create-checkout-session", {
            body: { order_id: orders[0].id, elements: true },
          });
          const clientSecret = (data as { clientSecret?: string } | null)?.clientSecret;
          if (!error && clientSecret) {
            setEmbeddedPayment({ clientSecret, orderId: orders[0].id, total: total + stripeFee, method: stripeMethod });
            return;
          }
          toast.error(error?.message || t.stripeLoadFailed);
        } catch {
          toast.error(t.stripeLoadFailed);
        }
        navigate(`/orders/${orders[0].id}`);
        return;
      }

      // Mỗi món = 1 đơn riêng. 1 đơn → mở thẳng; nhiều đơn → về danh sách.
      if (orders.length === 1) {
        toast.success(t.orderCreated, { description: `${t.orderCodePrefix}${orders[0].order_code}` });
        navigate(`/orders/${orders[0].id}`);
      } else {
        toast.success(t.orderCreated, { description: t.ordersCreatedMulti(orders.length) });
        navigate("/orders");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t.createFailed);
    },
  });

  // Cần có giỏ hàng để thanh toán — nhưng không quay lại /cart sau khi đã đặt xong.
  if (items.length === 0 && !placedRef.current) {
    return <Navigate to="/cart" replace />;
  }

  function handleSubmit() {
    if (!gameUsername.trim()) {
      toast.error(t.gameUsernamePlaceholder);
      document.getElementById("game-username")?.focus();
      return;
    }
    if (!useCredit && selectedGateway?.id === "stripe" && !stripePromise) {
      toast.error(t.stripeConfigMissing);
      return;
    }
    mutation.mutate();
  }

  if (embeddedPayment && stripePromise) {
    return (
      <PageContainer className="py-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => navigate(`/orders/${embeddedPayment.orderId}`)}
              className="mb-5 text-sm font-semibold text-green transition-colors hover:text-yellow"
            >
              ← Back to order
            </button>
            <h1 className="font-heading text-3xl font-extrabold text-text">{t.securePayment}</h1>
            <p className="mt-2 text-sm text-text-muted">{t.stripePayment}</p>
          </div>
          <div className="rounded-2xl border border-[#343844] bg-[#13151a] p-4 shadow-[0_24px_70px_-35px_rgba(0,0,0,0.75)] sm:p-6">
            <StripeInlineCheckout
              stripePromise={stripePromise}
              clientSecret={embeddedPayment.clientSecret}
              orderId={embeddedPayment.orderId}
              total={embeddedPayment.total}
              initialMethod={embeddedPayment.method}
              onComplete={() => navigate(`/orders/${embeddedPayment.orderId}?stripe=success`)}
            />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-[1500px] py-8 sm:py-10">
      <div className="mb-8 text-center lg:w-[calc(100%-460px)]">
        <h1 className="font-heading text-3xl font-extrabold text-text sm:text-4xl">{t.securePayment}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-text-muted">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-10">
        {/* Left: form */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-[#343844] bg-[#13151a] shadow-[0_18px_50px_-35px_rgba(0,0,0,0.75)]">
            <CardContent className="space-y-3 p-4">
              {items.map((line) => (
                <div key={line.id} className="flex items-center gap-4 rounded-xl border border-[#294630] bg-[#122519] p-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#3a5c42] bg-[#0a160e]">
                    {line.imageUrl ? (
                      <img src={line.imageUrl} alt={line.name} className="h-full w-full object-cover" />
                    ) : (
                      <Gamepad2 className="h-7 w-7 text-green" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-heading text-base font-bold text-text">{line.name}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-[#8fad8b]">
                      {line.optionSummary || (line.kind === "service" ? "Service" : "Game item")} · Qty {line.quantity}
                    </p>
                  </div>
                  <p className="tabular-nums-mono shrink-0 font-heading text-sm font-bold text-yellow">
                    {formatPrice(line.unitPrice * line.quantity)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="space-y-4 p-0">
              <div>
                <Label htmlFor="game-username">{t.gameUsernameLabel}</Label>
                <div className="relative">
                  <Gamepad2
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
                    aria-hidden="true"
                  />
                  <Input
                    id="game-username"
                    className="border-[#444957] bg-[#20222b] pl-9 text-text focus-visible:border-yellow focus-visible:ring-yellow/20"
                    placeholder={t.gameUsernamePlaceholder}
                    value={gameUsername}
                    onChange={(e) => setGameUsername(e.target.value)}
                    required
                  />
                </div>
                <p className="mt-1.5 text-xs text-text-subtle">{t.gameUsernameHint}</p>
              </div>

            </CardContent>
          </Card>

          {/* Payment method */}
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader className="px-0 pb-3 pt-0">
              <CardTitle className="flex items-center gap-2 text-base">
                {t.paymentMethod}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {/* Thanh toán bằng số dư ví */}
              {balance > 0 ? (
                <button
                  type="button"
                  onClick={() => canUseCredit && setUseCredit((v) => !v)}
                  disabled={!canUseCredit}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all",
                    useCredit ? "border-yellow shadow-glow-amber" : "border-border hover:border-border-strong",
                    !canUseCredit && "cursor-not-allowed opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      useCredit ? "bg-yellow text-text-on-yellow" : "bg-surface-3 text-text-muted",
                    )}
                  >
                    <Wallet className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-sm font-semibold text-text">
                      {t.payWithCredit}
                    </span>
                    <span className="block text-xs text-text-subtle">
                      {t.balanceLabel}: {formatPrice(balance)}
                      {!canUseCredit ? ` · ${t.insufficientCredit}` : ""}
                    </span>
                  </span>
                  {useCredit ? (
                    <Check className="h-5 w-5 shrink-0 text-yellow" aria-hidden />
                  ) : null}
                </button>
              ) : null}

              {/* Cổng thủ công — ẩn khi trả bằng số dư */}
              {!useCredit ? (
                <PaymentMethodSelector
                  gateways={gateways}
                  value={gatewayId}
                  onChange={setGatewayId}
                  stripeMethod={stripeMethod}
                  onStripeMethodChange={setStripeMethod}
                />
              ) : (
                <div className="rounded-xl border border-yellow bg-yellow-soft p-4 text-sm text-text-muted">
                  {t.creditPayNotice}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right: summary sidebar */}
        <div className="rounded-2xl border border-[#293c2e] bg-[#101a13] p-2 lg:sticky lg:top-20 lg:self-start lg:p-5">
          <OrderSummary
            subtotal={total}
            fee={stripeFee}
            total={total + stripeFee}
            lines={items}
            className="border-0 bg-transparent shadow-none"
          >
            <Button
              size="lg"
              variant="purchase"
              className="w-full"
              onClick={handleSubmit}
              disabled={mutation.isPending}
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              {mutation.isPending
                ? t.creatingOrder
                : selectedGateway?.id === "stripe"
                  ? stripeMethod === "apple"
                    ? "Continue with Apple Pay"
                    : "Enter card details"
                  : t.placeOrder}
            </Button>
            <div className="mt-5 space-y-3 border-t border-[#293c2e] pt-4 text-xs text-text-muted">
              <p className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green" aria-hidden />
                <span><strong className="text-text">Secure payment</strong><br />Your payment details are protected by Stripe.</span>
              </p>
              <p className="flex items-start gap-2">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-green" aria-hidden />
                <span><strong className="text-text">Direct order chat</strong><br />Chat with the seller after placing your order.</span>
              </p>
            </div>
          </OrderSummary>
        </div>
      </div>
    </PageContainer>
  );
}
