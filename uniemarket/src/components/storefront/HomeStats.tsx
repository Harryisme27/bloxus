import type { LucideIcon } from "lucide-react";
import { PackageCheck, Smile, Timer } from "lucide-react";
import { CountUp } from "@/components/storefront/CountUp";
import { cn } from "@/lib/utils";

interface StatDef {
  icon: LucideIcon;
  end: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

const STATS: StatDef[] = [
  { icon: PackageCheck, end: 12400, suffix: "+", label: "Đơn hàng đã giao" },
  { icon: Smile, end: 98, suffix: "%", label: "Khách hàng hài lòng" },
  { icon: Timer, end: 4, prefix: "~", suffix: " phút", label: "Thời gian giao trung bình" },
];

/** Trio of animated count-up stat tiles (đơn đã giao / khách hài lòng / thời gian giao). */
export function HomeStats({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-3", className)}>
      {STATS.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center transition-colors hover:border-yellow"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-soft text-yellow">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <CountUp
              end={stat.end}
              decimals={stat.decimals}
              prefix={stat.prefix}
              suffix={stat.suffix}
              className="font-heading text-3xl font-extrabold text-text sm:text-4xl"
            />
            <p className="text-sm text-text-muted">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
