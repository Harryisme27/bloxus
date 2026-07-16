import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  hint?: string;
  /** Accent tint for the icon chip. */
  tone?: "green" | "gold" | "neutral";
  className?: string;
}

const TONE_CHIP: Record<NonNullable<StatCardProps["tone"]>, string> = {
  green: "bg-green-soft text-green",
  gold: "bg-yellow-soft text-yellow",
  neutral: "bg-surface-3 text-text-muted",
};

/** A single dashboard metric tile. */
export function StatCard({ label, value, icon: Icon, hint, tone = "neutral", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "group rounded-2xl border border-border bg-surface p-5 transition-all duration-200",
        "hover:-translate-y-1 hover:border-yellow hover:shadow-glow-amber",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-text-muted">{label}</span>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", TONE_CHIP[tone])}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <div className="mt-3 font-heading text-3xl font-bold tabular-nums text-text">{value}</div>
      {hint ? <p className="mt-1 text-xs text-text-subtle">{hint}</p> : null}
    </div>
  );
}
