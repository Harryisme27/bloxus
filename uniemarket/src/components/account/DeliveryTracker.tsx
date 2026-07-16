import { Link } from "react-router-dom";
import { Package, Truck, PackageCheck, User2, ArrowRight } from "lucide-react";
import type { Order, DeliveryStatus } from "@/types";
import { formatPrice, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS: { key: DeliveryStatus; label: string; icon: typeof Package }[] = [
  { key: "awaiting", label: "Đã tiếp nhận", icon: Package },
  { key: "in_progress", label: "Đang giao", icon: Truck },
  { key: "delivered", label: "Đã giao", icon: PackageCheck },
];

const STEP_INDEX: Record<DeliveryStatus, number> = {
  awaiting: 0,
  in_progress: 1,
  delivered: 2,
};

/** Horizontal delivery stepper for the buyer's most recent in-flight order. */
export function DeliveryTracker({ order }: { order: Order }) {
  const activeIndex = STEP_INDEX[order.deliveryStatus];
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const headline = order.items[0]?.name ?? "Vật phẩm";

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-yellow">Đơn đang giao</p>
          <p className="mt-1 font-heading text-lg font-bold text-text">
            {headline}
            {itemCount > 1 ? (
              <span className="text-text-muted"> +{itemCount - 1} vật phẩm khác</span>
            ) : null}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
            <span className="font-mono tabular-nums text-text-subtle">{order.id}</span>
            <span className="inline-flex items-center gap-1">
              <User2 className="h-3.5 w-3.5" aria-hidden />
              {order.robloxUsername}
            </span>
            <span className="font-mono tabular-nums text-yellow">{formatPrice(order.totalUSD)}</span>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-text-muted">
          {relativeTime(order.createdAt)}
        </span>
      </div>

      <ol className="mt-6 flex items-center">
        {STEPS.map((step, index) => {
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;
          const Icon = step.icon;
          return (
            <li key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
                    isDone && "border-yellow bg-yellow text-text-on-yellow",
                    isActive && "border-yellow bg-yellow-soft text-yellow shadow-glow-amber",
                    !isDone && !isActive && "border-border-strong bg-surface-2 text-text-subtle",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isActive || isDone ? "text-text" : "text-text-subtle",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <span
                  className={cn(
                    "mx-2 mb-5 h-0.5 flex-1 rounded-full",
                    index < activeIndex ? "bg-yellow" : "bg-border-strong",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex items-center justify-end">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-sm font-semibold text-yellow transition-colors hover:text-yellow-hover"
        >
          Xem tất cả đơn hàng
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
