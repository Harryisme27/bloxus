import type { ReactNode } from "react";
import { ReceiptText } from "lucide-react";
import type { CartLine } from "@/store/cartStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    summary: "Tóm tắt đơn hàng",
    products: "sản phẩm",
    subtotal: "Tạm tính",
    discount: "Giảm giá",
    total: "Tổng cộng",
  },
  en: {
    summary: "Order summary",
    products: "products",
    subtotal: "Subtotal",
    discount: "Discount",
    total: "Total",
  },
};

export interface OrderSummaryProps {
  /** Tạm tính (VND). */
  subtotal: number;
  /** Giảm giá (VND) — mặc định 0. */
  discount?: number;
  /** Tổng cộng (VND). */
  total: number;
  /** When provided, renders an itemized list above the totals. */
  lines?: CartLine[];
  title?: string;
  /** Footer slot (e.g. checkout CTA). */
  children?: ReactNode;
  className?: string;
}

/** Right-hand order summary card used by both /cart and /checkout. All money
 * values use tabular mono figures so digits align. */
export function OrderSummary({
  subtotal,
  discount = 0,
  total,
  lines,
  title,
  children,
  className,
}: OrderSummaryProps) {
  const t = usePick(STR);
  const heading = title ?? t.summary;
  const itemCount = lines?.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border">
        <CardTitle className="flex items-center gap-2 text-base">
          <ReceiptText className="h-4 w-4 text-yellow" aria-hidden="true" />
          {heading}
        </CardTitle>
        {typeof itemCount === "number" ? (
          <span className="tabular-nums-mono rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-text-muted">
            {itemCount} {t.products}
          </span>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {lines && lines.length > 0 ? (
          <ul className="space-y-2.5">
            {lines.map((line) => (
              <li key={line.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="line-clamp-1 text-text">{line.name}</span>
                  {line.optionSummary ? (
                    <span className="line-clamp-1 block text-xs text-text-muted">
                      {line.optionSummary}
                    </span>
                  ) : null}
                  <span className="tabular-nums-mono text-xs text-text-subtle">
                    {formatPrice(line.unitPrice)} × {line.quantity}
                  </span>
                </span>
                <span className="tabular-nums-mono shrink-0 font-medium text-text">
                  {formatPrice(line.unitPrice * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {lines && lines.length > 0 ? <div className="h-px bg-border" /> : null}

        <dl className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-text-muted">{t.subtotal}</dt>
            <dd className="tabular-nums-mono text-text">{formatPrice(subtotal)}</dd>
          </div>
          {discount > 0 ? (
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">{t.discount}</dt>
              <dd className="tabular-nums-mono text-success">− {formatPrice(discount)}</dd>
            </div>
          ) : null}
        </dl>

        <div className="h-px bg-border" />

        <div className="flex items-end justify-between">
          <span className="font-heading text-sm font-semibold text-text">{t.total}</span>
          <span className="tabular-nums-mono font-heading text-2xl font-extrabold text-yellow">
            {formatPrice(total)}
          </span>
        </div>

        {children ? <div className="pt-1">{children}</div> : null}
      </CardContent>
    </Card>
  );
}
