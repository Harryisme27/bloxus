import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

/** A native <select>, styled to match the theme. Options are passed as children. */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full appearance-none rounded-lg border border-border-strong bg-surface-2 px-3 pr-9 text-sm text-text transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:border-yellow",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
          aria-hidden="true"
        />
      </div>
    );
  },
);
Select.displayName = "Select";
