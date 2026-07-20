import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Folder,
  ImageIcon,
  Pencil,
  Plus,
  Search,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  listCategories,
  listCategoryFolders,
  listProducts,
  setProductActive,
  upsertProduct,
} from "@/lib/db/catalog";
import { formatPrice } from "@/lib/format";
import type { ProductRow, ProductUpsert } from "@/types/db";
import { cn } from "@/lib/utils";
import { usePick } from "@/i18n";
import { Toggle } from "./Toggle";
import { EmptyBlock, LoadError, TableSkeleton } from "./States";

const STR = {
  vi: {
    opened: "Đã mở bán sản phẩm",
    hiddenProd: "Đã ẩn sản phẩm",
    searchPlaceholder: "Tìm theo tên sản phẩm…",
    allKinds: "Tất cả loại",
    item: "Vật phẩm",
    service: "Dịch vụ",
    account: "Tài khoản",
    activeAndHidden: "Đang bán + đã ẩn",
    activeOnly: "Đang bán",
    hiddenOnly: "Đã ẩn",
    add: "Thêm sản phẩm",
    emptyNone: "Danh mục này chưa có sản phẩm",
    emptyNoMatch: "Không có sản phẩm khớp bộ lọc",
    hintNone: 'Bấm "Thêm sản phẩm" để đăng bán sản phẩm đầu tiên.',
    hintNoMatch: "Thử đổi bộ lọc hoặc từ khóa tìm kiếm.",
    colProduct: "Sản phẩm",
    colKind: "Loại",
    colPrice: "Giá",
    colStock: "Kho",
    colFeatured: "Nổi bật",
    colActive: "Đang bán",
    colEdit: "Sửa",
    unfeature: "Bỏ nổi bật",
    feature: "Đánh dấu nổi bật",
    toggleActive: (name: string) => `Mở bán ${name}`,
    edit: "Sửa",
    perPage: (n: number) => `${n} / trang`,
    showing: (a: number, b: number, total: number) => `${a}–${b} / ${total}`,
    prev: "Trước",
    next: "Sau",
    pickCategory: "Chọn danh mục để xem sản phẩm",
    productsCount: (n: number) => `${n} sản phẩm`,
    backToCategories: "Tất cả danh mục",
    otherFolder: "Chưa xếp folder",
  },
  en: {
    opened: "Product is now on sale",
    hiddenProd: "Product hidden",
    searchPlaceholder: "Search by product name…",
    allKinds: "All types",
    item: "Item",
    service: "Service",
    account: "Account",
    activeAndHidden: "On sale + hidden",
    activeOnly: "On sale",
    hiddenOnly: "Hidden",
    add: "Add product",
    emptyNone: "This category has no products",
    emptyNoMatch: "No products match the filters",
    hintNone: 'Click "Add product" to list the first product.',
    hintNoMatch: "Try changing the filters or search term.",
    colProduct: "Product",
    colKind: "Type",
    colPrice: "Price",
    colStock: "Stock",
    colFeatured: "Featured",
    colActive: "On sale",
    colEdit: "Edit",
    unfeature: "Remove featured",
    feature: "Mark as featured",
    toggleActive: (name: string) => `Put ${name} on sale`,
    edit: "Edit",
    perPage: (n: number) => `${n} / page`,
    showing: (a: number, b: number, total: number) => `${a}–${b} of ${total}`,
    prev: "Prev",
    next: "Next",
    pickCategory: "Pick a category to see its products",
    productsCount: (n: number) => `${n} product${n === 1 ? "" : "s"}`,
    backToCategories: "All categories",
    otherFolder: "Unassigned",
  },
};

const PAGE_SIZES = [10, 20, 50, 100];

export interface ProductsTabProps {
  onCreate: (defaultCategoryId?: string) => void;
  onEdit: (product: ProductRow) => void;
}

