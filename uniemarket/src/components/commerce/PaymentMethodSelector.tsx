import { Check } from "lucide-react";
import type { GatewayMeta } from "@/lib/paymentGateways";
import { useLangStore } from "@/i18n";
import { cn } from "@/lib/utils";

export interface PaymentMethodSelectorProps {
  /** Các cổng đang bật (do admin cấu hình) để khách chọn. */
  gateways: GatewayMeta[];
  /** Id cổng đang chọn. */
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

/** Lưới tile cổng thanh toán đang bật. Tile đang chọn viền hổ phách + dấu tích. */
export function PaymentMethodSelector({ gateways, value, onChange, className }: PaymentMethodSelectorProps) {
  const en = useLangStore((s) => s.lang) === "en";
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)} role="radiogroup">
      {gateways.map((g) => {
        const Icon = g.icon;
        const selected = g.id === value;
        return (
          <button
            key={g.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(g.id)}
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
                {en ? g.en : g.vi}
              </span>
              <span className="block truncate text-xs text-text-subtle">
                {en ? g.hintEn : g.hintVi}
              </span>
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
