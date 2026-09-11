import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  PackageSearch,
  ArrowLeft,
  Layers,
  LayoutGrid,
  Sprout,
  PawPrint,
  Wrench,
  PackageOpen,
  Egg,
  Shapes,
  Tag,
  Shirt,
  Swords,
  Crosshair,
  Gamepad2,
  Car,
  Baby,
  FlaskConical,
  Gift,
  Home,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/PageContainer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/storefront/Breadcrumbs";
import { EmptyState } from "@/components/storefront/EmptyState";
import {
  ItemFilters,
  matchesPrice,
  type KindFilter,
  type PriceRange,
  type SortKey,
} from "@/components/storefront/ItemFilters";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getCategoryBySlug, listProducts } from "@/lib/db/catalog";
import {
  ORIGINAL_EMAIL_TAG,
  itemTypeOptionsFor,
  kindTabsVisibleFor,
  rarityOptionsFor,
  sectionFilterLabelFor,
  tagFilterLabelFor,
  traitFilterLabelFor,
  traitsFor,
} from "@/lib/gameRarities";
import { cn } from "@/lib/utils";
import type { ProductRow } from "@/types/db";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    home: "Trang chủ",
    games: "Trò chơi",
    loadGameErrorTitle: "Không tải được trò chơi",
    connectError: "Có lỗi khi kết nối máy chủ. Kiểm tra mạng rồi thử lại nhé.",
    retry: "Thử lại",
    notFoundTitle: "Không tìm thấy trò chơi",
    notFoundDesc:
      "Trò chơi bạn tìm không tồn tại hoặc đã bị gỡ. Quay lại danh mục để khám phá thêm.",
    backToGames: "Về danh mục trò chơi",
    products: "sản phẩm",
    loadProductsErrorTitle: "Không tải được sản phẩm",
    emptyTitle: "Không có sản phẩm phù hợp",
    emptyDesc:
      "Không tìm thấy sản phẩm nào khớp với bộ lọc hiện tại. Thử điều chỉnh lại nhé.",
    clearFilters: "Xoá bộ lọc",
    allSections: "Tất cả",
    otherSection: "Khác",
    featuredCol: "Nổi bật",
    itemsCol: "Sản phẩm khác",
    tabAll: "Tất cả",
    tabItems: "Vật phẩm",
    tabAccounts: "Tài khoản",
    tabServices: "Dịch vụ",
    tabCurrency: "Currency",
    kindTabsAria: "Loại sản phẩm",
  },
  en: {
    home: "Home",
    games: "Games",
    loadGameErrorTitle: "Couldn't load the game",
    connectError: "There was a problem connecting to the server. Check your connection and try again.",
    retry: "Try again",
    notFoundTitle: "Game not found",
    notFoundDesc:
      "The game you're looking for doesn't exist or has been removed. Go back to the catalog to explore more.",
    backToGames: "Back to game catalog",
    products: "products",
    loadProductsErrorTitle: "Couldn't load products",
    emptyTitle: "No matching products",
    emptyDesc: "No products match the current filters. Try adjusting them.",
    clearFilters: "Clear filters",
    allSections: "All",
    otherSection: "Other",
    featuredCol: "Featured",
    itemsCol: "Other items",
    tabAll: "All",
    tabItems: "Items",
    tabAccounts: "Accounts",
    tabServices: "Services",
    tabCurrency: "Currency",
    kindTabsAria: "Product type",
  },
};

const DEFAULT_ACCENT = "#7CC35A";

