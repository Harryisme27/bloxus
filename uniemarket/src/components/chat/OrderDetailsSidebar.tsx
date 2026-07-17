// Cột phải "Chi tiết đơn" của trang /messages (bố cục kiểu ZeusX, tông citrus).
// - Thread đơn hàng: ảnh + tên món, tổng tiền, trạng thái, hành động (Complete /
//   Refund) + link sang trang đơn. Dữ liệu đơn dùng chung queryKey ['order', id]
//   nên cập nhật realtime khi MessagePane bắt được thay đổi.
// - Thread nội bộ staff (không gắn đơn): panel "Trao đổi nội bộ" đơn giản.
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ExternalLink, Hash, ImageOff, RefreshCw } from "lucide-react";
import { getOrder } from "@/lib/db/orders";
import { formatPrice } from "@/lib/format";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkOrderStatusBadge } from "@/components/work/orderStatusMeta";
import { OrderActions } from "@/components/order/OrderActions";
import { orderDisplayStatus } from "@/types/db";
import { usePick } from "@/i18n";
import type { OrderItemRow, ThreadRow } from "@/types/db";

const STR = {
  vi: {
    internalChat: "Trao đổi nội bộ",
    teamChannel: "Kênh của đội ngũ Uniemarket",
    internalBody:
      "Đây là kênh liên lạc nội bộ giữa các thành viên đội ngũ — không gắn với đơn hàng cụ thể.",
    loadFailed: "Không tải được chi tiết đơn.",
    retry: "Thử lại",
    notFound: "Không tìm thấy đơn hàng.",
    orderDetails: "Chi tiết đơn",
    product: "Sản phẩm",
    order: "Đơn hàng",
    qtyPrefix: "SL",
    moreItems: (n: number) => ` · +${n} món khác`,
    total: "Tổng cộng",
    status: "Trạng thái",
    viewOrder: "Xem chi tiết đơn",
  },
  en: {
    internalChat: "Internal chat",
    teamChannel: "Uniemarket team channel",
    internalBody:
      "This is an internal communication channel between team members — not tied to any specific order.",
    loadFailed: "Couldn't load order details.",
    retry: "Try again",
    notFound: "Order not found.",
    orderDetails: "Order details",
    product: "Product",
    order: "Order",
    qtyPrefix: "Qty",
    moreItems: (n: number) => ` · +${n} more item${n > 1 ? "s" : ""}`,
    total: "Total",
    status: "Status",
    viewOrder: "View order details",
  },
};

export interface OrderDetailsSidebarProps {
  thread: ThreadRow;
  className?: string;
}

/** URL hiển thị của ảnh món: giữ nguyên http(s), nếu là path thì dựng public URL. */
function resolveItemImage(pathOrUrl: string | null): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!supabase) return null;
  return supabase.storage.from("product-images").getPublicUrl(pathOrUrl).data.publicUrl;
}

/** Chữ cái đầu để làm ô fallback khi món không có ảnh. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Tên hiển thị của món: "Tên (…) — Danh mục" khi có category_name. */
function itemLabel(item: OrderItemRow): string {
  return item.category_name ? `${item.name} — ${item.category_name}` : item.name;
}

function SidebarShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-surface p-4",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function OrderDetailsSidebar({ thread, className }: OrderDetailsSidebarProps) {
  const t = usePick(STR);
  const orderId = thread.order_id;
  const isOrderThread = thread.kind === "order" && Boolean(orderId);

  const orderQuery = useQuery({
    // Cùng key với MessagePane + useOrderRealtime → tự đồng bộ khi đơn đổi.
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId as string),
    enabled: isSupabaseConfigured && isOrderThread,
    staleTime: 30_000,
  });

  // Thread nội bộ staff (không gắn đơn): panel trao đổi nội bộ.
  if (!isOrderThread) {
    return (
      <SidebarShell className={className}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-soft text-green">
            <Hash className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-sm font-semibold text-text">{t.internalChat}</p>
            <p className="text-xs text-text-subtle">{t.teamChannel}</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-text-muted">
          {t.internalBody}
        </p>
      </SidebarShell>
    );
  }

  if (orderQuery.isPending) {
    return (
      <SidebarShell className={className}>
        <Skeleton className="h-5 w-24 rounded" />
        <div className="flex gap-3">
          <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </SidebarShell>
    );
  }

  if (orderQuery.isError) {
    return (
      <SidebarShell className={cn("items-center justify-center text-center", className)}>
        <p className="text-sm text-text-muted">{t.loadFailed}</p>
        <p className="max-w-xs text-xs text-text-subtle">
          {orderQuery.error instanceof Error ? orderQuery.error.message : ""}
        </p>
        <Button variant="secondary" size="sm" onClick={() => void orderQuery.refetch()}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          {t.retry}
        </Button>
      </SidebarShell>
    );
  }

  const order = orderQuery.data;
  if (!order) {
    return (
      <SidebarShell className={cn("items-center justify-center text-center", className)}>
        <p className="text-sm text-text-muted">{t.notFound}</p>
      </SidebarShell>
    );
  }

  const firstItem = order.items[0] ?? null;
  const extraCount = Math.max(0, order.items.length - 1);
  const imageUrl = firstItem ? resolveItemImage(firstItem.image_url) : null;

  return (
    <SidebarShell className={className}>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold text-text">{t.orderDetails}</h2>
        <span className="font-mono text-xs text-text-subtle">{order.order_code}</span>
      </div>

      {/* Món hàng: ảnh + tên */}
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-2">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={firstItem ? firstItem.name : t.product}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : firstItem ? (
            <div className="flex h-full w-full items-center justify-center font-heading text-sm font-bold text-text-subtle">
              {initialsOf(firstItem.name)}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-subtle">
              <ImageOff className="h-5 w-5" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-semibold leading-snug text-text">
            {firstItem ? itemLabel(firstItem) : t.order}
          </p>
          {firstItem ? (
            <p className="mt-0.5 text-xs text-text-subtle">
              {t.qtyPrefix} {firstItem.quantity}
              {extraCount > 0 ? t.moreItems(extraCount) : ""}
            </p>
          ) : null}
        </div>
      </div>

      {/* Tổng tiền */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-text-muted">{t.total}</span>
        <span className="tabular-nums-mono font-heading text-base font-bold text-yellow">
          {formatPrice(order.total)}
        </span>
      </div>

      {/* Trạng thái */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-muted">{t.status}</span>
        <WorkOrderStatusBadge status={orderDisplayStatus(order)} />
      </div>

      {/* Hành động (tự gate theo chủ đơn — buyer mới thấy Complete / Refund) */}
      <OrderActions order={order} />

      {/* Link sang trang chi tiết đơn đầy đủ */}
      <Link
        to={`/orders/${order.id}`}
        className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-auto")}
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        {t.viewOrder}
      </Link>
    </SidebarShell>
  );
}
