// /work/orders — bảng đơn hàng khu làm việc.
// Admin: mọi đơn + lọc theo Seller; Seller: chỉ đơn được giao (RLS lo, vẫn truyền
// assignedTo cho cache key rõ ràng). Lọc trạng thái bằng pill (kèm đếm),
// tìm theo mã đơn.
import { isAdminOrManager } from "@/lib/roles";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Inbox, Search, Trash2, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm";
import { SetupNotice } from "@/components/SetupNotice";
import { WorkOrderStatusBadge, WORK_STATUS_ORDER } from "@/components/work/orderStatusMeta";
import { useOrdersRealtime } from "@/components/work/useOrdersRealtime";
import { countItems, listItemsForOrders } from "@/components/work/workData";
import { listWorkOrders, deleteOrders, deleteAllOrders } from "@/lib/db/orders";
import { getSettings } from "@/lib/db/settings";
import { listCtvs } from "@/lib/db/profiles";
import { formatPrice, relativeTime } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { orderDisplayStatus } from "@/types/db";
import type { DbOrderStatus } from "@/types/db";
import { cn } from "@/lib/utils";
import { usePick, useT } from "@/i18n";

const STR = {
  vi: {
    title: "Đơn hàng",
    subtitleAdmin: "Toàn bộ đơn hàng — lọc theo trạng thái, Seller hoặc tìm theo mã đơn.",
    subtitleCtv: "Các đơn được giao cho bạn — lọc theo trạng thái hoặc tìm theo mã đơn.",
    loadError: (msg: string) => `Không tải được danh sách đơn. ${msg}`,
    retry: "Thử lại",
    all: (n: number) => `Tất cả (${n})`,
    searchPlaceholder: "Tìm mã đơn (UM-...)",
    searchAria: "Tìm theo mã đơn",
    ctvFilterAria: "Lọc theo Seller",
    allCtv: "Mọi Seller",
    emptyNone: "Chưa có đơn hàng nào.",
    emptyNoMatch: "Không tìm thấy đơn nào khớp bộ lọc.",
    colCode: "Mã đơn",
    colCreated: "Tạo lúc",
    colCustomer: "Khách",
    colItems: "Món",
    colTotal: "Tổng",
    colStatus: "Trạng thái",
    colCtv: "Seller",
    open: "Mở",
    refundRequest: "Yêu cầu hoàn tiền",
    refundTag: "Yêu cầu hoàn tiền",
    cancelTag: "Yêu cầu hủy",
    selectAll: "Chọn tất cả",
    deleteOrder: "Xóa đơn",
    deleteSelected: (n: number) => `Xóa đã chọn (${n})`,
    deleteAll: "Xóa tất cả lịch sử",
    deletedN: (n: number) => `Đã xóa ${n} đơn.`,
    confirmDelSelTitle: "Xóa các đơn đã chọn?",
    confirmDelSelMsg: (n: number) =>
      `${n} đơn cùng toàn bộ lịch sử, tin nhắn, minh chứng sẽ bị xóa vĩnh viễn. Không thể hoàn tác.`,
    confirmDelOneTitle: (code: string) => `Xóa đơn ${code}?`,
    confirmDelOneMsg: "Đơn cùng toàn bộ lịch sử/tin nhắn sẽ bị xóa vĩnh viễn. Không thể hoàn tác.",
    confirmDelAllTitle: "Xóa TẤT CẢ đơn hàng?",
    confirmDelAllMsg:
      "Toàn bộ đơn hàng cùng lịch sử, tin nhắn, minh chứng sẽ bị xóa vĩnh viễn. Đây là thao tác nguy hiểm, không thể hoàn tác.",
    confirmDelBtn: "Xóa",
  },
  en: {
    title: "Orders",
    subtitleAdmin: "All orders — filter by status, seller, or search by order code.",
    subtitleCtv: "Orders assigned to you — filter by status or search by order code.",
    loadError: (msg: string) => `Couldn't load the order list. ${msg}`,
    retry: "Try again",
    all: (n: number) => `All (${n})`,
    searchPlaceholder: "Search order code (UM-...)",
    searchAria: "Search by order code",
    ctvFilterAria: "Filter by seller",
    allCtv: "All sellers",
    emptyNone: "No orders yet.",
    emptyNoMatch: "No orders match the filters.",
    colCode: "Order code",
    colCreated: "Created",
    colCustomer: "Customer",
    colItems: "Items",
    colTotal: "Total",
    colStatus: "Status",
    colCtv: "Seller",
    open: "Open",
    refundRequest: "Refund request",
    refundTag: "Refund requested",
    cancelTag: "Cancellation requested",
    selectAll: "Select all",
    deleteOrder: "Delete order",
    deleteSelected: (n: number) => `Delete selected (${n})`,
    deleteAll: "Delete all history",
    deletedN: (n: number) => `Deleted ${n} order${n === 1 ? "" : "s"}.`,
    confirmDelSelTitle: "Delete selected orders?",
    confirmDelSelMsg: (n: number) =>
      `${n} order${n === 1 ? "" : "s"} plus all their history, messages, and proofs will be permanently deleted. This cannot be undone.`,
    confirmDelOneTitle: (code: string) => `Delete order ${code}?`,
    confirmDelOneMsg: "The order and all its history/messages will be permanently deleted. This cannot be undone.",
    confirmDelAllTitle: "Delete ALL orders?",
    confirmDelAllMsg:
      "Every order plus all history, messages, and proofs will be permanently deleted. This is a dangerous action and cannot be undone.",
    confirmDelBtn: "Delete",
  },
};

