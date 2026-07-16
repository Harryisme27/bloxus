import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Receipt, Package } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { buttonVariants } from "@/components/ui/button";
import { OrdersTable } from "@/components/account/OrdersTable";
import { OrderDetailDialog } from "@/components/account/OrderDetailDialog";
import { ORDER_STATUS_META } from "@/components/account/orderMeta";
import { RequireAuth } from "@/components/account/RequireAuth";
import { useReorder } from "@/components/account/useReorder";
import { useAuthStore } from "@/store/authStore";
import { useOrdersStore } from "@/store/ordersStore";
import type { Order, OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

type Filter = "all" | OrderStatus;

// Only statuses actually reachable in the demo checkout flow are offered.
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "paid", label: ORDER_STATUS_META.paid.label },
  { value: "delivered", label: ORDER_STATUS_META.delivered.label },
  { value: "failed", label: ORDER_STATUS_META.failed.label },
  { value: "cancelled", label: ORDER_STATUS_META.cancelled.label },
];

export function OrderHistory() {
  return (
    <RequireAuth>
      <OrderHistoryContent />
    </RequireAuth>
  );
}

function OrderHistoryContent() {
  const user = useAuthStore((state) => state.user)!;
  const orders = useOrdersStore((state) => state.orders);
  const reorder = useReorder();

  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [open, setOpen] = useState(false);

  // Đơn "guest" là đơn đặt trước khi đăng nhập trên cùng trình duyệt này —
  // trong bản demo local chúng vẫn thuộc về người dùng hiện tại.
  const myOrders = orders.filter(
    (order) => order.userId === user.id || order.userId === "guest",
  );
  const filtered =
    filter === "all" ? myOrders : myOrders.filter((order) => order.status === filter);

  function countFor(value: Filter): number {
    return value === "all"
      ? myOrders.length
      : myOrders.filter((order) => order.status === value).length;
  }

  function handleSelect(order: Order) {
    setSelected(order);
    setOpen(true);
  }

  // No orders at all → full empty state.
  if (myOrders.length === 0) {
    return (
      <PageContainer className="py-10 sm:py-14">
        <SectionHeading eyebrow="Tài khoản" title="Lịch sử đơn hàng" />
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-text-subtle">
            <Receipt className="h-7 w-7" aria-hidden />
          </div>
          <h3 className="mt-4 font-heading text-xl font-semibold text-text">Bạn chưa có đơn hàng nào</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
            Khi bạn đặt mua vật phẩm, toàn bộ đơn hàng và tiến trình giao sẽ được lưu tại đây để tra cứu.
          </p>
          <Link
            to="/games"
            className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-6")}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            Bắt đầu mua sắm
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-10 sm:py-14">
      <SectionHeading
        eyebrow="Tài khoản"
        title="Lịch sử đơn hàng"
        description="Theo dõi trạng thái, xem chi tiết và mua lại các đơn đã đặt. Bản demo — không có thanh toán thật."
      />

      {/* Status filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((option) => {
          const isActive = filter === option.value;
          const count = countFor(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-yellow bg-yellow-soft text-yellow"
                  : "border-border-strong bg-surface text-text-muted hover:border-yellow hover:text-text",
              )}
            >
              {option.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  isActive ? "bg-yellow text-text-on-yellow" : "bg-surface-2 text-text-subtle",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <OrdersTable orders={filtered} onSelect={handleSelect} onReorder={reorder} />
      ) : (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-text-subtle">
            <Package className="h-6 w-6" aria-hidden />
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold text-text">
            Không có đơn nào ở trạng thái này
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
            Thử chọn một bộ lọc khác để xem các đơn hàng của bạn.
          </p>
        </div>
      )}

      <OrderDetailDialog order={selected} open={open} onOpenChange={setOpen} onReorder={reorder} />
    </PageContainer>
  );
}
