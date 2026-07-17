import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { usePick } from "@/i18n";
import { cn } from "@/lib/utils";

const STR = {
  vi: {
    searchPlaceholder: "Tìm vật phẩm…",
    searchAria: "Tìm vật phẩm",
    kindAria: "Lọc theo loại",
    allKinds: "Tất cả loại",
    item: "Vật phẩm",
    service: "Dịch vụ",
    rarityAria: "Lọc theo độ hiếm",
    allRarities: "Tất cả độ hiếm",
    sortAria: "Sắp xếp",
    featured: "Nổi bật",
    priceAsc: "Giá: thấp → cao",
    priceDesc: "Giá: cao → thấp",
    newest: "Mới nhất",
  },
  en: {
    searchPlaceholder: "Search items…",
    searchAria: "Search items",
    kindAria: "Filter by type",
    allKinds: "All types",
    item: "Item",
    service: "Service",
    rarityAria: "Filter by rarity",
    allRarities: "All rarities",
    sortAria: "Sort",
    featured: "Featured",
    priceAsc: "Price: low → high",
    priceDesc: "Price: high → low",
    newest: "Newest",
  },
};

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
  const t = usePick(STR);
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
          placeholder={t.searchPlaceholder}
          className="pl-9"
          aria-label={t.searchAria}
        />
      </div>

      <Select
        value={kind}
        onChange={(e) => onKindChange(e.target.value as KindFilter)}
        aria-label={t.kindAria}
      >
        <option value="all">{t.allKinds}</option>
        <option value="item">{t.item}</option>
        <option value="service">{t.service}</option>
      </Select>

      <Select
        value={rarity}
        onChange={(e) => onRarityChange(e.target.value)}
        aria-label={t.rarityAria}
        disabled={rarityTiers.length === 0}
      >
        <option value="all">{t.allRarities}</option>
        {rarityTiers.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </Select>

      <Select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortKey)}
        aria-label={t.sortAria}
      >
        <option value="featured">{t.featured}</option>
        <option value="price-asc">{t.priceAsc}</option>
        <option value="price-desc">{t.priceDesc}</option>
        <option value="newest">{t.newest}</option>
      </Select>
    </div>
  );
}
