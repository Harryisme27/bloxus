import { useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
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
import { useAuthStore } from "@/store/authStore";
import { placeOrder } from "@/lib/db/orders";
import type { DbPaymentMethod } from "@/types/db";

export function Checkout() {
  return (
    <RequireAuth>
      <CheckoutContent />
    </RequireAuth>
  );
}

function CheckoutContent() {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal);
  const clear = useCartStore((state) => state.clear);
  const session = useAuthStore((state) => state.session);

  const [gameUsername, setGameUsername] = useState("");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<DbPaymentMethod>("bank_transfer");
  const placedRef = useRef(false);

  const total = subtotal();
  const email = session?.user.email ?? "";

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
        paymentMethod: method,
        gameUsername: gameUsername.trim(),
        // Trao đổi qua chat trên trang đơn hàng — không cần kênh liên hệ ngoài.
        contactChannel: "",
        contactValue: "",
        note: note.trim() || undefined,
      }),
    onSuccess: (order) => {
      placedRef.current = true;
      clear();
      toast.success("Đã tạo đơn hàng!", { description: `Mã đơn: ${order.order_code}` });
      navigate(`/orders/${order.id}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Không tạo được đơn hàng.");
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
        <h1 className="font-heading text-3xl font-bold text-text sm:text-4xl">Thanh toán</h1>
        <p className="mt-2 text-text-muted">
          Hoàn tất đơn hàng — sau khi đặt, bạn trao đổi trực tiếp với người bán ngay trong trang đơn
          hàng.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: form */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gamepad2 className="h-4 w-4 text-yellow" aria-hidden="true" />
                Thông tin nhận hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div>
                <Label htmlFor="email">Email tài khoản</Label>
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
                  Tên tài khoản trong game{" "}
                  <span className="font-normal text-text-subtle">(không bắt buộc)</span>
                </Label>
                <div className="relative">
                  <Gamepad2
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
                    aria-hidden="true"
                  />
                  <Input
                    id="game-username"
                    className="pl-9"
                    placeholder="Username / ID nhận hàng trong game"
                    value={gameUsername}
                    onChange={(e) => setGameUsername(e.target.value)}
                  />
                </div>
                <p className="mt-1.5 text-xs text-text-subtle">
                  Người xử lý đơn sẽ giao hàng hoặc thực hiện dịch vụ trên tài khoản này. Bạn có thể
                  bổ sung sau qua khung chat của đơn.
                </p>
              </div>

              <div>
                <Label htmlFor="note">
                  Ghi chú <span className="font-normal text-text-subtle">(không bắt buộc)</span>
                </Label>
                <textarea
                  id="note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Yêu cầu thêm cho đơn hàng..."
                  className="mt-1.5 w-full rounded-lg border border-border bg-surface-3 px-3 py-2 text-sm text-text placeholder:text-text-subtle focus-visible:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
                />
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-border-strong bg-surface-2 p-3.5 text-sm text-text-muted">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-green" aria-hidden="true" />
                <p>
                  Sau khi đặt, bạn trao đổi trực tiếp với người bán ngay trong trang đơn hàng — không
                  cần cung cấp liên hệ bên ngoài.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment method */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="h-4 w-4 text-yellow" aria-hidden="true" />
                Phương thức thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <PaymentMethodSelector value={method} onChange={setMethod} />
              <div className="rounded-xl border border-dashed border-border-strong bg-surface-2 p-4 text-sm text-text-muted">
                <p className="font-semibold text-text">Thanh toán thủ công</p>
                <p className="mt-1">
                  Sau khi tạo đơn, bạn sẽ thấy thông tin chuyển khoản kèm mã đơn. Shop xác nhận nhận
                  được tiền rồi mới bắt đầu xử lý — mọi trao đổi diễn ra ngay trong trang đơn hàng.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { icon: ShieldCheck, title: "Có mã đơn riêng", desc: "Ghi mã khi chuyển khoản" },
              { icon: MessageSquare, title: "Chat trực tiếp", desc: "Trao đổi với người xử lý đơn" },
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
              {mutation.isPending ? "Đang tạo đơn..." : "Đặt hàng"}
            </Button>
          </OrderSummary>
        </div>
      </div>
    </PageContainer>
  );
}
