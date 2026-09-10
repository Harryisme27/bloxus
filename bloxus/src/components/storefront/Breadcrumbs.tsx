import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  /** Omit `to` for the current (non-clickable) page. */
  to?: string;
}

/** Simple breadcrumb trail: Trang chủ / Danh mục / … */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-1.5 text-sm", className)}>
      {items.map((crumb, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={`${crumb.label}-${i}`}>
            {crumb.to && !isLast ? (
              <Link to={crumb.to} className="text-text-muted transition-colors hover:text-yellow">
                {crumb.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-text" : "text-text-muted"}>
                {crumb.label}
              </span>
            )}
            {!isLast ? (
              <ChevronRight className="h-4 w-4 text-text-subtle" aria-hidden="true" />
            ) : null}
          </Fragment>
        );
      })}
    </nav>
  );
}
