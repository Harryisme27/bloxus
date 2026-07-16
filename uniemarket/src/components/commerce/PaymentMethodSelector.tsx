import { Check, Landmark, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DbPaymentMethod } from "@/types/db";
import { cn } from "@/lib/utils";

interface PaymentMethod {
  id: DbPaymentMethod;
  label: string;
  hint: string;
  icon: LucideIcon;
}

/** 2 phương thức thanh toán thủ công của shop — khớp enum DbPaymentMethod. */
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "bank_transfer",
    label: "Chuyển khoản ngân hàng",
    hint: "Chuyển khoản theo hướng dẫn",
    icon: Landmark,
  },
  { id: "momo", label: "Momo", hint: "Chuyển qua ví Momo / quét QR", icon: Wallet },
];

/** Human-readable label for a method id. */
export function paymentMethodLabel(id: DbPaymentMethod): string {
  return PAYMENT_METHODS.find((method) => method.id === id)?.label ?? id;
}

export interface PaymentMethodSelectorProps {
  value: DbPaymentMethod;
  onChange: (id: DbPaymentMethod) => void;
  className?: string;
}

/** Grid of selectable surface tiles for the manual payment method. The active
 * tile gets an amber border + check chip. */
export function PaymentMethodSelector({ value, onChange, className }: PaymentMethodSelectorProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)} role="radiogroup">
      {PAYMENT_METHODS.map((method) => {
        const Icon = method.icon;
        const selected = method.id === value;
        return (
          <button
            key={method.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(method.id)}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl border bg-surface-2 p-4 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
              selected
                ? "border-yellow shadow-glow-amber"
                : "border-border hover:-translate-y-0.5 hover:border-border-strong",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                selected ? "bg-yellow text-text-on-yellow" : "bg-surface-3 text-text-muted",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-heading text-sm font-semibold text-text">
                {method.label}
              </span>
              <span className="block truncate text-xs text-text-subtle">{method.hint}</span>
            </span>
            {selected ? (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-yellow text-text-on-yellow">
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
