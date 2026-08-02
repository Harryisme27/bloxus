import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatPrice } from "@/lib/format";
import type { GameTrait } from "@/lib/gameRarities";
import { useCurrencyStore, USD_VND_RATE } from "@/store/currencyStore";
import { usePick } from "@/i18n";
import { cn } from "@/lib/utils";

const STR = {
  vi: {
    searchPlaceholder: "Tìm vật phẩm…",
    searchAria: "Tìm vật phẩm",
    itemTypeAria: "Lọc theo item type",
    allItemTypes: "Item Type",
    sectionAria: "Lọc theo khu vực",
    allSections: "Tất cả loại",
    otherSection: "Khác",
    traitsAria: "Lọc theo trait",
    allTraits: "Traits",
    kindAria: "Lọc theo loại",
    allKinds: "Tất cả loại",
    item: "Vật phẩm",
    account: "Tài khoản",
    service: "Dịch vụ",
    currency: "Currency",
    rarityAria: "Lọc theo độ hiếm",
    allRarities: "Tất cả độ hiếm",
    priceAria: "Lọc theo giá",
    priceLabel: "Giá",
    from: "Từ",
    to: "Đến",
    applyPriceAria: "Áp dụng khoảng giá",
    over: (p: string) => `${p}+`,
    sortAria: "Sắp xếp",
    featured: "Nổi bật",
    priceAsc: "Giá: thấp → cao",
    priceDesc: "Giá: cao → thấp",
    newest: "Mới nhất",
    clearFilters: "Xoá bộ lọc",
  },
  en: {
    searchPlaceholder: "Search items…",
    searchAria: "Search items",
    itemTypeAria: "Filter by item type",
    allItemTypes: "Item Type",
    sectionAria: "Filter by section",
    allSections: "All types",
    otherSection: "Other",
    traitsAria: "Filter by trait",
    allTraits: "Traits",
    kindAria: "Filter by type",
    allKinds: "All types",
    item: "Item",
    account: "Account",
    service: "Service",
    currency: "Currency",
    rarityAria: "Filter by rarity",
    allRarities: "All rarities",
    priceAria: "Filter by price",
    priceLabel: "Price",
    from: "From",
    to: "To",
    applyPriceAria: "Apply price range",
    over: (p: string) => `${p}+`,
    sortAria: "Sort",
    featured: "Featured",
    priceAsc: "Price: low → high",
    priceDesc: "Price: high → low",
    newest: "Newest",
    clearFilters: "Clear filters",
  },
};

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest";

/** Lọc theo loại sản phẩm: tất cả / vật phẩm / tài khoản / dịch vụ / currency. */
export type KindFilter = "all" | "item" | "account" | "service" | "currency";

/** Khoảng giá đang lọc (VND — giá lưu bằng VND). null = không lọc.
 * max = Infinity nghĩa là không chặn trên. */
export type PriceRange = { min: number; max: number } | null;

/** Các khoảng giá gợi ý sẵn (VND). */
const PRICE_PRESETS: Array<{ min: number; max: number }> = [
  { min: 0, max: 50_000 },
  { min: 50_000, max: 100_000 },
  { min: 100_000, max: 200_000 },
  { min: 200_000, max: 500_000 },
  { min: 500_000, max: Infinity },
];

/** true nếu giá (VND) nằm trong khoảng đã chọn. */
export function matchesPrice(range: PriceRange, price: number): boolean {
  if (!range) return true;
  return price >= range.min && (range.max === Infinity || price <= range.max);
}

/** Nhãn hiển thị cho một khoảng giá, quy đổi theo tiền tệ đang xem. */
function rangeLabel(range: { min: number; max: number }, over: (p: string) => string): string {
  if (range.max === Infinity) return over(formatPrice(range.min));
  return `${formatPrice(range.min)} – ${formatPrice(range.max)}`;
}

