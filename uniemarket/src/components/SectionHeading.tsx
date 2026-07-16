import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Standard "eyebrow + title + description" heading used above content sections. */
export function SectionHeading({ eyebrow, title, description, action, className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-yellow">{eyebrow}</p>
        ) : null}
        <h2 className="font-heading text-2xl font-bold text-text sm:text-3xl">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm text-text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
