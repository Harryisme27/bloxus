import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartLine as CartLineType } from "@/store/cartStore";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    decrease: "Giảm số lượng",
    increase: "Tăng số lượng",
    perPackage: " / gói",
    perProduct: " / sản phẩm",
    removeAria: (name: string) => `Xoá ${name} khỏi giỏ`,
  },
  en: {
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    perPackage: " / package",
    perProduct: " / product",
    removeAria: (name: string) => `Remove ${name} from cart`,
  },
};

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export interface CartLineProps {
  line: CartLineType;
  className?: string;
}

/** A single editable row in the cart: ảnh thật (fallback chữ cái đầu), tên +
 * tóm tắt lựa chọn dịch vụ, stepper số lượng (khoá với dịch vụ), nút xoá và
 * thành tiền. */
export function CartLine({ line, className }: CartLineProps) {
  const t = usePick(STR);
  const setQty = useCartStore((state) => state.setQty);
  const removeItem = useCartStore((state) => state.removeItem);

  const isService = line.kind === "service";
  const lineTotal = line.unitPrice * line.quantity;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong sm:flex-row sm:items-center",
        className,
      )}
    >
      {/* Thumbnail + identity */}
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Link
          to={`/item/${line.productId}`}
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-2 font-heading text-lg font-extrabold text-text-subtle transition-colors hover:border-yellow hover:text-yellow"
        >
          {line.imageUrl ? (
            <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initialsOf(line.name)
          )}
        </Link>
        <div className="min-w-0">
          <Link
            to={`/item/${line.productId}`}
            className="line-clamp-1 font-heading text-sm font-semibold text-text transition-colors hover:text-yellow"
          >
            {line.name}
          </Link>
          {line.optionSummary ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">{line.optionSummary}</p>
          ) : null}
          <p className="tabular-nums-mono mt-1 text-xs text-text-subtle">
            {formatPrice(line.unitPrice)}
            {isService ? t.perPackage : t.perProduct}
          </p>
        </div>
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="inline-flex items-center rounded-lg border border-border-strong bg-surface-2">
          <button
            type="button"
            aria-label={t.decrease}
            onClick={() => setQty(line.id, line.quantity - 1)}
            disabled={isService}
            className="flex h-9 w-9 items-center justify-center rounded-l-lg text-text-muted transition-colors hover:bg-surface-3 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow disabled:pointer-events-none disabled:opacity-40"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="tabular-nums-mono w-10 text-center text-sm font-semibold text-text">
            {line.quantity}
          </span>
          <button
            type="button"
            aria-label={t.increase}
            onClick={() => setQty(line.id, line.quantity + 1)}
            disabled={isService}
            className="flex h-9 w-9 items-center justify-center rounded-r-lg text-text-muted transition-colors hover:bg-surface-3 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Line total */}
        <div className="min-w-[5.5rem] text-right">
          <p className="tabular-nums-mono font-heading text-base font-bold text-yellow">
            {formatPrice(lineTotal)}
          </p>
        </div>

        {/* Remove */}
        <button
          type="button"
          aria-label={t.removeAria(line.name)}
          onClick={() => removeItem(line.id)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-subtle transition-colors hover:border-danger hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
