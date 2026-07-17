import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Settings2 } from "lucide-react";
import { toast } from "sonner";
import type { ProductRow } from "@/types/db";
import { RarityBadge } from "@/components/RarityBadge";
import { PriceTag } from "@/components/PriceTag";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { usePick } from "@/i18n";
import { cn } from "@/lib/utils";

const STR = {
  vi: {
    service: "Dịch vụ",
    outOfStock: "Hết hàng",
    choosePackage: "Chọn gói",
    addToCart: "Thêm vào giỏ",
    addedToCart: (name: string) => `Đã thêm "${name}" vào giỏ hàng`,
    quantityOne: "Số lượng: 1",
  },
  en: {
    service: "Service",
    outOfStock: "Out of stock",
    choosePackage: "Choose package",
    addToCart: "Add to cart",
    addedToCart: (name: string) => `Added "${name}" to cart`,
    quantityOne: "Quantity: 1",
  },
};

export interface ProductCardProps {
  product: ProductRow;
  className?: string;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** true khi sản phẩm còn mua được (stock null = không quản lý tồn kho). */
export function isInStock(product: ProductRow): boolean {
  if (product.kind === "service") return true;
  return product.stock === null || product.stock > 0;
}

/** Clickable card linking to /item/:id. Ảnh thật từ products.images với
 * fallback chữ cái đầu. Item: nút thêm giỏ; dịch vụ: nút "Chọn gói" mở trang
 * chi tiết để cấu hình lựa chọn. */
export function ProductCard({ product, className }: ProductCardProps) {
  const t = usePick(STR);
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();

  const inStock = isInStock(product);
  const isService = product.kind === "service";
  const imageUrl = product.images[0] ?? null;
  const hasDiscount = !!product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.original_price! - product.price) / product.original_price!) * 100,
      )
    : 0;

  function handleAddToCart(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isService) {
      // Dịch vụ cần chọn gói/khoảng rank ở trang chi tiết.
      navigate(`/item/${product.id}`);
      return;
    }
    if (!inStock) return;
    addItem(product, 1);
    toast.success(t.addedToCart(product.name), {
      description: t.quantityOne,
    });
  }

  return (
    <Link
      to={`/item/${product.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200",
        "hover:-translate-y-1 hover:border-yellow hover:shadow-glow-amber",
        className,
      )}
    >
      <div className="relative flex h-32 items-center justify-center overflow-hidden bg-surface-2">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="font-heading text-2xl font-extrabold text-text-subtle">
            {initialsOf(product.name)}
          </span>
        )}
        {isService ? (
          <span className="absolute right-2 top-2 rounded-full bg-green-soft px-2 py-0.5 text-[10px] font-semibold text-green">
            {t.service}
          </span>
        ) : !inStock ? (
          <span
            className="absolute right-2 top-2 rounded-full border border-border-strong px-2 py-0.5 text-[10px] font-semibold text-text-disabled"
            style={{ backgroundColor: "rgba(16, 14, 9, 0.8)" }}
          >
            {t.outOfStock}
          </span>
        ) : null}
        {discountPercent > 0 ? (
          <span className="absolute left-2 top-2 rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-semibold text-danger">
            -{discountPercent}%
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {product.rarity ? <RarityBadge rarity={product.rarity} className="w-fit" /> : null}
        <h3 className="line-clamp-1 font-heading text-sm font-semibold text-text group-hover:text-yellow">
          {product.name}
        </h3>
        <PriceTag
          price={product.price}
          originalPrice={product.original_price}
          size="sm"
          className="mt-auto"
        />
        <Button
          type="button"
          size="sm"
          variant="primary"
          className="w-full"
          disabled={!isService && !inStock}
          onClick={handleAddToCart}
        >
          {isService ? (
            <>
              <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t.choosePackage}
            </>
          ) : (
            <>
              <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
              {inStock ? t.addToCart : t.outOfStock}
            </>
          )}
        </Button>
      </div>
    </Link>
  );
}
