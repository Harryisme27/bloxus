import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-body font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-yellow text-text-on-yellow hover:bg-yellow-hover active:brightness-95",
        purchase: "bg-lemon text-text-on-lemon shadow-[0_10px_24px_-16px_rgba(250,214,86,0.85)] hover:bg-lemon-hover active:brightness-95",
        secondary:
          "border border-border-strong bg-transparent text-text hover:bg-surface-2 active:bg-surface-3",
        // Repointed to the leaf-green fill so both brand fills stay available.
        gold: "bg-green text-text-on-green hover:bg-green-hover active:bg-green-press",
        ghost: "bg-transparent text-text-muted hover:bg-surface-2 hover:text-text",
        danger: "bg-danger text-text hover:brightness-110 active:brightness-95",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = "Button";