/** /work/orders — danh sách đơn (admin: tất cả; Seller: đơn được giao). */
export function WorkOrders() {
  const user = useAuthStore((state) => state.user);
  const t = usePick(STR);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold text-text">{t.title}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {isAdminOrManager(user?.role) ? t.subtitleAdmin : t.subtitleCtv}
        </p>
      </header>

      {!isSupabaseConfigured ? (
        <SetupNotice />
      ) : user ? (
        <OrdersTable isAdmin={isAdminOrManager(user.role)} userId={user.id} />
      ) : null}
    </div>
  );
}

function OrdersTable({ isAdmin, userId }: { isAdmin: boolean; userId: string }) {
  useOrdersRealtime();
  const t = usePick(STR);
  const s = useT();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  // CHỈ admin được xóa đơn (manager thì không).
  const canDelete = useAuthStore((state) => state.user?.role === "admin");

  const [statusFilter, setStatusFilter] = useState<DbOrderStatus | "all" | "refund_request">("all");
  const [search, setSearch] = useState("");
  const [ctvFilter, setCtvFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteOrders(ids),
    onSuccess: (n) => {
      toast.success(t.deletedN(n));
      setSelected(new Set());
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const deleteAllMutation = useMutation({
    mutationFn: () => deleteAllOrders(),
    onSuccess: (n) => {
      toast.success(t.deletedN(n));
      setSelected(new Set());
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const deleting = deleteMutation.isPending || deleteAllMutation.isPending;

  // Trạng thái đơn được phép xóa (admin cấu hình trong Settings).
  const settingsQuery = useQuery({ queryKey: ["settings"], queryFn: getSettings, enabled: canDelete });
  const deletableSet = useMemo(() => {
    const raw = settingsQuery.data?.deletable_order_statuses;
    return new Set(
      Array.isArray(raw) ? (raw as string[]) : ["paid", "completed", "cancelled", "refunded"],
    );
  }, [settingsQuery.data]);

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
          {t.loadError((ordersQuery.error as Error).message)}
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => void ordersQuery.refetch()}>
          {t.retry}
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

  const refundCount = orders.filter(
    (o) => o.refund_requested_at != null && o.status !== "refunded" && o.status !== "cancelled",
  ).length;

  const normalizedSearch = search.trim().toUpperCase();
  const filtered = orders.filter((order) => {
    if (statusFilter === "refund_request") {
      if (order.refund_requested_at == null || order.status === "refunded" || order.status === "cancelled")
        return false;
    } else if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }
    if (isAdmin && ctvFilter !== "all" && order.assigned_ctv !== ctvFilter) return false;
    if (normalizedSearch && !order.order_code.toUpperCase().includes(normalizedSearch)) return false;
    return true;
  });

  const itemsMap = itemsQuery.data ?? {};

  // Chọn nhiều để xóa (chỉ admin). Chỉ tính các đơn ở trạng thái được phép xóa.
  const canDeleteOrder = (status: string) => deletableSet.has(status);
  const filteredIds = filtered.filter((o) => canDeleteOrder(o.status)).map((o) => o.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
  const someSelected = filteredIds.some((id) => selected.has(id));
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filteredIds));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  async function handleDeleteOne(id: string, code: string) {
    const r = await confirm({
      title: t.confirmDelOneTitle(code),
      message: t.confirmDelOneMsg,
      confirmText: t.confirmDelBtn,
      tone: "danger",
    });
    if (r.ok) deleteMutation.mutate([id]);
  }
  async function handleDeleteSelected() {
    const ids = [...selected];
    if (ids.length === 0) return;
    const r = await confirm({
      title: t.confirmDelSelTitle,
      message: t.confirmDelSelMsg(ids.length),
      confirmText: t.confirmDelBtn,
      tone: "danger",
    });
    if (r.ok) deleteMutation.mutate(ids);
  }
  async function handleDeleteAll() {
    const r = await confirm({
      title: t.confirmDelAllTitle,
      message: t.confirmDelAllMsg,
      confirmText: t.confirmDelBtn,
      tone: "danger",
    });
    if (r.ok) deleteAllMutation.mutate();
  }

  return (
    <div className="space-y-4">
      {/* Pill lọc trạng thái */}
      <div className="flex flex-wrap gap-2">
        <FilterPill
          active={statusFilter === "all"}
          label={t.all(orders.length)}
          onClick={() => setStatusFilter("all")}
        />
        {WORK_STATUS_ORDER.map((status) => (
          <FilterPill
            key={status}
            active={statusFilter === status}
            label={`${s.status[status]} (${counts.get(status) ?? 0})`}
            onClick={() => setStatusFilter(status)}
          />
        ))}
        <FilterPill
          active={statusFilter === "refund_request"}
          label={`${t.refundRequest} (${refundCount})`}
          onClick={() => setStatusFilter("refund_request")}
          tone="danger"
        />
      </div>

      {/* Tìm kiếm + lọc Seller */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.searchPlaceholder}
            className="pl-9 font-mono uppercase placeholder:font-body placeholder:normal-case"
            aria-label={t.searchAria}
          />
        </div>
        {isAdmin ? (
          <div className="w-full max-w-[220px]">
            <Select
              value={ctvFilter}
              onChange={(event) => setCtvFilter(event.target.value)}
              aria-label={t.ctvFilterAria}
            >
              <option value="all">{t.allCtv}</option>
              {(ctvsQuery.data ?? []).map((ctv) => (
                <option key={ctv.id} value={ctv.id}>
                  {ctv.display_name ?? ctv.username}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {/* Xóa đơn — chỉ admin */}
        {canDelete ? (
          <div className="ml-auto flex items-center gap-2">
            {selected.size > 0 ? (
              <Button
                variant="danger"
                size="sm"
                disabled={deleting}
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {t.deleteSelected(selected.size)}
              </Button>
            ) : null}
            {orders.length > 0 ? (
              <Button variant="secondary" size="sm" disabled={deleting} onClick={handleDeleteAll}>
                <Trash2 className="h-4 w-4 text-danger" aria-hidden />
                {t.deleteAll}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Bảng */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface px-5 py-12 text-center">
          <Inbox className="mx-auto h-8 w-8 text-text-subtle" aria-hidden />
          <p className="mt-2 text-sm text-text-muted">
            {orders.length === 0 ? t.emptyNone : t.emptyNoMatch}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-text-subtle">
                {canDelete ? (
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = !allSelected && someSelected;
                      }}
                      onChange={toggleAll}
                      aria-label={t.selectAll}
                      className="h-4 w-4 cursor-pointer rounded border-border-strong bg-surface-2 accent-yellow"
                    />
                  </th>
                ) : null}
                <th className="px-4 py-3 font-semibold">{t.colCode}</th>
                <th className="px-4 py-3 font-semibold">{t.colCreated}</th>
                <th className="px-4 py-3 font-semibold">{t.colCustomer}</th>
                <th className="px-4 py-3 text-right font-semibold">{t.colItems}</th>
                <th className="px-4 py-3 text-right font-semibold">{t.colTotal}</th>
                <th className="px-4 py-3 font-semibold">{t.colStatus}</th>
                {isAdmin ? <th className="px-4 py-3 font-semibold">{t.colCtv}</th> : null}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className={cn(
                    "transition-colors hover:bg-surface-2",
                    selected.has(order.id) && "bg-yellow-soft/40",
                  )}
                >
                  {canDelete ? (
                    <td className="px-4 py-3">
                      {canDeleteOrder(order.status) ? (
                        <input
                          type="checkbox"
                          checked={selected.has(order.id)}
                          onChange={() => toggleOne(order.id)}
                          aria-label={`${t.deleteOrder} ${order.order_code}`}
                          className="h-4 w-4 cursor-pointer rounded border-border-strong bg-surface-2 accent-yellow"
                        />
                      ) : null}
                    </td>
                  ) : null}
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
                    <div className="flex flex-wrap items-center gap-1.5">
                      <WorkOrderStatusBadge status={orderDisplayStatus(order)} />
                      {order.refund_requested_at &&
                      order.status !== "refunded" &&
                      order.status !== "cancelled" ? (
                        <span className="inline-flex items-center rounded-full border border-danger bg-danger-soft px-2 py-0.5 text-[10px] font-semibold text-danger">
                          {t.refundTag}
                        </span>
                      ) : null}
                      {order.cancel_requested_at &&
                      order.status !== "refunded" &&
                      order.status !== "cancelled" ? (
                        <span className="inline-flex items-center rounded-full border border-yellow bg-yellow-soft px-2 py-0.5 text-[10px] font-semibold text-yellow">
                          {t.cancelTag}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  {isAdmin ? (
                    <td className="max-w-[140px] truncate px-4 py-3 text-text-muted">
                      {order.assigned_ctv
                        ? ctvNameById.get(order.assigned_ctv) ?? "Seller"
                        : "—"}
                    </td>
                  ) : null}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/work/orders/${order.id}`}
                        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                      >
                        {t.open}
                      </Link>
                      {canDelete && canDeleteOrder(order.status) ? (
                        <button
                          type="button"
                          title={t.deleteOrder}
                          aria-label={`${t.deleteOrder} ${order.order_code}`}
                          disabled={deleting}
                          onClick={() => handleDeleteOne(order.id, order.order_code)}
                          className="rounded-md p-1.5 text-text-subtle transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </button>
                      ) : null}
                    </div>
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
  tone = "default",
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  const activeCls =
    tone === "danger"
      ? "border-danger bg-danger-soft text-danger"
      : "border-yellow bg-yellow-soft text-yellow";
  const idleCls =
    tone === "danger"
      ? "border-border-strong bg-surface text-text-muted hover:border-danger hover:text-danger"
      : "border-border-strong bg-surface text-text-muted hover:bg-surface-2 hover:text-text";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow",
        active ? activeCls : idleCls,
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
