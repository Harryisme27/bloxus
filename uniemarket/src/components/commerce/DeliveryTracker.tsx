import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const STEPS: Step[] = [
  { key: "placed", label: "Đã đặt", description: "Đơn hàng đã được tạo", icon: ShoppingBag },
  { key: "in_progress", label: "Đang giao", description: "Nhân viên đang giao vật phẩm", icon: Truck },
  { key: "delivered", label: "Đã giao", description: "Vật phẩm đã vào tài khoản của bạn", icon: PackageCheck },
];

export interface DeliveryTrackerProps {
  /** Estimated delivery time text shown while in progress (e.g. "2-5 phút"). */
  estimate?: string;
  className?: string;
}

/** Simulated delivery status: starts at "Đã đặt" and automatically advances
 * through "Đang giao" -> "Đã giao" on timers, so the success page feels alive. */
export function DeliveryTracker({ estimate = "2-5 phút", className }: DeliveryTrackerProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const toInProgress = setTimeout(() => setCurrent(1), 2600);
    const toDelivered = setTimeout(() => setCurrent(2), 6200);
    return () => {
      clearTimeout(toInProgress);
      clearTimeout(toDelivered);
    };
  }, []);

  const done = current >= STEPS.length - 1;
  // Fill the connector line proportionally to progress.
  const progressPct = STEPS.length > 1 ? (current / (STEPS.length - 1)) * 100 : 0;

  return (
    <div className={cn("rounded-xl border border-border bg-surface p-5 sm:p-6", className)}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="font-heading text-sm font-semibold text-text">Trạng thái giao hàng</h3>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            done ? "bg-green-soft text-green" : "bg-surface-2 text-text-muted",
          )}
        >
          {done ? (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          )}
          {done ? "Hoàn tất" : "Đang xử lý"}
        </span>
      </div>

      <div className="relative">
        {/* Base + progress connector (behind the icons) */}
        <div
          className="absolute left-[16.666%] right-[16.666%] top-5 h-0.5 -translate-y-1/2 bg-border"
          aria-hidden="true"
        >
          <div
            className="h-full bg-yellow transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <ol className="relative flex items-start justify-between">
          {STEPS.map((step, index) => {
            const isComplete = index < current;
            const isActive = index === current;
            const reached = index <= current;
            const Icon = isComplete ? CheckCircle2 : step.icon;
            return (
              <li key={step.key} className="flex w-1/3 flex-col items-center text-center">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-surface transition-colors duration-500",
                    reached ? "border-yellow text-yellow" : "border-border text-text-subtle",
                    isActive && !done ? "shadow-glow-amber" : "",
                  )}
                >
                  {isActive && !done ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  )}
                </span>
                <span
                  className={cn(
                    "mt-2 text-xs font-semibold",
                    reached ? "text-text" : "text-text-subtle",
                  )}
                >
                  {step.label}
                </span>
                <span className="mt-0.5 hidden text-[11px] leading-tight text-text-subtle sm:block">
                  {step.description}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="mt-5 text-center text-xs text-text-muted sm:text-left">
        {done ? (
          <span className="text-success">Giao hàng hoàn tất. Cảm ơn bạn đã mua sắm tại Uniemarket!</span>
        ) : (
          <>
            Thời gian giao dự kiến:{" "}
            <span className="font-semibold text-text">{estimate}</span>
          </>
        )}
      </p>
    </div>
  );
}
