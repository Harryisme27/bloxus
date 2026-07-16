// /work — dashboard khu làm việc, tách theo vai trò:
// - Admin: 4 thẻ thống kê + hàng đợi giao đơn (paid chưa có CTV) + strip
//   nhắc đơn chờ xác nhận tiền -> /work/payments.
// - CTV: "Đơn của tôi" nhóm Mới giao / Đang thực hiện / Hoàn thành gần đây.
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  BadgeDollarSign,
  Clock,
  Inbox,
  Loader,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SetupNotice } from "@/components/SetupNotice";
import { AssignCtvDialog } from "@/components/work/AssignCtvDialog";
import { ContactChip } from "@/components/work/CopyChip";
import { WorkOrderStatusBadge } from "@/components/work/orderStatusMeta";
import { useOrdersRealtime } from "@/components/work/useOrdersRealtime";
import { listItemsForOrders, summarizeItems } from "@/components/work/workData";
import { listWorkOrders } from "@/lib/db/orders";
import { formatPrice, relativeTime } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { orderDisplayStatus } from "@/types/db";
import type { OrderRow } from "@/types/db";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;

/** /work — dashboard khu làm việc (hàng đợi thanh toán, đơn chờ giao, thống kê). */
export function WorkDashboard() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold text-text">Bảng làm việc</h1>
        <p className="mt-1 text-sm text-text-muted">
          {isAdmin
            ? "Tổng quan hàng đợi: xác nhận tiền, giao đơn cho CTV và tiến độ hôm nay."
            : "Các đơn được giao cho bạn — mở đơn để xem chi tiết và chat với khách."}
        </p>
      </header>

      {!isSupabaseConfigured ? (
        <SetupNotice />
      ) : isAdmin ? (
        <AdminDashboard />
      ) : user ? (
        <CtvDashboard userId={user.id} />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

function AdminDashboard() {
  useOrdersRealtime();
  const [assignTarget, setAssignTarget] = useState<Pick<OrderRow, "id" | "order_code"> | null>(
    null,
  );

  const ordersQuery = useQuery({
    queryKey: ["work-orders", "all"],
    queryFn: () => listWorkOrders(),
  });

  if (ordersQuery.isPending) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (ordersQuery.isError) {
    return (
      <QueryErrorBlock
        message={(ordersQuery.error as Error).message}
        onRetry={() => void ordersQuery.refetch()}
      />
    );
  }

  const orders = ordersQuery.data;
  const pendingPayment = orders.filter((o) => o.status === "pending_payment");
  const unassigned = orders
    .filter((o) => o.status === "paid" && !o.assigned_ctv)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const inProgress = orders.filter((o) => o.status === "in_progress");
  const today = new Date().toDateString();
  const completedToday = orders.filter(
    (o) => o.status === "completed" && o.completed_at && new Date(o.completed_at).toDateString() === today,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BadgeDollarSign}
          label="Chờ xác nhận tiền"
          value={pendingPayment.length}
          to="/work/payments"
          accent={pendingPayment.length > 0}
        />
        <StatCard icon={UserPlus} label="Chờ giao CTV" value={unassigned.length} to="/work/orders" />
        <StatCard icon={Loader} label="Đang thực hiện" value={inProgress.length} to="/work/orders" />
        <StatCard icon={BadgeCheck} label="Hoàn thành hôm nay" value={completedToday.length} />
      </div>

      {pendingPayment.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-yellow bg-yellow-soft px-4 py-3">
          <p className="text-sm font-semibold text-yellow">
            <Clock className="mr-1.5 inline h-4 w-4" aria-hidden />
            {pendingPayment.length} đơn đang chờ xác nhận thanh toán.
          </p>
          <Link to="/work/payments" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
            Đối chiếu ngay
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      ) : null}

      <section className="rounded-2xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-heading text-lg font-semibold text-text">Hàng đợi xử lý</h2>
          <span className="text-sm text-text-muted">
            {unassigned.length} đơn đã thanh toán, chưa giao CTV
          </span>
        </div>

        {unassigned.length === 0 ? (
          <EmptyBlock text="Không có đơn nào chờ giao — hàng đợi sạch bong." />
        ) : (
          <ul className="divide-y divide-border">
            {unassigned.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/work/orders/${order.id}`}
                      className="font-mono text-sm font-bold text-text hover:text-yellow"
                    >
                      {order.order_code}
                    </Link>
                    <WorkOrderStatusBadge status={orderDisplayStatus(order)} />
                    <span className="text-xs text-text-subtle">{relativeTime(order.created_at)}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="tabular-nums-mono text-sm font-semibold text-text">
                      {formatPrice(order.total)}
                    </span>
                    <ContactChip channel={order.contact_channel} value={order.contact_value} />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setAssignTarget({ id: order.id, order_code: order.order_code })}
                  >
                    <UserPlus className="h-4 w-4" aria-hidden />
                    Giao đơn
                  </Button>
                  <Link
                    to={`/work/orders/${order.id}`}
                    className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                  >
                    Mở
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AssignCtvDialog order={assignTarget} onClose={() => setAssignTarget(null)} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  to,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  to?: string;
  accent?: boolean;
}) {
  const body = (
    <div
      className={cn(
        "h-full rounded-2xl border bg-surface p-4 transition-colors",
        accent ? "border-yellow shadow-glow-amber" : "border-border",
        to && "hover:border-border-strong",
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
        <Icon className="h-4 w-4 text-yellow" aria-hidden />
        {label}
      </div>
      <p className="tabular-nums-mono mt-2 text-3xl font-bold text-text">{value}</p>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

// ---------------------------------------------------------------------------
// CTV
// ---------------------------------------------------------------------------

function CtvDashboard({ userId }: { userId: string }) {
  useOrdersRealtime();

  const ordersQuery = useQuery({
    queryKey: ["work-orders", { assignedTo: userId }],
    queryFn: () => listWorkOrders({ assignedTo: userId }),
  });

  const orders = ordersQuery.data ?? [];
  const orderIds = orders.map((o) => o.id);

  const itemsQuery = useQuery({
    queryKey: ["work-order-items", orderIds],
    queryFn: () => listItemsForOrders(orderIds),
    enabled: orderIds.length > 0,
  });

  if (ordersQuery.isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (ordersQuery.isError) {
    return (
      <QueryErrorBlock
        message={(ordersQuery.error as Error).message}
        onRetry={() => void ordersQuery.refetch()}
      />
    );
  }

  const now = Date.now();
  const inProgress = orders.filter((o) => o.status === "in_progress");
  const fresh = inProgress.filter(
    (o) => o.assigned_at && now - new Date(o.assigned_at).getTime() < DAY_MS,
  );
  const doing = inProgress.filter((o) => !fresh.includes(o));
  const doneRecent = orders
    .filter((o) => o.status === "completed")
    .sort((a, b) => (b.completed_at ?? b.updated_at).localeCompare(a.completed_at ?? a.updated_at))
    .slice(0, 6);

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
        <Inbox className="mx-auto h-10 w-10 text-text-subtle" aria-hidden />
        <p className="mt-3 font-heading text-lg font-semibold text-text">
          Chưa có đơn nào được giao cho bạn
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Khi admin giao đơn, đơn sẽ hiện ở đây kèm thông báo realtime.
        </p>
      </div>
    );
  }

  const itemsMap = itemsQuery.data ?? {};

  return (
    <div className="space-y-8">
      <CtvOrderGroup
        title="Mới giao"
        hint="Được giao trong 24 giờ qua"
        orders={fresh}
        itemsMap={itemsMap}
        highlight
        emptyText="Không có đơn mới trong 24 giờ qua."
      />
      <CtvOrderGroup
        title="Đang thực hiện"
        orders={doing}
        itemsMap={itemsMap}
        emptyText="Không còn đơn nào đang dang dở — quá đỉnh!"
      />
      <CtvOrderGroup
        title="Hoàn thành gần đây"
        orders={doneRecent}
        itemsMap={itemsMap}
        emptyText="Chưa có đơn hoàn thành nào gần đây."
      />
    </div>
  );
}

function CtvOrderGroup({
  title,
  hint,
  orders,
  itemsMap,
  highlight,
  emptyText,
}: {
  title: string;
  hint?: string;
  orders: OrderRow[];
  itemsMap: Record<string, { name: string; quantity: number }[]>;
  highlight?: boolean;
  emptyText: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="font-heading text-lg font-semibold text-text">{title}</h2>
        {hint ? <span className="text-xs text-text-subtle">{hint}</span> : null}
        <span className="text-sm text-text-muted">({orders.length})</span>
      </div>
      {orders.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-5 text-sm text-text-muted">
          {emptyText}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <article
              key={order.id}
              className={cn(
                "flex flex-col gap-2.5 rounded-2xl border bg-surface p-4",
                highlight ? "border-yellow shadow-glow-amber" : "border-border",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-text">{order.order_code}</span>
                <WorkOrderStatusBadge status={orderDisplayStatus(order)} />
              </div>
              <p className="line-clamp-2 text-sm text-text-muted">
                {summarizeItems(itemsMap[order.id])}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <ContactChip channel={order.contact_channel} value={order.contact_value} />
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-text-subtle">
                  {order.assigned_at
                    ? `Giao ${relativeTime(order.assigned_at)}`
                    : relativeTime(order.created_at)}
                </span>
                <Link
                  to={`/work/orders/${order.id}`}
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                >
                  Mở đơn
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Chung
// ---------------------------------------------------------------------------

function QueryErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-8 text-center">
      <p className="text-sm text-text-muted">Không tải được dữ liệu. {message}</p>
      <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
        Thử lại
      </Button>
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <Inbox className="mx-auto h-8 w-8 text-text-subtle" aria-hidden />
      <p className="mt-2 text-sm text-text-muted">{text}</p>
    </div>
  );
}