/** Dropdown "Giá": ô Từ/Đến tự nhập + danh sách khoảng gợi ý (giống các chợ game). */
function PriceDropdown({
  value,
  onChange,
}: {
  value: PriceRange;
  onChange: (range: PriceRange) => void;
}) {
  const t = usePick(STR);
  const currency = useCurrencyStore((s) => s.currency);
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [fromStr, setFromStr] = useState("");
  const [toStr, setToStr] = useState("");

  // Đóng khi click ra ngoài / Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Nhập theo tiền tệ đang xem; USD -> quy về VND để lọc.
  const toVnd = (n: number) => (currency === "usd" ? Math.round(n * USD_VND_RATE) : n);
  const symbol = currency === "usd" ? "$" : "₫";

  function applyCustom() {
    const from = parseFloat(fromStr);
    const to = parseFloat(toStr);
    const min = Number.isFinite(from) && from > 0 ? toVnd(from) : 0;
    const max = Number.isFinite(to) && to > 0 ? toVnd(to) : Infinity;
    if (min === 0 && max === Infinity) onChange(null);
    else onChange({ min, max: max < min ? Infinity : max });
    setOpen(false);
  }

  function pickPreset(preset: { min: number; max: number }) {
    onChange(preset);
    setFromStr("");
    setToStr("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={t.priceAria}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-surface-2 px-3 text-left text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow",
          value ? "border-yellow text-text" : "border-border-strong text-text",
        )}
      >
        <span className="truncate">{value ? rangeLabel(value, t.over) : t.priceLabel}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-text-subtle transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-xl border border-border-strong bg-surface shadow-xl">
          {/* Từ – Đến + nút áp dụng */}
          <div className="flex items-center gap-2 border-b border-border p-3">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-subtle">
                {symbol}
              </span>
              <Input
                type="number"
                min={0}
                inputMode="decimal"
                placeholder={t.from}
                value={fromStr}
                onChange={(e) => setFromStr(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyCustom()}
                className="pl-7"
                aria-label={t.from}
              />
            </div>
            <span className="text-text-subtle">–</span>
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-subtle">
                {symbol}
              </span>
              <Input
                type="number"
                min={0}
                inputMode="decimal"
                placeholder={t.to}
                value={toStr}
                onChange={(e) => setToStr(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyCustom()}
                className="pl-7"
                aria-label={t.to}
              />
            </div>
            <button
              type="button"
              onClick={applyCustom}
              aria-label={t.applyPriceAria}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow text-text-on-yellow transition-colors hover:bg-yellow-hover"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Khoảng giá gợi ý sẵn */}
          <div className="py-1.5">
            {PRICE_PRESETS.map((preset) => {
              const active =
                !!value && value.min === preset.min && value.max === preset.max;
              return (
                <button
                  key={`${preset.min}-${preset.max}`}
                  type="button"
                  onClick={() => pickPreset(preset)}
                  className={cn(
                    "block w-full px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-surface-2",
                    active ? "text-yellow" : "text-text",
                  )}
                >
                  {rangeLabel(preset, t.over)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export interface ItemFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** Item type riêng theo game (VD MM2: Chroma/FX/Other). "all" = không lọc. */
  itemType?: string;
  onItemTypeChange?: (value: string) => void;
  /** Danh sách item type của game — [] thì ẩn dropdown. */
  itemTypes?: string[];
  /** Khu vực (sections) của game: "all" | tên khu | "__other__". */
  section?: string;
  onSectionChange?: (value: string) => void;
  /** Danh sách khu admin đặt — [] thì ẩn dropdown. */
  sections?: string[];
  /** Nhãn dropdown khu vực (VD PS99: "Item Type") — mặc định "All types". */
  sectionFilterLabel?: string;
  /** Bộ lọc theo tag tự do (VD Adopt Me: tên pet/egg). "all" = không lọc. */
  tagFilter?: string;
  onTagFilterChange?: (value: string) => void;
  /** Danh sách tag có thật trong danh mục — [] thì ẩn dropdown. */
  tagOptions?: string[];
  /** Nhãn hiển thị của dropdown tag (VD "Pets & Eggs"). */
  tagFilterLabel?: string;
  /** Trait pet theo game (VD Adopt Me: N/FR/NFR…). "all" = không lọc. */
  trait?: string;
  onTraitChange?: (value: string) => void;
  /** Danh sách trait của game — [] thì ẩn dropdown. */
  traits?: GameTrait[];
  /** Nhãn dropdown trait (VD "Traits", "Pet Power"). */
  traitFilterLabel?: string;
  /** Ẩn dropdown loại sản phẩm (item/service) — dùng khi game đã có Item Type riêng. */
  hideKind?: boolean;
  kind: KindFilter;
  onKindChange: (value: KindFilter) => void;
  rarity: string;
  onRarityChange: (value: string) => void;
  /** Danh sách độ hiếm có thật trong danh mục (suy ra từ products.rarity). */
  rarityTiers: string[];
  price: PriceRange;
  onPriceChange: (value: PriceRange) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  /** Đưa mọi bộ lọc về mặc định. */
  onClear: () => void;
  className?: string;
}

/** Controlled filter bar for a category's product grid:
 * search + kind + rarity + price + sort + clear. */
export function ItemFilters({
  search,
  onSearchChange,
  itemType = "all",
  onItemTypeChange,
  itemTypes = [],
  section = "all",
  onSectionChange,
  sections = [],
  sectionFilterLabel,
  tagFilter = "all",
  onTagFilterChange,
  tagOptions = [],
  tagFilterLabel,
  trait = "all",
  onTraitChange,
  traits = [],
  traitFilterLabel,
  hideKind = false,
  kind,
  onKindChange,
  rarity,
  onRarityChange,
  rarityTiers,
  price,
  onPriceChange,
  sort,
  onSortChange,
  onClear,
  className,
}: ItemFiltersProps) {
  const t = usePick(STR);

  const showItemType = itemTypes.length > 0 && !!onItemTypeChange;
  const showSection = sections.length > 0 && !!onSectionChange;
  const showTagFilter = tagOptions.length > 0 && !!onTagFilterChange && !!tagFilterLabel;
  const showTraits = traits.length > 0 && !!onTraitChange;
  const showKind = !hideKind;
  const hasActive =
    search.trim() !== "" ||
    kind !== "all" ||
    rarity !== "all" ||
    itemType !== "all" ||
    section !== "all" ||
    tagFilter !== "all" ||
    trait !== "all" ||
    price !== null ||
    sort !== "featured";

  // Số cột lưới = số control đang hiện (search + các dropdown).
  const showRarity = rarityTiers.length > 0;
  const cols =
    3 +
    (showRarity ? 1 : 0) +
    (showItemType ? 1 : 0) +
    (showSection ? 1 : 0) +
    (showTagFilter ? 1 : 0) +
    (showTraits ? 1 : 0) +
    (showKind ? 1 : 0);

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2",
        cols === 3 && "lg:grid-cols-3",
        cols === 4 && "lg:grid-cols-4",
        cols === 5 && "lg:grid-cols-5",
        cols === 6 && "lg:grid-cols-6",
        cols === 7 && "lg:grid-cols-7",
        cols === 8 && "lg:grid-cols-8",
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

      {showSection ? (
        <Select
          value={section}
          onChange={(e) => onSectionChange!(e.target.value)}
          aria-label={t.sectionAria}
        >
          <option value="all">{sectionFilterLabel ?? t.allSections}</option>
          {sections.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          {/* "Other" luôn có mặt: gom sản phẩm chưa phân khu. */}
          <option value="__other__">{t.otherSection}</option>
        </Select>
      ) : null}

      {showItemType ? (
        <Select
          value={itemType}
          onChange={(e) => onItemTypeChange!(e.target.value)}
          aria-label={t.itemTypeAria}
        >
          <option value="all">{t.allItemTypes}</option>
          {itemTypes.map((it) => (
            <option key={it} value={it}>
              {it}
            </option>
          ))}
        </Select>
      ) : null}

      {/* Độ hiếm đứng trước các bộ lọc đặc thù (Pet Power…) — game tắt độ hiếm
          (danh sách rỗng) thì ẩn hẳn. */}
      {rarityTiers.length > 0 ? (
        <Select
          value={rarity}
          onChange={(e) => onRarityChange(e.target.value)}
          aria-label={t.rarityAria}
        >
          <option value="all">{t.allRarities}</option>
          {rarityTiers.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      ) : null}

      {showTagFilter ? (
        <Select
          value={tagFilter}
          onChange={(e) => onTagFilterChange!(e.target.value)}
          aria-label={tagFilterLabel}
        >
          <option value="all">{tagFilterLabel}</option>
          {tagOptions.map((tg) => (
            <option key={tg} value={tg}>
              {tg}
            </option>
          ))}
        </Select>
      ) : null}

      {showTraits ? (
        <Select value={trait} onChange={(e) => onTraitChange!(e.target.value)} aria-label={t.traitsAria}>
          <option value="all">{traitFilterLabel ?? t.allTraits}</option>
          {traits.map((tr) => (
            <option key={tr.code} value={tr.code}>
              {/* Code trùng label (VD "Huge") thì khỏi lặp lại trong ngoặc. */}
              {tr.code === tr.label ? tr.code : `${tr.code} (${tr.label})`}
            </option>
          ))}
        </Select>
      ) : null}

      {showKind ? (
        <Select
          value={kind}
          onChange={(e) => onKindChange(e.target.value as KindFilter)}
          aria-label={t.kindAria}
        >
          <option value="all">{t.allKinds}</option>
          <option value="item">{t.item}</option>
          <option value="account">{t.account}</option>
          <option value="service">{t.service}</option>
          <option value="currency">{t.currency}</option>
        </Select>
      ) : null}

      <PriceDropdown value={price} onChange={onPriceChange} />

      <div className="flex items-center gap-3">
        <Select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          aria-label={t.sortAria}
          className="flex-1"
        >
          <option value="featured">{t.featured}</option>
          <option value="price-asc">{t.priceAsc}</option>
          <option value="price-desc">{t.priceDesc}</option>
          <option value="newest">{t.newest}</option>
        </Select>
        {hasActive ? (
          <button
            type="button"
            onClick={onClear}
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-text-muted underline underline-offset-4 transition-colors hover:text-yellow"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            {t.clearFilters}
          </button>
        ) : null}
      </div>
    </div>
  );
}
