import { Input } from "@/components/ui/input";
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

/** Ô nhập giá VND có phân tách hàng nghìn ("875.000") + hậu tố ₫. */
export function PriceInput({ value, onChange, id, placeholder, className, disabled }: PriceInputProps) {
  const display = value === null || Number.isNaN(value) ? "" : formatThousands(value);
  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        inputMode="numeric"
        placeholder={placeholder ?? "0"}
        disabled={disabled}
        value={display}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, "").slice(0, 12);
          onChange(digits ? Number(digits) : null);
        }}
        className="pr-8 text-right font-mono tabular-nums-mono"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-subtle">
        ₫
      </span>
    </div>
  );
}