export function GameDetail() {
  const t = usePick(STR);
  const { slug } = useParams<{ slug: string }>();

  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [rarity, setRarity] = useState("all");
  // Item type riêng theo game (VD MM2: Chroma/FX/Other) — khớp theo tag sản phẩm.
  const [itemType, setItemType] = useState("all");
  // Bộ lọc tag tự do (VD Adopt Me: tên pet/egg).
  const [tagFilter, setTagFilter] = useState("all");
  // Trait pet (VD Adopt Me: N/FR/NFR…) — khớp tag đúng mã trên sản phẩm.
  const [trait, setTrait] = useState("all");
  const [price, setPrice] = useState<PriceRange>(null);
  const [sort, setSort] = useState<SortKey>("featured");
  // Khu vực đang chọn: "all" | tên khu | "__other__" (sản phẩm chưa phân khu).
  const [section, setSection] = useState("all");

  const categoryQuery = useQuery({
    queryKey: ["category", slug],
    queryFn: () => getCategoryBySlug(slug!),
    enabled: isSupabaseConfigured && !!slug,
  });

  const productsQuery = useQuery({
    queryKey: ["products", slug],
    queryFn: () => listProducts({ categorySlug: slug! }),
    enabled: isSupabaseConfigured && !!slug && !!categoryQuery.data,
  });

  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  // Bộ độ hiếm chuẩn của game (đủ danh sách kể cả chưa có sản phẩm nào dùng),
  // cộng thêm giá trị lạ đang tồn tại trong sản phẩm để không mất lựa chọn lọc.
  // Item type (Chroma/FX…) KHÔNG phải độ hiếm nên loại khỏi danh sách này.
  const rarityTiers = useMemo(() => {
    const standard = rarityOptionsFor(slug);
    // Game tắt độ hiếm (danh sách rỗng) -> ẩn hẳn bộ lọc.
    if (standard.length === 0) return [];
    const itemTypes = itemTypeOptionsFor(slug);
    const extras = new Set<string>();
    for (const p of products) {
      if (p.rarity && !standard.includes(p.rarity) && !itemTypes.includes(p.rarity)) extras.add(p.rarity);
    }
    return [...standard, ...Array.from(extras).sort()];
  }, [slug, products]);

  // Danh sách khu admin đặt cho danh mục này (?? [] vì cột mới có thể chưa có).
  const sections = useMemo(
    () => categoryQuery.data?.sections ?? [],
    [categoryQuery.data],
  );

  const gameItemTypes = useMemo(() => itemTypeOptionsFor(slug), [slug]);

  const gameTraits = useMemo(() => traitsFor(slug), [slug]);

  // Bộ lọc tag tự do (VD Adopt Me: "Pets & Eggs") — lựa chọn lấy từ tags có
  // thật trong sản phẩm của danh mục, admin gõ tag mới là tự xuất hiện.
  // Mã trait (N/FR/NFR…) cũng lưu bằng tag nên loại khỏi danh sách này.
  const tagFilterLabel = useMemo(() => tagFilterLabelFor(slug), [slug]);
  const tagOptions = useMemo(() => {
    if (!tagFilterLabel) return [];
    const traitCodes = new Set(gameTraits.map((tr) => tr.code.toUpperCase()));
    const set = new Set<string>();
    for (const p of products) {
      for (const tg of p.tags) {
        const clean = tg.trim();
        if (clean && !traitCodes.has(clean.toUpperCase()) && clean.toLowerCase() !== ORIGINAL_EMAIL_TAG)
          set.add(clean);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tagFilterLabel, gameTraits, products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products.filter((p) => {
      if (kind !== "all" && p.kind !== kind) return false;
      if (rarity !== "all" && p.rarity !== rarity) return false;
      if (itemType !== "all") {
        // Khớp theo tag (không phân biệt hoa thường); "Other" = không mang tag
        // item type nào đã biết.
        const tagSet = p.tags.map((tg) => tg.toLowerCase());
        const known = gameItemTypes.filter((it) => it !== "Other").map((it) => it.toLowerCase());
        const matched = itemType === "Other"
          ? !known.some((it) => tagSet.includes(it))
          : tagSet.includes(itemType.toLowerCase());
        if (!matched) return false;
      }
      if (tagFilter !== "all" && !p.tags.some((tg) => tg.trim() === tagFilter)) return false;
      if (trait !== "all") {
        // "Other" = không mang trait/power nào trong danh sách đã biết.
        const codes = gameTraits.filter((tr) => tr.code !== "Other").map((tr) => tr.code.toUpperCase());
        const tagSet = p.tags.map((tg) => tg.trim().toUpperCase());
        const matched =
          trait === "Other"
            ? !codes.some((cd) => tagSet.includes(cd))
            : tagSet.includes(trait.toUpperCase());
        if (!matched) return false;
      }
      if (!matchesPrice(price, p.price)) return false;
      if (section !== "all") {
        const inKnownSection = !!p.section && sections.includes(p.section);
        if (section === "__other__" ? inKnownSection : p.section !== section) return false;
      }
      // Chỉ khớp theo TÊN sản phẩm (không dò mô tả — tránh "Chroma" dính cả
      // món khác chỉ vì mô tả nhắc tới).
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });

    list = [...list];
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "newest")
      list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    else list.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));

    return list;
  }, [products, search, kind, rarity, itemType, gameItemTypes, tagFilter, trait, gameTraits, price, sort, section, sections]);

  // Nhóm theo khu khi đang xem "Tất cả": [tên khu, sản phẩm][] theo thứ tự admin
  // đặt + nhóm "Khác" cuối cùng cho sản phẩm chưa phân khu.
  const grouped = useMemo(() => {
    if (sections.length === 0 || section !== "all") return null;
    const groups: Array<[string, typeof filtered]> = [];
    for (const s of sections) {
      const items = filtered.filter((p) => p.section === s);
      if (items.length > 0) groups.push([s, items]);
    }
    const other = filtered.filter((p) => !p.section || !sections.includes(p.section));
    if (other.length > 0) groups.push([t.otherSection, other]);
    return groups;
  }, [filtered, sections, section, t.otherSection]);

  if (!isSupabaseConfigured) {
    return (
      <PageContainer className="py-10 sm:py-14">
        <SetupNotice />
      </PageContainer>
    );
  }

  // Loading category → skeleton hero + grid.
  if (categoryQuery.isPending) {
    return (
      <PageContainer className="py-10 sm:py-14">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-4 h-5 w-96 max-w-full" />
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (categoryQuery.isError) {
    return (
      <PageContainer className="py-20">
        <EmptyState
          icon={PackageSearch}
          title={t.loadGameErrorTitle}
          description={t.connectError}
          action={
            <Button type="button" variant="primary" size="md" onClick={() => categoryQuery.refetch()}>
              {t.retry}
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const category = categoryQuery.data;

  // Not-found state
  if (!category) {
    return (
      <PageContainer className="py-20">
        <EmptyState
          icon={PackageSearch}
          title={t.notFoundTitle}
          description={t.notFoundDesc}
          action={
            <Link to="/games">
              <Button type="button" variant="primary" size="md">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t.backToGames}
              </Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const accent = category.accent_color || DEFAULT_ACCENT;

  const resetFilters = () => {
    setSearch("");
    setKind("all");
    setRarity("all");
    setItemType("all");
    setTagFilter("all");
    setTrait("all");
    setPrice(null);
    setSort("featured");
    setSection("all");
  };

  // Tab loại sản phẩm trên game bar — game có thể giới hạn danh sách tab
  // (VD PS99 chỉ hiện Items/Accounts/Currency).
  const visibleTabs = kindTabsVisibleFor(slug);
  const kindTabs: Array<{ value: KindFilter; label: string }> = (
    [
      { value: "all", label: t.tabAll },
      { value: "item", label: t.tabItems },
      { value: "account", label: t.tabAccounts },
      { value: "service", label: t.tabServices },
      { value: "currency", label: t.tabCurrency },
    ] as Array<{ value: KindFilter; label: string }>
  ).filter((tab) => !visibleTabs || visibleTabs.includes(tab.value));

  /** Icon cho từng khu vực — khớp theo tên (không phân biệt hoa thường),
   * tên lạ dùng icon Tag chung. */
  function sectionIcon(value: string): LucideIcon {
    const key = value.trim().toLowerCase();
    if (key === "all") return LayoutGrid;
    if (key === "__other__" || key === "other") return Shapes;
    if (key.startsWith("seedpack") || key.includes("pack")) return PackageOpen;
    if (key.startsWith("seed") || key.includes("hạt")) return Sprout;
    if (key.startsWith("pet wear")) return Shirt;
    if (key.startsWith("pet") || key.includes("thú")) return PawPrint;
    if (key.startsWith("gear") || key.includes("dụng cụ")) return Wrench;
    if (key.startsWith("egg") || key.includes("trứng")) return Egg;
    if (key.startsWith("knife") || key.startsWith("knives") || key.includes("dao")) return Swords;
    if (key.startsWith("gun") || key.includes("súng")) return Crosshair;
    if (key.startsWith("toy") || key.includes("đồ chơi")) return Gamepad2;
    if (key.startsWith("transport") || key.includes("xe")) return Car;
    if (key.startsWith("stroller")) return Baby;
    if (key.startsWith("potion") || key.includes("thuốc")) return FlaskConical;
    if (key.startsWith("gift") || key.includes("quà")) return Gift;
    if (key.startsWith("house") || key.includes("nhà")) return Home;
    return Tag;
  }

  return (
    <div>
      {/* Hero banner tinted with the category's accent color */}
      <section
        className="relative overflow-hidden border-b border-border"
        style={{
          background: `linear-gradient(135deg, ${accent}2E 0%, ${accent}10 45%, transparent 100%)`,
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background: `radial-gradient(circle at 15% 20%, ${accent}40, transparent 55%)`,
          }}
        />
        <PageContainer className="relative py-10 sm:py-14">
          <Breadcrumbs
            className="mb-6"
            items={[
              { label: t.home, to: "/" },
              { label: t.games, to: "/games" },
              { label: category.name },
            ]}
          />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                style={{
                  borderColor: `${accent}66`,
                  color: accent,
                  backgroundColor: `${accent}1A`,
                }}
              >
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                {products.length} {t.products}
              </span>
              <h1 className="mt-3 font-heading text-3xl font-extrabold text-text sm:text-4xl lg:text-5xl">
                {category.name}
              </h1>
              {category.tagline ? (
                <p className="mt-2 text-base font-medium text-text-muted">{category.tagline}</p>
              ) : null}
              {category.description ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
                  {category.description}
                </p>
              ) : null}
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Game bar dính dưới navbar: avatar + tên game bên trái, tab loại sản
          phẩm (Vật phẩm / Tài khoản / Dịch vụ) bên phải. */}
      <div className="sticky top-16 z-30 border-b border-border bg-bg/95 backdrop-blur">
        <PageContainer className="relative flex h-14 items-center gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {category.icon_url ? (
              <img
                src={category.icon_url}
                alt=""
                className="h-8 w-8 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-heading text-sm font-bold"
                style={{ backgroundColor: `${accent}26`, color: accent }}
                aria-hidden
              >
                {category.name.charAt(0)}
              </span>
            )}
            <span className="truncate font-heading text-sm font-bold text-text">{category.name}</span>
          </div>
          {/* Tab chia đều, căn giữa thanh; tên game giữ vị trí trái như cũ. */}
          <nav
            className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 sm:gap-8"
            aria-label={t.kindTabsAria}
          >
            {kindTabs.map((tab) => {
              const active = kind === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setKind(tab.value)}
                  aria-pressed={active}
                  className={cn(
                    "border-b-2 px-2.5 py-4 text-sm font-semibold transition-colors sm:px-3",
                    active ? "text-text" : "border-transparent text-text-muted hover:text-text",
                  )}
                  style={active ? { borderColor: accent } : undefined}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </PageContainer>
      </div>

      <PageContainer className="py-8 sm:py-10">
        <ItemFilters
          className="mb-6"
          search={search}
          onSearchChange={setSearch}
          section={section}
          onSectionChange={setSection}
          sections={sections}
          sectionFilterLabel={sectionFilterLabelFor(slug) ?? undefined}
          itemType={itemType}
          onItemTypeChange={setItemType}
          itemTypes={gameItemTypes}
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          tagOptions={tagOptions}
          tagFilterLabel={tagFilterLabel ?? undefined}
          trait={trait}
          onTraitChange={setTrait}
          traits={gameTraits}
          traitFilterLabel={traitFilterLabelFor(slug) ?? undefined}
          hideKind
          kind={kind}
          onKindChange={setKind}
          rarity={rarity}
          onRarityChange={setRarity}
          rarityTiers={rarityTiers}
          price={price}
          onPriceChange={setPrice}
          sort={sort}
          onSortChange={setSort}
          onClear={resetFilters}
        />

        {productsQuery.isPending ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : productsQuery.isError ? (
          <EmptyState
            icon={PackageSearch}
            title={t.loadProductsErrorTitle}
            description={t.connectError}
            action={
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => productsQuery.refetch()}
              >
                {t.retry}
              </Button>
            }
          />
        ) : filtered.length > 0 ? (
          <>
            {grouped ? (
              // Xem "Tất cả" + có khu: nhóm sản phẩm theo khu, đúng thứ tự admin đặt.
              <div className="space-y-10">
                {grouped.map(([name, items]) => {
                  const GroupIcon = sectionIcon(name);
                  return (
                  <section key={name}>
                    <div className="mb-4 flex items-center gap-3">
                      <span
                        className="h-6 w-1.5 rounded-full"
                        style={{ backgroundColor: accent }}
                        aria-hidden="true"
                      />
                      <GroupIcon className="h-5 w-5" style={{ color: accent }} aria-hidden="true" />
                      <h2 className="font-heading text-xl font-bold text-text">{name}</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {items.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </section>
                  );
                })}
              </div>
            ) : (
              <ProductColumns
                featured={filtered.filter((p) => p.is_featured)}
                others={filtered.filter((p) => !p.is_featured)}
                accent={accent}
                featuredLabel={t.featuredCol}
                othersLabel={t.itemsCol}
                countLabel={t.products}
              />
            )}
          </>
        ) : (
          <EmptyState
            icon={PackageSearch}
            title={t.emptyTitle}
            description={t.emptyDesc}
            action={
              <Button type="button" variant="secondary" size="sm" onClick={resetFilters}>
                {t.clearFilters}
              </Button>
            }
          />
        )}
      </PageContainer>
    </div>
  );
}

/** 2 cột: Nổi bật (trái) + Sản phẩm khác (phải). Nếu thiếu 1 nhóm -> lưới đầy đủ. */
function ProductColumns({
  featured,
  others,
  accent,
  featuredLabel,
  othersLabel,
  countLabel,
}: {
  featured: ProductRow[];
  others: ProductRow[];
  accent: string;
  featuredLabel: string;
  othersLabel: string;
  countLabel: string;
}) {
  // Chỉ 1 nhóm có hàng -> lưới thường (không cần tách section).
  if (featured.length === 0 || others.length === 0) {
    const all = featured.length > 0 ? featured : others;
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {all.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    );
  }
  // Featured lên trên, Other items xuống dưới (xếp dọc).
  return (
    <div className="space-y-10">
      <ProductColumn title={featuredLabel} accent={accent} items={featured} countLabel={countLabel} />
      <ProductColumn title={othersLabel} accent={accent} items={others} countLabel={countLabel} />
    </div>
  );
}

function ProductColumn({
  title,
  accent,
  items,
  countLabel,
}: {
  title: string;
  accent: string;
  items: ProductRow[];
  countLabel: string;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-6 w-1.5 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
        <h2 className="font-heading text-xl font-bold text-text">{title}</h2>
        <span className="text-sm text-text-subtle">
          {items.length} {countLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
