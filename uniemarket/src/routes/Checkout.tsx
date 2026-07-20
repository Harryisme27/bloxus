import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AtSign, Gamepad2, Landmark, Lock, MessageSquare, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequireAuth } from "@/components/account/RequireAuth";
import { OrderSummary } from "@/components/commerce/OrderSummary";
import { PaymentMethodSelector } from "@/components/commerce/PaymentMethodSelector";
import { useCartStore } from "@/store/cartStore";
import { useBuyNowStore } from "@/store/buyNowStore";
import { useAuthStore } from "@/store/authStore";
import { placeOrder } from "@/lib/db/orders";
import { getPublicGateways } from "@/lib/db/settings";
import { enabledGateways } from "@/lib/paymentGateways";
import { isSupabaseConfigured } from "@/lib/supabase";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    orderCreated: "Đã tạo đơn hàng!",
    orderCodePrefix: "Mã đơn: ",
    ordersCreatedMulti: (n: number) => `Đã tạo ${n} đơn (mỗi món một đơn riêng).`,
    createFailed: "Không tạo được đơn hàng.",
    title: "Thanh toán",
    subtitle:
      "Hoàn tất đơn hàng — sau khi đặt, bạn trao đổi trực tiếp với người bán ngay trong trang đơn hàng.",
    deliveryInfo: "Thông tin nhận hàng",
    accountEmail: "Email tài khoản",
    gameUsernameLabel: "Tên tài khoản trong game ",
    optional: "(không bắt buộc)",
    gameUsernamePlaceholder: "Username / ID nhận hàng trong game",
    gameUsernameHint:
      "Người xử lý đơn sẽ giao hàng hoặc thực hiện dịch vụ trên tài khoản này. Bạn có thể bổ sung sau qua khung chat của đơn.",
    noteLabel: "Ghi chú ",
    notePlaceholder: "Yêu cầu thêm cho đơn hàng...",
    chatNotice:
      "Sau khi đặt, bạn trao đổi trực tiếp với người bán ngay trong trang đơn hàng — không cần cung cấp liên hệ bên ngoài.",
    paymentMethod: "Phương thức thanh toán",
    manualPayment: "Thanh toán thủ công",
    manualPaymentDesc:
      "Sau khi tạo đơn, bạn sẽ thấy thông tin chuyển khoản kèm mã đơn. Shop xác nhận nhận được tiền rồi mới bắt đầu xử lý — mọi trao đổi diễn ra ngay trong trang đơn hàng.",
    badgeCodeTitle: "Có mã đơn riêng",
    badgeCodeDesc: "Ghi mã khi chuyển khoản",
    badgeChatTitle: "Chat trực tiếp",
    badgeChatDesc: "Trao đổi với người xử lý đơn",
    creatingOrder: "Đang tạo đơn...",
    placeOrder: "Đặt hàng",
  },
  en: {
    orderCreated: "Order created!",
    orderCodePrefix: "Order code: ",
    ordersCreatedMulti: (n: number) => `Created ${n} orders (one per item).`,
    createFailed: "Couldn't create the order.",
    title: "Checkout",
    subtitle:
      "Complete your order — after placing it, you'll chat directly with the seller right on the order page.",
    deliveryInfo: "Delivery details",
    accountEmail: "Account email",
    gameUsernameLabel: "In-game username ",
    optional: "(optional)",
    gameUsernamePlaceholder: "Username / ID to receive items in game",
    gameUsernameHint:
      "The person handling your order will deliver or perform the service on this account. You can add it later through the order chat.",
    noteLabel: "Note ",
    notePlaceholder: "Any extra requests for your order...",
    chatNotice:
      "After you place the order, you'll chat directly with the seller on the order page — no external contact needed.",
    paymentMethod: "Payment method",
    manualPayment: "Manual payment",
    manualPaymentDesc:
      "After creating the order, you'll see the transfer details along with your order code. The shop starts processing only after confirming payment — all communication happens on the order page.",
    badgeCodeTitle: "Your own order code",
    badgeCodeDesc: "Include the code when transferring",
    badgeChatTitle: "Direct chat",
    badgeChatDesc: "Talk with the person handling your order",
    creatingOrder: "Creating order...",
    placeOrder: "Place order",
  },
};

export function Checkout() {
  return (
    <RequireAuth>
      <CheckoutContent />
    </RequireAuth>
  );
}

