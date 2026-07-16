import { Eye, Repeat } from "lucide-react";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { RarityBadge } from "@/components/RarityBadge";
import { OrderStatusBadge } from "@/components/account/orderMeta";
import { formatPrice, relativeTime } from "@/lib/format";

export interface OrdersTableProps {
  orders: Order[];
  onSelect: (order: Order) => void;
  onReorder: (order: Order) => void;
}

function itemSummary(order: Order): string {
  const first = order.items[0];
  if (!first) return "—";
  const extra = order.items.length - 1;
  return extra > 0 ? `${first.name} +${extra}` : first.name;
}

/** Responsive orders list: a real <table> on md+ screens, stacked cards below.
 * Both share the same row actions (Chi tiết / Mua lại). */
export function OrdersTable({ orders, onSelect, onReorder }: OrdersTableProps) {
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wider text-text-subtle">
              <th className="px-4 py-3 font-semibold">Mã đơn</th>
              <th className="px-4 py-3 font-semibold">Vật phẩm</th>
              <th className="px-4 py-3 font-semibold">Ngày đặt</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 text-right font-semibold">Tổng</th>
              <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => onSelect(order)}
                className="cursor-pointer bg-surface transition-colors hover:bg-surface-2"
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="font-mono text-xs tabular-nums text-text">{order.id}</span>
                </td>
                <td className="max-w-[220px] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <RarityBadge rarity={order.items[0]?.rarity ?? "Common"} />
                    <span className="truncate text-text">{itemSummary(order)}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                  {relativeTime(order.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold tabular-nums text-yellow">
                  {formatPrice(order.totalUSD)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(order);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      Chi tiết
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorder(order);
                      }}
                    >
                      <Repeat className="h-3.5 w-3.5" aria-hidden />
                      Mua lại
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {orders.map((order) => (
          <div
            key={order.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(order)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(order);
              }
            }}
            className="cursor-pointer rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs tabular-nums text-text-muted">{order.id}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <RarityBadge rarity={order.items[0]?.rarity ?? "Common"} />
              <span className="truncate text-sm font-medium text-text">{itemSummary(order)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-text-subtle">{relativeTime(order.createdAt)}</span>
              <span className="font-mono text-sm font-bold tabular-nums text-yellow">
                {formatPrice(order.totalUSD)}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onReorder(order);
                }}
              >
                <Repeat className="h-3.5 w-3.5" aria-hidden />
                Mua lại
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
