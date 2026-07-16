import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepCardProps {
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

/** A numbered "how it works" step card with an icon. */
export function StepCard({ step, icon: Icon, title, description, className }: StepCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-all duration-200",
        "hover:-translate-y-1 hover:border-yellow hover:shadow-glow-amber",
        className,
      )}
    >
      <span
        className="absolute right-5 top-5 font-heading text-5xl font-bold text-surface-3 transition-colors group-hover:text-yellow-soft"
        aria-hidden="true"
      >
        {String(step).padStart(2, "0")}
      </span>

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow text-text-on-yellow">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>

      <div>
        <h3 className="font-heading text-lg font-semibold text-text">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">{description}</p>
      </div>
    </div>
  );
}
