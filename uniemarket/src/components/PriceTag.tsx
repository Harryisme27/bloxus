import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface PriceTagProps {
  /** Giá hiện tại (VND). */
  price: number;
  /** Giá gốc (VND) — hiện gạch ngang + badge % khi lớn hơn giá hiện tại. */
  originalPrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<PriceTagProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
};

/** Displays the (amber) current price, with an optional struck-through original price + discount badge. */
export function PriceTag({ price, originalPrice, size = "md", className }: PriceTagProps) {
  const hasDiscount = !!originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("tabular-nums-mono font-heading font-bold text-yellow", SIZE_CLASSES[size])}>
        {formatPrice(price)}
      </span>
      {hasDiscount ? (
        <span className="tabular-nums-mono text-sm text-text-subtle line-through">
          {formatPrice(originalPrice)}
        </span>
      ) : null}
      {hasDiscount && discountPercent > 0 ? (
        <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
          -{discountPercent}%
        </span>
      ) : null}
    </div>
  );
}
