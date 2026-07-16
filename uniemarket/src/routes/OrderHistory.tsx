import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Receipt, Package } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAuth } from "@/components/account/RequireAuth";
import { SetupNotice } from "@/components/SetupNotice";
import {
  WorkOrderStatusBadge,
  WORK_STATUS_META,
  WORK_STATUS_ORDER,
} from "@/components/work/orderStatusMeta";
import { listMyOrders } from "@/lib/db/orders";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatPrice, relativeTime } from "@/lib/format";
import type { DbOrderStatus } from "@/types/db";
import { cn } from "@/lib/utils";

type Filter = "all" | DbOrderStatus;

export function OrderHistory() {
  return (
    <RequireAuth>
      <OrderHistoryContent />
    </RequireAuth>
  );
}

function OrderHistoryContent() {
  const [filter, setFilter] = useState<Filter>("all");

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
    { value: "all", label: "Tất cả" },
    ...WORK_STATUS_ORDER.map((s) => ({ value: s, label: WORK_STATUS_META[s].label })),
  ];

  function countFor(value: Filter): number {
    return value === "all" ? orders.length : orders.filter((o) => o.status === value).length;
  }

  if (!isSupabaseConfigured) {
    return (
      <PageContainer className="py-10 sm:py-14">
        <SectionHeading eyebrow="Tài khoản" title="Lịch sử đơn hàng" />
        <div className="mt-6">
          <SetupNotice />
        </div>
      </PageContainer>
    );
  }

  if (ordersQuery.isPending) {
    return (
      <PageContainer className="py-10 sm:py-14">
        <SectionHeading eyebrow="Tài khoản" title="Lịch sử đơn hàng" />
        <Skeleton className="h-64 rounded-2xl" />
      </PageContainer>
    );
  }

  if (orders.length === 0) {
    return (
      <PageContainer className="py-10 sm:py-14">
        <SectionHeading eyebrow="Tài khoản" title="Lịch sử đơn hàng" />
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-text-subtle">
            <Receipt className="h-7 w-7" aria-hidden />
          </div>
          <h3 className="mt-4 font-heading text-xl font-semibold text-text">Bạn chưa có đơn hàng nào</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
            Khi bạn đặt hàng, toàn bộ đơn và tiến trình xử lý sẽ được lưu tại đây để tra cứu.
          </p>
          <Link to="/games" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-6")}>
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
        description="Theo dõi trạng thái và xem chi tiết các đơn đã đặt."
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
                <WorkOrderStatusBadge status={o.status} />
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
            Không có đơn nào ở trạng thái này
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
            Thử chọn một bộ lọc khác để xem các đơn hàng của bạn.
          </p>
        </div>
      )}
    </PageContainer>
  );
}
