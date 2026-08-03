import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingBag, Receipt, Package, XCircle } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAuth } from "@/components/account/RequireAuth";
import { SetupNotice } from "@/components/SetupNotice";
import {
  WorkOrderStatusBadge,
  WORK_STATUS_ORDER,
} from "@/components/work/orderStatusMeta";
import { cancelOrder, listMyOrders } from "@/lib/db/orders";
import { useConfirm } from "@/components/ui/confirm";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatPrice, relativeTime } from "@/lib/format";
import { orderDisplayStatus } from "@/types/db";
import type { DbOrderStatus } from "@/types/db";
import { cn } from "@/lib/utils";
import { usePick, useT } from "@/i18n";

const STR = {
  vi: {
    eyebrow: "Tài khoản",
    title: "Lịch sử đơn hàng",
    description: "Theo dõi trạng thái và xem chi tiết các đơn đã đặt.",
    all: "Tất cả",
    emptyTitle: "Bạn chưa có đơn hàng nào",
    emptyDesc: "Khi bạn đặt hàng, toàn bộ đơn và tiến trình xử lý sẽ được lưu tại đây để tra cứu.",
    startShopping: "Bắt đầu mua sắm",
    noneInStatusTitle: "Không có đơn nào ở trạng thái này",
    noneInStatusDesc: "Thử chọn một bộ lọc khác để xem các đơn hàng của bạn.",
    cancelQuick: "Hủy",
    cancelTitle: "Hủy đơn hàng?",
    cancelMessage: (code: string) => `Đơn ${code} đang chờ thanh toán sẽ bị hủy. Kho sẽ được hoàn lại.`,
    cancelConfirm: "Hủy đơn",
    cancelled: (code: string) => `Đã hủy đơn ${code}.`,
  },
  en: {
    eyebrow: "Account",
    title: "Order history",
    description: "Track the status and view the details of your orders.",
    all: "All",
    emptyTitle: "You don't have any orders yet",
    emptyDesc:
      "When you place an order, all your orders and their progress are saved here for reference.",
    startShopping: "Start shopping",
    noneInStatusTitle: "No orders in this status",
    noneInStatusDesc: "Try choosing a different filter to see your orders.",
    cancelQuick: "Cancel",
    cancelTitle: "Cancel this order?",
    cancelMessage: (code: string) =>
      `Order ${code} is awaiting payment and will be cancelled. Stock will be restored.`,
    cancelConfirm: "Cancel order",
    cancelled: (code: string) => `Order ${code} cancelled.`,
  },
};

type Filter = "all" | DbOrderStatus;

export function OrderHistory() {
  return (
    <RequireAuth>
      <OrderHistoryContent />
    </RequireAuth>
  );
}

function OrderHistoryContent() {
  const t = usePick(STR);
  const s = useT();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");

  // Hủy nhanh đơn chờ thanh toán ngay trên danh sách.
  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: (order) => {
      toast.success(t.cancelled(order.order_code));
      void queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  async function quickCancel(orderId: string, orderCode: string) {
    const r = await confirm({
      title: t.cancelTitle,
      message: t.cancelMessage(orderCode),
      confirmText: t.cancelConfirm,
      tone: "danger",
    });
    if (r.ok) cancelMutation.mutate(orderId);
  }

  const ordersQuery = useQuery({
    queryKey: ["my-orders"],
    queryFn: listMyOrders,
    enabled: isSupabaseConfigured,
  });
  const orders = ordersQuery.data ?? [];

  const filtered = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: t.all },
    ...WORK_STATUS_ORDER.map((status) => ({ value: status, label: s.status[status] })),
  ];

  function countFor(value: Filter): number {
    return value === "all" ? orders.length : orders.filter((o) => o.status === value).length;
  }

  if (!isSupabaseConfigured) {
    return (
      <PageContainer className="py-10 sm:py-14">
        <SectionHeading eyebrow={t.eyebrow} title={t.title} />
        <div className="mt-6">
          <SetupNotice />
        </div>
      </PageContainer>
    );
  }

  if (ordersQuery.isPending) {
    return (
      <PageContainer className="py-10 sm:py-14">
        <SectionHeading eyebrow={t.eyebrow} title={t.title} />
        <Skeleton className="h-64 rounded-2xl" />
      </PageContainer>
    );
  }

  if (orders.length === 0) {
    return (
      <PageContainer className="py-10 sm:py-14">
        <SectionHeading eyebrow={t.eyebrow} title={t.title} />
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-text-subtle">
            <Receipt className="h-7 w-7" aria-hidden />
          </div>
          <h3 className="mt-4 font-heading text-xl font-semibold text-text">{t.emptyTitle}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">{t.emptyDesc}</p>
          <Link to="/games" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-6")}>
            <ShoppingBag className="h-4 w-4" aria-hidden />
            {t.startShopping}
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-10 sm:py-14">
      <SectionHeading
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
      />

      {/* Status filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((option) => {
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
        <div className="overflow-hidden rounded-2xl border border-border">
          {filtered.map((o) => (
            <Link
              key={o.id}
              to={`/orders/${o.id}`}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2"
            >
              <div className="min-w-0">
                <span className="tabular-nums-mono font-semibold text-text">{o.order_code}</span>
                <span className="ml-2 text-xs text-text-subtle">{relativeTime(o.created_at)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular-nums-mono text-sm font-medium text-yellow">
                  {formatPrice(o.total)}
                </span>
                <WorkOrderStatusBadge status={orderDisplayStatus(o)} />
                {/* Hủy nhanh: chỉ đơn đang chờ thanh toán. */}
                {orderDisplayStatus(o) === "pending_payment" ? (
                  <button
                    type="button"
                    disabled={cancelMutation.isPending}
                    onClick={(e) => {
                      // Đừng để click lan sang Link mở trang chi tiết.
                      e.preventDefault();
                      e.stopPropagation();
                      void quickCancel(o.id, o.order_code);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-border-strong px-2.5 py-1 text-xs font-semibold text-danger transition-colors hover:border-danger hover:bg-danger-soft disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" aria-hidden />
                    {t.cancelQuick}
                  </button>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-text-subtle">
            <Package className="h-6 w-6" aria-hidden />
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold text-text">
            {t.noneInStatusTitle}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">{t.noneInStatusDesc}</p>
        </div>
      )}
    </PageContainer>
  );
}
