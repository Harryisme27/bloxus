// /work/orders — bảng đơn hàng khu làm việc.
// Admin: mọi đơn + lọc theo CTV; CTV: chỉ đơn được giao (RLS lo, vẫn truyền
// assignedTo cho cache key rõ ràng). Lọc trạng thái bằng pill (kèm đếm),
// tìm theo mã đơn.
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Inbox, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SetupNotice } from "@/components/SetupNotice";
import { WorkOrderStatusBadge, WORK_STATUS_META, WORK_STATUS_ORDER } from "@/components/work/orderStatusMeta";
import { useOrdersRealtime } from "@/components/work/useOrdersRealtime";
import { countItems, listItemsForOrders } from "@/components/work/workData";
import { listWorkOrders } from "@/lib/db/orders";
import { listCtvs } from "@/lib/db/profiles";
import { formatPrice, relativeTime } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { orderDisplayStatus } from "@/types/db";
import type { DbOrderStatus } from "@/types/db";
import { cn } from "@/lib/utils";

/** /work/orders — danh sách đơn (admin: tất cả; CTV: đơn được giao). */
export function WorkOrders() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold text-text">Đơn hàng</h1>
        <p className="mt-1 text-sm text-text-muted">
          {user?.role === "admin"
            ? "Toàn bộ đơn hàng — lọc theo trạng thái, CTV hoặc tìm theo mã đơn."
            : "Các đơn được giao cho bạn — lọc theo trạng thái hoặc tìm theo mã đơn."}
        </p>
      </header>

      {!isSupabaseConfigured ? (
        <SetupNotice />
      ) : user ? (
        <OrdersTable isAdmin={user.role === "admin"} userId={user.id} />
      ) : null}
    </div>
  );
}

function OrdersTable({ isAdmin, userId }: { isAdmin: boolean; userId: string }) {
  useOrdersRealtime();

  const [statusFilter, setStatusFilter] = useState<DbOrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [ctvFilter, setCtvFilter] = useState<string>("all");

  const ordersQuery = useQuery({
    queryKey: isAdmin ? ["work-orders", "all"] : ["work-orders", { assignedTo: userId }],
    queryFn: () => (isAdmin ? listWorkOrders() : listWorkOrders({ assignedTo: userId })),
  });

  const ctvsQuery = useQuery({
    queryKey: ["ctvs"],
    queryFn: listCtvs,
    enabled: isAdmin,
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
      <div className="space-y-3">
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (ordersQuery.isError) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-text-muted">
          Không tải được danh sách đơn. {(ordersQuery.error as Error).message}
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => void ordersQuery.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  // Đếm theo trạng thái cho pill (trên danh sách đầy đủ, trước khi lọc).
  const counts = new Map<DbOrderStatus, number>();
  for (const order of orders) {
    counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
  }

  const ctvNameById = new Map<string, string>();
  for (const ctv of ctvsQuery.data ?? []) {
    ctvNameById.set(ctv.id, ctv.display_name ?? ctv.username);
  }

  const normalizedSearch = search.trim().toUpperCase();
  const filtered = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (isAdmin && ctvFilter !== "all" && order.assigned_ctv !== ctvFilter) return false;
    if (normalizedSearch && !order.order_code.toUpperCase().includes(normalizedSearch)) return false;
    return true;
  });

  const itemsMap = itemsQuery.data ?? {};

  return (
    <div className="space-y-4">
      {/* Pill lọc trạng thái */}
      <div className="flex flex-wrap gap-2">
        <FilterPill
          active={statusFilter === "all"}
          label={`Tất cả (${orders.length})`}
          onClick={() => setStatusFilter("all")}
        />
        {WORK_STATUS_ORDER.map((status) => (
          <FilterPill
            key={status}
            active={statusFilter === status}
            label={`${WORK_STATUS_META[status].label} (${counts.get(status) ?? 0})`}
            onClick={() => setStatusFilter(status)}
          />
        ))}
      </div>

      {/* Tìm kiếm + lọc CTV */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm mã đơn (UM-...)"
            className="pl-9 font-mono uppercase placeholder:font-body placeholder:normal-case"
            aria-label="Tìm theo mã đơn"
          />
        </div>
        {isAdmin ? (
          <div className="w-full max-w-[220px]">
            <Select
              value={ctvFilter}
              onChange={(event) => setCtvFilter(event.target.value)}
              aria-label="Lọc theo CTV"
            >
              <option value="all">Mọi CTV</option>
              {(ctvsQuery.data ?? []).map((ctv) => (
                <option key={ctv.id} value={ctv.id}>
                  {ctv.display_name ?? ctv.username}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>

      {/* Bảng */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface px-5 py-12 text-center">
          <Inbox className="mx-auto h-8 w-8 text-text-subtle" aria-hidden />
          <p className="mt-2 text-sm text-text-muted">
            {orders.length === 0
              ? "Chưa có đơn hàng nào."
              : "Không tìm thấy đơn nào khớp bộ lọc."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-text-subtle">
                <th className="px-4 py-3 font-semibold">Mã đơn</th>
                <th className="px-4 py-3 font-semibold">Tạo lúc</th>
                <th className="px-4 py-3 font-semibold">Khách</th>
                <th className="px-4 py-3 text-right font-semibold">Món</th>
                <th className="px-4 py-3 text-right font-semibold">Tổng</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                {isAdmin ? <th className="px-4 py-3 font-semibold">CTV</th> : null}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <Link
                      to={`/work/orders/${order.id}`}
                      className="font-mono font-bold text-text hover:text-yellow"
                    >
                      {order.order_code}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                    {relativeTime(order.created_at)}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-text-muted">
                    {order.contact_value ?? "—"}
                  </td>
                  <td className="tabular-nums-mono px-4 py-3 text-right text-text-muted">
                    {itemsQuery.isPending ? "…" : countItems(itemsMap[order.id])}
                  </td>
                  <td className="tabular-nums-mono whitespace-nowrap px-4 py-3 text-right font-semibold text-text">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <WorkOrderStatusBadge status={orderDisplayStatus(order)} />
                  </td>
                  {isAdmin ? (
                    <td className="max-w-[140px] truncate px-4 py-3 text-text-muted">
                      {order.assigned_ctv
                        ? ctvNameById.get(order.assigned_ctv) ?? "CTV"
                        : "—"}
                    </td>
                  ) : null}
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/work/orders/${order.id}`}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                    >
                      Mở
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow",
        active
          ? "border-yellow bg-yellow-soft text-yellow"
          : "border-border-strong bg-surface text-text-muted hover:bg-surface-2 hover:text-text",
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
