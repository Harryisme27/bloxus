import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PackageSearch, Package, ArrowLeft, Layers } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/PageContainer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/storefront/Breadcrumbs";
import { EmptyState } from "@/components/storefront/EmptyState";
import { ItemFilters, type KindFilter, type SortKey } from "@/components/storefront/ItemFilters";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getCategoryBySlug, listProducts } from "@/lib/db/catalog";
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
  },
};

const DEFAULT_ACCENT = "#F5B01E";

export function GameDetail() {
  const t = usePick(STR);
  const { slug } = useParams<{ slug: string }>();

  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [rarity, setRarity] = useState("all");
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

  const rarityTiers = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.rarity) set.add(p.rarity);
    }
    return Array.from(set).sort();
  }, [products]);

  // Danh sách khu admin đặt cho danh mục này (?? [] vì cột mới có thể chưa có).
  const sections = useMemo(
    () => categoryQuery.data?.sections ?? [],
    [categoryQuery.data],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products.filter((p) => {
      if (kind !== "all" && p.kind !== kind) return false;
      if (rarity !== "all" && p.rarity !== rarity) return false;
      if (section !== "all") {
        const inKnownSection = !!p.section && sections.includes(p.section);
        if (section === "__other__" ? inKnownSection : p.section !== section) return false;
      }
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !(p.description ?? "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });

    list = [...list];
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "newest")
      list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    else list.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));

    return list;
  }, [products, search, kind, rarity, sort, section, sections]);

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
    setSort("featured");
    setSection("all");
  };

  const hasOther = products.some((p) => !p.section || !sections.includes(p.section));
  const sectionPills: Array<{ value: string; label: string }> = [
    { value: "all", label: t.allSections },
    ...sections.map((s) => ({ value: s, label: s })),
    ...(hasOther && sections.length > 0 ? [{ value: "__other__", label: t.otherSection }] : []),
  ];

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

      <PageContainer className="py-8 sm:py-10">
        {/* Thanh khu vực (bloxmart-style) — chỉ hiện khi admin đã đặt khu. */}
        {sections.length > 0 ? (
          <div className="mb-5 flex flex-wrap gap-2">
            {sectionPills.map((pill) => {
              const active = section === pill.value;
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setSection(pill.value)}
                  aria-pressed={active}
                  className="rounded-full border px-4 py-1.5 font-heading text-sm font-semibold transition-colors"
                  style={
                    active
                      ? { borderColor: accent, color: "#100E09", backgroundColor: accent }
                      : { borderColor: `${accent}55`, color: accent, backgroundColor: `${accent}14` }
                  }
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        ) : null}

        <ItemFilters
          className="mb-6"
          search={search}
          onSearchChange={setSearch}
          kind={kind}
          onKindChange={setKind}
          rarity={rarity}
          onRarityChange={setRarity}
          rarityTiers={rarityTiers}
          sort={sort}
          onSortChange={setSort}
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
            <p className="mb-4 flex items-center gap-1.5 text-sm text-text-subtle">
              <Package className="h-4 w-4" aria-hidden="true" />
              {filtered.length} / {products.length} {t.products}
            </p>
            {grouped ? (
              // Xem "Tất cả" + có khu: nhóm sản phẩm theo khu, đúng thứ tự admin đặt.
              <div className="space-y-10">
                {grouped.map(([name, items]) => (
                  <section key={name}>
                    <div className="mb-4 flex items-center gap-3">
                      <span
                        className="h-6 w-1.5 rounded-full"
                        style={{ backgroundColor: accent }}
                        aria-hidden="true"
                      />
                      <h2 className="font-heading text-xl font-bold text-text">{name}</h2>
                      <span className="text-sm text-text-subtle">
                        {items.length} {t.products}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {items.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </section>
                ))}
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
  // Chỉ 1 nhóm có hàng -> lưới thường (không cần chia cột).
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
  return (
    <div className="grid gap-8 lg:grid-cols-2">
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
      <div className="grid grid-cols-2 gap-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
