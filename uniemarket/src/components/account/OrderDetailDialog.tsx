import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { User2, CreditCard, CalendarClock, ShieldCheck, RotateCcw, Repeat } from "lucide-react";
import type { Order } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RarityBadge } from "@/components/RarityBadge";
import { OrderStatusBadge, DeliveryStatusBadge } from "@/components/account/orderMeta";
import { formatPrice, relativeTime } from "@/lib/format";

export interface OrderDetailDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Re-add every line of this order to the cart. */
  onReorder: (order: Order) => void;
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User2;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="inline-flex items-center gap-2 text-text-muted">
        <Icon className="h-4 w-4 text-text-subtle" aria-hidden />
        {label}
      </span>
      <span className="text-right font-medium text-text">{value}</span>
    </div>
  );
}

/** Full breakdown of a single order, shown in a modal from the orders table. */
export function OrderDetailDialog({ order, open, onOpenChange, onReorder }: OrderDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {order ? (
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <DialogTitle className="font-mono tabular-nums">{order.id}</DialogTitle>
              <OrderStatusBadge status={order.status} />
            </div>
            <DialogDescription>Đặt {relativeTime(order.createdAt)} · bản demo</DialogDescription>
          </DialogHeader>

          {/* Line items */}
          <div className="max-h-56 overflow-y-auto rounded-xl border border-border bg-surface-2">
            <ul className="divide-y divide-border">
              {order.items.map((line, index) => (
                <li key={`${line.itemId}-${index}`} className="flex items-center gap-3 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-3 font-heading text-xs font-bold text-text-subtle">
                    {line.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{line.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <RarityBadge rarity={line.rarity} />
                      <span className="text-xs text-text-subtle">{line.gameName}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm tabular-nums text-text">
                      {formatPrice(line.unitPriceUSD)}
                    </p>
                    <p className="text-xs text-text-subtle">x{line.quantity}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Totals */}
          <div className="mt-4 space-y-1 border-t border-border pt-3">
            <div className="flex items-center justify-between text-sm text-text-muted">
              <span>Tạm tính</span>
              <span className="font-mono tabular-nums">{formatPrice(order.subtotalUSD)}</span>
            </div>
            {order.discountUSD > 0 ? (
              <div className="flex items-center justify-between text-sm text-success">
                <span>Giảm giá</span>
                <span className="font-mono tabular-nums">-{formatPrice(order.discountUSD)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between pt-1">
              <span className="font-heading text-sm font-semibold text-text">Tổng cộng</span>
              <span className="font-mono text-lg font-bold tabular-nums text-yellow">
                {formatPrice(order.totalUSD)}
              </span>
            </div>
          </div>

          {/* Meta */}
          <div className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-2">
            <MetaRow icon={User2} label="Roblox" value={order.robloxUsername} />
            <MetaRow icon={CreditCard} label="Thanh toán" value={order.paymentMethod} />
            <MetaRow
              icon={CalendarClock}
              label="Giao hàng"
              value={<DeliveryStatusBadge status={order.deliveryStatus} />}
            />
          </div>

          <Link
            to="/proofs"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-yellow transition-colors hover:text-yellow-hover"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Xem minh chứng giao hàng
          </Link>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button variant="secondary" size="md">
                <RotateCcw className="h-4 w-4" aria-hidden />
                Đóng
              </Button>
            </DialogClose>
            <Button variant="primary" size="md" onClick={() => onReorder(order)}>
              <Repeat className="h-4 w-4" aria-hidden />
              Mua lại
            </Button>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
