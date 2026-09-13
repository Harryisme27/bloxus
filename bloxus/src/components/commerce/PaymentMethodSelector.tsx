import type { GatewayMeta } from "@/lib/paymentGateways";
import { useLangStore } from "@/i18n";
import { cn } from "@/lib/utils";

function BrandMarks({ gatewayId, stripeMethod }: { gatewayId: string; stripeMethod?: "apple" | "card" }) {
  if (gatewayId === "stripe") {
    if (stripeMethod === "apple") {
      return <span className="ml-auto rounded-md bg-white px-2.5 py-1 text-[11px] font-bold text-black">Apple Pay</span>;
    }
    return (
      <span className="ml-auto flex shrink-0 items-center gap-1.5" aria-hidden="true">
        <span className="rounded-md bg-[#173cae] px-2 py-1 text-[10px] font-black italic text-white">VISA</span>
        <span className="flex h-6 items-center rounded-md bg-[#292b35] px-1.5">
          <span className="h-3.5 w-3.5 rounded-full bg-[#eb001b]" />
          <span className="-ml-1 h-3.5 w-3.5 rounded-full bg-[#f79e1b] opacity-90" />
        </span>
        <span className="hidden rounded-md bg-[#292b35] px-2 py-1 text-[10px] font-bold text-white sm:inline">AMEX</span>
      </span>
    );
  }
  if (gatewayId === "paypal") {
    return <span className="ml-auto rounded-md bg-[#168bd7] px-2.5 py-1 text-xs font-black italic text-white">PayPal</span>;
  }
  if (gatewayId === "momo") {
    return <span className="ml-auto rounded-md bg-[#a50064] px-2 py-1 text-[10px] font-black text-white">MoMo</span>;
  }
  if (gatewayId === "crypto") {
    return <span className="ml-auto rounded-full bg-[#f59e0b] px-2 py-1 text-[11px] font-black text-[#241700]">BTC</span>;
  }
  return <span className="ml-auto rounded-md bg-green-soft px-2 py-1 text-[10px] font-bold uppercase text-green">Bank</span>;
}

export interface PaymentMethodSelectorProps {
  /** Các cổng đang bật (do admin cấu hình) để khách chọn. */
  gateways: GatewayMeta[];
  /** Id cổng đang chọn. */
  value: string;
  onChange: (id: string) => void;
  stripeMethod?: "apple" | "card";
  onStripeMethodChange?: (method: "apple" | "card") => void;
  className?: string;
}

/** Lưới tile cổng thanh toán đang bật. Tile đang chọn viền hổ phách + dấu tích. */
export function PaymentMethodSelector({ gateways, value, onChange, stripeMethod = "card", onStripeMethodChange, className }: PaymentMethodSelectorProps) {
  const en = useLangStore((s) => s.lang) === "en";
  return (
    <div className={cn("grid grid-cols-1 gap-2.5", className)} role="radiogroup">
      {gateways.map((g) => {
        if (g.id === "stripe") {
          return (
            <div key={g.id} className="space-y-2.5">
              {(["apple", "card"] as const).map((method) => {
                const selected = value === g.id && stripeMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      onChange(g.id);
                      onStripeMethodChange?.(method);
                    }}
                    className={cn(
                      "group flex min-h-[66px] w-full items-center gap-3 rounded-xl border bg-[#151d18] px-4 py-3 text-left transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lemon",
                      selected
                        ? "border-lemon/80 bg-[#272711] shadow-[0_0_0_1px_rgba(250,214,86,0.12)]"
                        : "border-[#2d4032] hover:border-[#52785a] hover:bg-[#19271d]",
                    )}
                  >
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-lemon" : "border-[#a0ada1]")}>
                      {selected ? <span className="h-3 w-3 rounded-full bg-lemon" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-heading text-sm font-semibold text-text">
                        {method === "apple" ? "Apple Pay" : "Credit / Debit Card"}
                      </span>
                      <span className="block text-xs text-text-subtle">
                        {method === "apple" ? "Pay quickly with your iPhone" : "Visa, Mastercard and American Express"}
                      </span>
                    </span>
                    <BrandMarks gatewayId="stripe" stripeMethod={method} />
                  </button>
                );
              })}
            </div>
          );
        }
        const selected = g.id === value;
        return (
          <button
            key={g.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(g.id)}
            className={cn(
              "group relative flex min-h-[66px] items-center gap-3 rounded-xl border bg-[#122519] px-4 py-3 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lemon focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
              selected
                ? "border-lemon/80 bg-[#272711] shadow-[0_0_0_1px_rgba(250,214,86,0.12),0_14px_32px_-24px_rgba(250,214,86,0.7)]"
                : "border-[#31513a] hover:border-[#52785a] hover:bg-[#172d1c]",
            )}
          >
            <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-lemon" : "border-[#8ca18a]") }>
              {selected ? <span className="h-3 w-3 rounded-full bg-lemon shadow-[0_0_10px_rgba(250,214,86,0.55)]" /> : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-heading text-sm font-semibold text-text">
                {en ? g.en : g.vi}
              </span>
              <span className="block truncate text-xs text-text-subtle">
                {en ? g.hintEn : g.hintVi}
              </span>
            </span>
            <BrandMarks gatewayId={g.id} />
          </button>
        );
      })}
    </div>
  );
}