/** Tab "Sản phẩm" — folder-first: chọn danh mục (game) rồi xem sản phẩm bên trong. */
export function ProductsTab({ onCreate, onEdit }: ProductsTabProps) {
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const [searchParams, setSearchParams] = useSearchParams();
  const catSlug = searchParams.get("cat"); // null | <category slug>

  const [kindFilter, setKindFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const productsQuery = useQuery({
    queryKey: ["products", "admin"],
    queryFn: () => listProducts({ activeOnly: false }),
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories", "admin"],
    queryFn: () => listCategories({ activeOnly: false }),
  });
  const foldersQuery = useQuery({ queryKey: ["category-folders"], queryFn: listCategoryFolders });

  const categories = categoriesQuery.data ?? [];
  const folders = foldersQuery.data ?? [];
  const folderIds = useMemo(() => new Set(folders.map((f) => f.id)), [folders]);

  const productCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of productsQuery.data ?? []) map.set(p.category_id, (map.get(p.category_id) ?? 0) + 1);
    return map;
  }, [productsQuery.data]);

  const openCat = catSlug ? categories.find((c) => c.slug === catSlug) ?? null : null;

  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setProductActive(id, active),
    onSuccess: (_data, vars) => {
      toast.success(vars.active ? t.opened : t.hiddenProd);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => toast.error(err.message),
  });
  const featuredMutation = useMutation({
    mutationFn: (input: ProductUpsert) => upsertProduct(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
    onError: (err) => toast.error(err.message),
  });

  const openCategory = (slug: string | null) => {
    setPage(1);
    setSearch("");
    setKindFilter("all");
    setActiveFilter("all");
    if (slug) setSearchParams({ cat: slug });
    else setSearchParams({});
  };

  const filtered = useMemo(() => {
    if (!openCat) return [];
    const term = search.trim().toLowerCase();
    return (productsQuery.data ?? []).filter((product) => {
      if (product.category_id !== openCat.id) return false;
      if (kindFilter !== "all" && product.kind !== kindFilter) return false;
      if (activeFilter === "active" && !product.is_active) return false;
      if (activeFilter === "hidden" && product.is_active) return false;
      if (term && !product.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [productsQuery.data, openCat, kindFilter, activeFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [kindFilter, activeFilter, search, pageSize, catSlug]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(pageStart, pageStart + pageSize);

  // ============ MÀN DANH SÁCH DANH MỤC (thẻ, nhóm theo folder) ============
  if (!openCat) {
    const groups: Array<{ name: string | null; items: typeof categories }> = [];
    for (const f of folders) {
      const items = categories.filter((c) => c.folder_id === f.id);
      if (items.length > 0) groups.push({ name: f.name, items });
    }
    const unf = categories.filter((c) => !c.folder_id || !folderIds.has(c.folder_id));
    if (unf.length > 0) groups.push({ name: groups.length > 0 ? t.otherFolder : null, items: unf });

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-heading text-sm font-semibold text-text">{t.pickCategory}</p>
          <Button size="sm" onClick={() => onCreate()}>
            <Plus className="h-4 w-4" aria-hidden />
            {t.add}
          </Button>
        </div>

        {categoriesQuery.isPending || productsQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-2" />
            ))}
          </div>
        ) : (
          groups.map((g, gi) => (
            <div key={gi}>
              {g.name ? (
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-muted">
                  <Folder className="h-4 w-4 text-yellow" aria-hidden />
                  {g.name}
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => openCategory(c.slug)}
                    className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:border-yellow hover:shadow-glow-amber"
                  >
                    <span
                      className="h-10 w-10 shrink-0 rounded-xl border border-border-strong"
                      style={{ backgroundColor: c.accent_color ?? "transparent" }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-heading text-base font-semibold text-text group-hover:text-yellow">
                        {c.name}
                      </span>
                      <span className="block text-xs text-text-subtle">
                        {t.productsCount(productCounts.get(c.id) ?? 0)}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-text-subtle" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // ============ MÀN CHI TIẾT DANH MỤC (bảng sản phẩm) ============
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => openCategory(null)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t.backToCategories}
        </button>
        <ChevronRight className="h-4 w-4 text-text-subtle" aria-hidden />
        <span className="font-semibold text-text">{openCat.name}</span>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
              aria-hidden
            />
            <Input
              value={search}
              placeholder={t.searchPlaceholder}
              className="pl-9"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
            <option value="all">{t.allKinds}</option>
            <option value="item">{t.item}</option>
            <option value="service">{t.service}</option>
            <option value="account">{t.account}</option>
          </Select>
          <Select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
            <option value="all">{t.activeAndHidden}</option>
            <option value="active">{t.activeOnly}</option>
            <option value="hidden">{t.hiddenOnly}</option>
          </Select>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Select
            value={String(pageSize)}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="w-auto"
            aria-label={t.perPage(pageSize)}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {t.perPage(n)}
              </option>
            ))}
          </Select>
          <Button size="sm" onClick={() => onCreate(openCat.id)}>
            <Plus className="h-4 w-4" aria-hidden />
            {t.add}
          </Button>
        </div>
      </div>

      {productsQuery.isPending ? (
        <TableSkeleton rows={6} />
      ) : productsQuery.isError ? (
        <LoadError message={productsQuery.error.message} onRetry={() => productsQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyBlock
          title={search || kindFilter !== "all" || activeFilter !== "all" ? t.emptyNoMatch : t.emptyNone}
          hint={search || kindFilter !== "all" || activeFilter !== "all" ? t.hintNoMatch : t.hintNone}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                  <th className="px-4 py-3">{t.colProduct}</th>
                  <th className="px-4 py-3">{t.colKind}</th>
                  <th className="px-4 py-3 text-right">{t.colPrice}</th>
                  <th className="px-4 py-3 text-center">{t.colStock}</th>
                  <th className="px-4 py-3 text-center">{t.colFeatured}</th>
                  <th className="px-4 py-3 text-center">{t.colActive}</th>
                  <th className="px-4 py-3 text-right">{t.colEdit}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((product) => (
                  <tr
                    key={product.id}
                    className={cn("border-b border-border last:border-0", !product.is_active && "opacity-60")}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-text-subtle">
                            <ImageIcon className="h-4 w-4" aria-hidden />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="max-w-[260px] truncate font-medium text-text">{product.name}</p>
                          <p className="max-w-[260px] truncate font-mono text-xs text-text-subtle">
                            /{product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {product.kind === "service" ? (
                        <Badge variant="gold">{t.service}</Badge>
                      ) : product.kind === "account" ? (
                        <Badge variant="green">{t.account}</Badge>
                      ) : (
                        <Badge>{t.item}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums-mono text-text">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono tabular-nums-mono text-text-muted">
                      {product.kind === "service" ? "—" : (product.stock ?? "∞")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        title={product.is_featured ? t.unfeature : t.feature}
                        disabled={featuredMutation.isPending}
                        onClick={() =>
                          featuredMutation.mutate({
                            id: product.id,
                            category_id: product.category_id,
                            slug: product.slug,
                            kind: product.kind,
                            name: product.name,
                            price: product.price,
                            is_featured: !product.is_featured,
                          })
                        }
                        className="rounded-md p-1.5 transition-colors hover:bg-surface-2 disabled:opacity-50"
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            product.is_featured ? "fill-yellow text-yellow" : "text-text-subtle",
                          )}
                          aria-hidden
                        />
                        <span className="sr-only">{product.is_featured ? t.unfeature : t.feature}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={product.is_active}
                        disabled={activeMutation.isPending}
                        label={t.toggleActive(product.name)}
                        onCheckedChange={(active) => activeMutation.mutate({ id: product.id, active })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          {t.edit}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > pageSize ? (
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
              <span className="text-xs text-text-subtle">
                {t.showing(pageStart + 1, Math.min(pageStart + pageSize, filtered.length), filtered.length)}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  {t.prev}
                </Button>
                <span className="px-2 text-sm tabular-nums-mono text-text-muted">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  {t.next}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
