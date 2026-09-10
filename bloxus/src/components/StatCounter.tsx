import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCounterProps {
  icon?: LucideIcon;
  value: string;
  label: string;
  className?: string;
}

/** A single "stat" tile, e.g. "12,400+ đơn hàng đã giao". Used in TrustBar and elsewhere. */
export function StatCounter({ icon: Icon, value, label, className }: StatCounterProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {Icon ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-soft text-yellow">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      ) : null}
      <div>
        <p className="tabular-nums-mono font-heading text-xl font-bold text-text">{value}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </div>
  );
}
