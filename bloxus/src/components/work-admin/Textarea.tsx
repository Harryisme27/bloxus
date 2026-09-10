import * as React from "react";
import { cn } from "@/lib/utils";

/** Textarea theo đúng style của ui/Input (chưa có primitive dùng chung). */
export const AdminTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[88px] w-full rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-subtle transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:border-yellow",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
AdminTextarea.displayName = "AdminTextarea";
