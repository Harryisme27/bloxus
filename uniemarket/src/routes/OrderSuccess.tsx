import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Gamepad2,
  Headset,
  LayoutDashboard,
  PackageSearch,
  ShoppingBag,
} from "lucide-react";
import type { Order } from "@/types";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RarityBadge } from "@/components/RarityBadge";
import { useOrdersStore } from "@/store/ordersStore";
import { DeliveryTracker } from "@/components/commerce/DeliveryTracker";
import { formatPrice } from "@/lib/format";

interface SuccessLocationState {
  orderId?: string;
}

export function OrderSuccess() {
  const location = useLocation();
  const orders = useOrdersStore((state) => state.orders);
  const getById = useOrdersStore((state) => state.getById);

  const stateOrderId = (location.state as SuccessLocationState | null)?.orderId;
  const order: Order | undefined = stateOrderId ? getById(stateOrderId) : orders[0];

  // ---- No order to show -----------------------------------------------------
  if (!order) {
    return (
      <PageContainer className="py-16">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border-strong bg-surface">
            <PackageSearch className="h-9 w-9 text-text-subtle" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-text sm:text-3xl">
            Chưa có đơn hàng nào
          </h1>
          <p className="mt-3 text-text-muted">
            Chúng tôi không tìm thấy đơn hàng gần đây. Hãy chọn vài vật phẩm và tiến hành thanh toán
            để xem luồng giao hàng.
          </p>
          <Link to="/games" className="mt-8">
            <Button size="lg">
              Bắt đầu mua sắm
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-12 sm:py-16">
      {/* Success hero */}
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="relative mb-6">
          <span className="absolute inset-0 animate-ping rounded-full bg-green motion-reduce:hidden" aria-hidden="true" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green text-text-on-green shadow-glow-green">
            <Check className="h-10 w-10" strokeWidth={3} aria-hidden="true" />
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold text-text sm:text-4xl">
          Đặt hàng thành công!
        </h1>
        <p className="mt-3 max-w-lg text-text-muted">
          Cảm ơn bạn đã mua sắm tại Uniemarket. Vật phẩm đang được chuẩn bị và sẽ được giao vào tài
          khoản Roblox{" "}
          <span className="font-semibold text-text">{order.robloxUsername}</span> trong ít phút.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-4 py-1.5">
          <span className="text-xs text-text-muted">Mã đơn hàng</span>
          <span className="tabular-nums-mono text-sm font-bold text-yellow">{order.id}</span>
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: tracker + items */}
        <div className="space-y-6">
          <DeliveryTracker estimate="2-5 phút" />

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="h-4 w-4 text-yellow" aria-hidden="true" />
                Chi tiết đơn hàng
              </CardTitle>
              <span className="text-xs text-text-subtle">
                Thanh toán: <span className="text-text-muted">{order.paymentMethod}</span>
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="divide-y divide-border">
                {order.items.map((item, index) => (
                  <li
                    key={`${item.itemId}-${index}`}
                    className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 font-heading text-sm font-extrabold text-text-subtle">
                      {item.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-text">{item.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <RarityBadge rarity={item.rarity} />
                        <span className="text-xs text-text-subtle">{item.gameName}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular-nums-mono text-sm font-semibold text-yellow">
                        {formatPrice(item.unitPriceUSD * item.quantity)}
                      </p>
                      <p className="tabular-nums-mono text-xs text-text-subtle">
                        {formatPrice(item.unitPriceUSD)} × {item.quantity}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex items-center justify-between text-text-muted">
                  <span>Tạm tính</span>
                  <span className="tabular-nums-mono">{formatPrice(order.subtotalUSD)}</span>
                </div>
                {order.discountUSD > 0 ? (
                  <div className="flex items-center justify-between text-success">
                    <span>Giảm giá</span>
                    <span className="tabular-nums-mono">− {formatPrice(order.discountUSD)}</span>
                  </div>
                ) : null}
                <div className="flex items-end justify-between pt-1">
                  <span className="font-heading text-sm font-semibold text-text">Tổng cộng</span>
                  <span className="tabular-nums-mono font-heading text-xl font-extrabold text-yellow">
                    {formatPrice(order.totalUSD)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: next steps */}
        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <Link to="/proofs" className="block">
            <Button variant="gold" size="lg" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <PackageSearch className="h-4 w-4" aria-hidden="true" />
                Xem minh chứng giao hàng
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link to="/dashboard" className="block">
            <Button variant="secondary" size="lg" className="w-full justify-start">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Về bảng điều khiển
            </Button>
          </Link>
          <Link to="/games" className="block">
            <Button variant="secondary" size="lg" className="w-full justify-start">
              <Gamepad2 className="h-4 w-4" aria-hidden="true" />
              Tiếp tục mua sắm
            </Button>
          </Link>

          <div className="mt-2 flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-soft text-green">
              <Headset className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 text-xs leading-relaxed text-text-muted">
              <p className="font-semibold text-text">Cần hỗ trợ?</p>
              <p className="mt-0.5">
                Chưa nhận được vật phẩm?{" "}
                <Link to="/messages" className="font-semibold text-yellow hover:underline">
                  Nhắn cho đội hỗ trợ
                </Link>{" "}
                — có mặt 24/7.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
