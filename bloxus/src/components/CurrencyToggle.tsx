// USD/VND currency switch — segmented control giống LanguageToggle, gắn với
// currencyStore. Chỉ đổi tiền tệ HIỂN THỊ (server vẫn tính bằng VND).
import { useCurrencyStore, type Currency } from "@/store/currencyStore";
import { usePick } from "@/i18n";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Currency; label: string; aria: string }[] = [
  { value: "usd", label: "USD", aria: "US Dollar" },
  { value: "vnd", label: "VND", aria: "Việt Nam Đồng" },
];

const STR = {
  vi: { groupAria: "Tiền tệ" },
  en: { groupAria: "Currency" },
};

export function CurrencyToggle({ className }: { className?: string }) {
  const currency = useCurrencyStore((state) => state.currency);
  const setCurrency = useCurrencyStore((state) => state.setCurrency);
  const t = usePick(STR);

  return (
    <div
      role="group"
      aria-label={t.groupAria}
      className={cn(
        "inline-flex items-center rounded-lg border border-border-strong bg-surface-2 p-0.5",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const active = currency === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setCurrency(opt.value)}
            aria-pressed={active}
            aria-label={opt.aria}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-heading font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
              active ? "bg-yellow text-text-on-yellow" : "text-text-muted hover:text-text",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
