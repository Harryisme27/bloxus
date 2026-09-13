import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import type { CategoryRow } from "@/types/db";
import { usePick } from "@/i18n";
import { cn } from "@/lib/utils";

const STR = {
  vi: { products: "sản phẩm" },
  en: { products: "products" },
};

export interface GameCardProps {
  category: CategoryRow;
  /** Số sản phẩm đang bán (tuỳ chọn — chỉ hiện khi truyền vào). */
  productCount?: number;
  className?: string;
}

const DEFAULT_ACCENT = "#7CC35A";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

/** Clickable card linking to /games/:slug. Cover dùng icon_url thật nếu có,
 * fallback về gradient + chữ cái đầu tô màu accent của danh mục. */
export function GameCard({ category, productCount, className }: GameCardProps) {
  const t = usePick(STR);
  const accent = category.accent_color || DEFAULT_ACCENT;
  const cover = category.banner_url || category.icon_url;

  return (
    <Link
      to={`/games/${category.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200",
        "hover:-translate-y-1 hover:border-yellow hover:shadow-glow-amber",
        className,
      )}
    >
      <div
        className="relative flex h-32 items-center justify-center overflow-hidden sm:h-40"
        style={{
          background: `linear-gradient(135deg, ${accent}33 0%, ${accent}0D 60%, transparent 100%)`,
        }}
      >
        {cover ? (
          <>
            {/* Soft fill behind portrait/square artwork, so the card never has
                harsh empty bars while the complete source image stays visible. */}
            <img
              src={cover}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-xl"
            />
            <div className="absolute inset-0 bg-bg/10" aria-hidden="true" />
            <img
              src={cover}
              alt={category.name}
              loading="lazy"
              className="relative z-10 h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.025]"
            />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background: `radial-gradient(circle at 30% 20%, ${accent}55, transparent 60%)`,
              }}
              aria-hidden="true"
            />
            <span
              className="relative font-heading text-3xl font-extrabold tracking-tight sm:text-4xl"
              style={{ color: accent }}
            >
              {initialsOf(category.name)}
            </span>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-heading text-base font-semibold text-text group-hover:text-yellow">
          {category.name}
        </h3>
        {category.tagline ? (
          <p className="line-clamp-2 flex-1 text-sm text-text-muted">{category.tagline}</p>
        ) : null}
        {typeof productCount === "number" ? (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-text-subtle">
            <Package className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{productCount} {t.products}</span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
