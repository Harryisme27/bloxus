import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useCurrencyStore, USD_VND_RATE } from "@/store/currencyStore";
import { cn } from "@/lib/utils";
import { formatThousands } from "./helpers";

export interface PriceInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/** Chuỗi hiển thị từ giá VND theo tiền tệ đang xem. */
function toDisplay(v: number | null, usd: boolean): string {
  if (v === null || Number.isNaN(v)) return "";
  if (usd) return String(Math.round((v / USD_VND_RATE) * 100) / 100);
  return formatThousands(v);
}

/** Parse chuỗi đang gõ về giá VND (USD nhập số lẻ, quy đổi + làm tròn). */
function toVnd(s: string, usd: boolean): number | null {
  if (usd) {
    const f = parseFloat(s);
    return Number.isFinite(f) && f >= 0 ? Math.round(f * USD_VND_RATE) : null;
  }
  const digits = s.replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

/** Ô nhập giá theo tiền tệ đang xem (navbar): USD -> "$ 9.99" (quy đổi về VND
 * khi lưu — DB luôn lưu VND); VND -> "875.000 ₫" như cũ. */
export function PriceInput({ value, onChange, id, placeholder, className, disabled }: PriceInputProps) {
  const currency = useCurrencyStore((s) => s.currency);
  const isUsd = currency === "usd";
  const [draft, setDraft] = useState(() => toDisplay(value, isUsd));

  // Đồng bộ khi value/tiền tệ đổi từ bên ngoài (mở sản phẩm khác, reset form…)
  // nhưng không phá chuỗi đang gõ nếu nó vẫn khớp giá trị.
  useEffect(() => {
    setDraft((d) => (toVnd(d, isUsd) === value ? d : toDisplay(value, isUsd)));
  }, [value, isUsd]);

  function handleChange(raw: string) {
    let clean: string;
    if (isUsd) {
      // Cho phép số + 1 dấu chấm thập phân, tối đa 2 số lẻ.
      clean = raw.replace(/[^\d.]/g, "");
      const dot = clean.indexOf(".");
      if (dot !== -1) {
        clean = clean.slice(0, dot + 1) + clean.slice(dot + 1).replace(/\./g, "").slice(0, 2);
      }
      clean = clean.slice(0, 10);
    } else {
      const digits = raw.replace(/[^\d]/g, "").slice(0, 12);
      clean = digits ? formatThousands(Number(digits)) : "";
    }
    setDraft(clean);
    onChange(toVnd(clean, isUsd));
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        inputMode={isUsd ? "decimal" : "numeric"}
        placeholder={isUsd ? "0.00" : (placeholder ?? "0")}
        disabled={disabled}
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        className={cn("text-right font-mono tabular-nums-mono", isUsd ? "pl-7" : "pr-8")}
      />
      <span
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm text-text-subtle",
          isUsd ? "left-3" : "right-3",
        )}
      >
        {isUsd ? "$" : "₫"}
      </span>
    </div>
  );
}
