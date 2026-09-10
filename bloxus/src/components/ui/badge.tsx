import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "border-border-strong bg-surface-2 text-text-muted",
        green: "border-transparent bg-green-soft text-green",
        gold: "border-transparent bg-yellow-soft text-yellow",
        success: "border-transparent bg-surface-2 text-success",
        danger: "border-transparent bg-danger-soft text-danger",
        outline: "border-border-strong bg-transparent text-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
