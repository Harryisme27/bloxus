import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest";

/** Lọc theo loại sản phẩm: tất cả / vật phẩm / dịch vụ. */
export type KindFilter = "all" | "item" | "service";

export interface ItemFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  kind: KindFilter;
  onKindChange: (value: KindFilter) => void;
  rarity: string;
  onRarityChange: (value: string) => void;
  /** Danh sách độ hiếm có thật trong danh mục (suy ra từ products.rarity). */
  rarityTiers: string[];
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  className?: string;
}

/** Controlled filter bar for a category's product grid: search + kind + rarity + sort. */
export function ItemFilters({
  search,
  onSearchChange,
  kind,
  onKindChange,
  rarity,
  onRarityChange,
  rarityTiers,
  sort,
  onSortChange,
  className,
}: ItemFiltersProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      <div className="relative sm:col-span-2 lg:col-span-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm vật phẩm…"
          className="pl-9"
          aria-label="Tìm vật phẩm"
        />
      </div>

      <Select
        value={kind}
        onChange={(e) => onKindChange(e.target.value as KindFilter)}
        aria-label="Lọc theo loại"
      >
        <option value="all">Tất cả loại</option>
        <option value="item">Vật phẩm</option>
        <option value="service">Dịch vụ</option>
      </Select>

      <Select
        value={rarity}
        onChange={(e) => onRarityChange(e.target.value)}
        aria-label="Lọc theo độ hiếm"
        disabled={rarityTiers.length === 0}
      >
        <option value="all">Tất cả độ hiếm</option>
        {rarityTiers.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </Select>

      <Select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortKey)}
        aria-label="Sắp xếp"
      >
        <option value="featured">Nổi bật</option>
        <option value="price-asc">Giá: thấp → cao</option>
        <option value="price-desc">Giá: cao → thấp</option>
        <option value="newest">Mới nhất</option>
      </Select>
    </div>
  );
}