function CheckoutContent() {
  const t = usePick(STR);
  const navigate = useNavigate();
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const buyNowLine = useBuyNowStore((state) => state.line);
  const clearBuyNow = useBuyNowStore((state) => state.clear);
  const session = useAuthStore((state) => state.session);

  const [gameUsername, setGameUsername] = useState("");
  const [note, setNote] = useState("");
  const [gatewayId, setGatewayId] = useState<string>("");
  const placedRef = useRef(false);

  // Mua ngay: chỉ hiện đúng món đó; ngược lại dùng giỏ hàng.
  const isBuyNow = buyNowLine !== null;
  const items = isBuyNow ? [buyNowLine] : cartItems;
  const total = items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const email = session?.user.email ?? "";

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
  // Chọn mặc định cổng đầu tiên khi tải xong.
  useEffect(() => {
    if (!gatewayId && gateways.length > 0) setGatewayId(gateways[0].id);
  }, [gateways, gatewayId]);

  // Rời checkout mà chưa đặt xong -> xoá buffer mua ngay (tránh lẫn với giỏ).
  useEffect(() => {
    return () => {
      if (!placedRef.current) clearBuyNow();
    };
  }, [clearBuyNow]);
  const selectedGateway = gateways.find((g) => g.id === gatewayId) ?? gateways[0];

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
    mutationFn: () =>
      placeOrder({
        items: orderItems,
        // Enum lưu vào đơn chỉ bank_transfer|momo; id cổng thật lưu ở gateway.
        paymentMethod: selectedGateway?.method ?? "bank_transfer",
        gateway: selectedGateway?.id,
        gameUsername: gameUsername.trim(),
        // Trao đổi qua chat trên trang đơn hàng — không cần kênh liên hệ ngoài.
        contactChannel: "",
        contactValue: "",
        note: note.trim() || undefined,
      }),
    onSuccess: (orders) => {
      placedRef.current = true;
      // Mua ngay chỉ xoá buffer mua ngay; ngược lại xoá giỏ.
      if (isBuyNow) clearBuyNow();
      else clearCart();
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
    mutation.mutate();
  }

  return (
    <PageContainer className="py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-text sm:text-4xl">{t.title}</h1>
        <p className="mt-2 text-text-muted">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: form */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gamepad2 className="h-4 w-4 text-yellow" aria-hidden="true" />
                {t.deliveryInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div>
                <Label htmlFor="email">{t.accountEmail}</Label>
                <div className="relative">
                  <AtSign
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
                    aria-hidden="true"
                  />
                  <Input id="email" className="pl-9" value={email} readOnly disabled />
                </div>
              </div>

              <div>
                <Label htmlFor="game-username">
                  {t.gameUsernameLabel}
                  <span className="font-normal text-text-subtle">{t.optional}</span>
                </Label>
                <div className="relative">
                  <Gamepad2
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
                    aria-hidden="true"
                  />
                  <Input
                    id="game-username"
                    className="pl-9"
                    placeholder={t.gameUsernamePlaceholder}
                    value={gameUsername}
                    onChange={(e) => setGameUsername(e.target.value)}
                  />
                </div>
                <p className="mt-1.5 text-xs text-text-subtle">{t.gameUsernameHint}</p>
              </div>

              <div>
                <Label htmlFor="note">
                  {t.noteLabel}
                  <span className="font-normal text-text-subtle">{t.optional}</span>
                </Label>
                <textarea
                  id="note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.notePlaceholder}
                  className="mt-1.5 w-full rounded-lg border border-border bg-surface-3 px-3 py-2 text-sm text-text placeholder:text-text-subtle focus-visible:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
                />
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-border-strong bg-surface-2 p-3.5 text-sm text-text-muted">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-green" aria-hidden="true" />
                <p>{t.chatNotice}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment method */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="h-4 w-4 text-yellow" aria-hidden="true" />
                {t.paymentMethod}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <PaymentMethodSelector gateways={gateways} value={gatewayId} onChange={setGatewayId} />
              <div className="rounded-xl border border-dashed border-border-strong bg-surface-2 p-4 text-sm text-text-muted">
                <p className="font-semibold text-text">{t.manualPayment}</p>
                <p className="mt-1">{t.manualPaymentDesc}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { icon: ShieldCheck, title: t.badgeCodeTitle, desc: t.badgeCodeDesc },
              { icon: MessageSquare, title: t.badgeChatTitle, desc: t.badgeChatDesc },
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
          <OrderSummary subtotal={total} total={total} lines={items}>
            <Button
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={mutation.isPending}
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              {mutation.isPending ? t.creatingOrder : t.placeOrder}
            </Button>
          </OrderSummary>
        </div>
      </div>
    </PageContainer>
  );
}
