import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Folder,
  ImageIcon,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  deleteProducts,
  listCategories,
  listCategoryFolders,
  listProducts,
  setProductActive,
  setProductsActive,
  upsertProduct,
} from "@/lib/db/catalog";
import { useConfirm } from "@/components/ui/confirm";
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
    currency: "Currency",
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
    colSection: "Khu vực",
    allSections: "Tất cả khu",
    noSection: "Chưa phân khu",
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
    selectAll: "Chọn tất cả",
    selectedN: (n: number) => `Đã chọn ${n}`,
    bulkHide: "Ẩn",
    bulkShow: "Mở bán",
    bulkHidden: (n: number) => `Đã ẩn ${n} sản phẩm.`,
    bulkShown: (n: number) => `Đã mở bán ${n} sản phẩm.`,
    deleteLabel: "Xóa",
    deleteOneConfirm: (name: string) =>
      `XÓA HẲN sản phẩm "${name}"? Không khôi phục được (đơn hàng cũ vẫn giữ nguyên). Nếu chỉ muốn tạm gỡ khỏi cửa hàng, dùng nút Ẩn.`,
    deleteManyConfirm: (n: number) =>
      `XÓA HẲN ${n} sản phẩm đã chọn? Không khôi phục được (đơn hàng cũ vẫn giữ nguyên).`,
    deletedN: (n: number) => `Đã xóa ${n} sản phẩm.`,
  },
  en: {
    opened: "Product is now on sale",
    hiddenProd: "Product hidden",
    searchPlaceholder: "Search by product name…",
    allKinds: "All types",
    item: "Item",
    service: "Service",
    account: "Account",
    currency: "Currency",
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
    colSection: "Section",
    allSections: "All sections",
    noSection: "No section",
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
    selectAll: "Select all",
    selectedN: (n: number) => `${n} selected`,
    bulkHide: "Hide",
    bulkShow: "Put on sale",
    bulkHidden: (n: number) => `${n} products hidden.`,
    bulkShown: (n: number) => `${n} products on sale.`,
    deleteLabel: "Delete",
    deleteOneConfirm: (name: string) =>
      `PERMANENTLY delete product "${name}"? This cannot be undone (past orders keep their data). Use Hide if you just want it off the store.`,
    deleteManyConfirm: (n: number) =>
      `PERMANENTLY delete the ${n} selected products? This cannot be undone (past orders keep their data).`,
    deletedN: (n: number) => `${n} products deleted.`,
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
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const catSlug = searchParams.get("cat"); // null | <category slug>

  const [kindFilter, setKindFilter] = useState("all");
  // Lọc theo khu vực: "all" | tên khu | "__none__" (chưa phân khu).
  const [sectionFilter, setSectionFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
  // Xóa hẳn sản phẩm (1 hoặc nhiều) — đơn cũ giữ snapshot, không ảnh hưởng.
  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteProducts(ids),
    onSuccess: (_d, ids) => {
      toast.success(t.deletedN(ids.length));
      setSelected(new Set());
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  // Ẩn / mở bán hàng loạt các sản phẩm đã chọn.
  const bulkActiveMutation = useMutation({
    mutationFn: ({ ids, active }: { ids: string[]; active: boolean }) =>
      setProductsActive(ids, active),
    onSuccess: (_d, vars) => {
      toast.success(vars.active ? t.bulkShown(vars.ids.length) : t.bulkHidden(vars.ids.length));
      setSelected(new Set());
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const openCategory = (slug: string | null) => {
    setPage(1);
    setSearch("");
    setKindFilter("all");
    setSectionFilter("all");
    setActiveFilter("all");
    setSelected(new Set());
    if (slug) setSearchParams({ cat: slug });
    else setSearchParams({});
  };

  const filtered = useMemo(() => {
    if (!openCat) return [];
    const term = search.trim().toLowerCase();
    return (productsQuery.data ?? []).filter((product) => {
      if (product.category_id !== openCat.id) return false;
      if (kindFilter !== "all" && product.kind !== kindFilter) return false;
      if (sectionFilter !== "all") {
        if (sectionFilter === "__none__" ? !!product.section : product.section !== sectionFilter)
          return false;
      }
      if (activeFilter === "active" && !product.is_active) return false;
      if (activeFilter === "hidden" && product.is_active) return false;
      if (term && !product.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [productsQuery.data, openCat, kindFilter, sectionFilter, activeFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [kindFilter, sectionFilter, activeFilter, search, pageSize, catSlug]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(pageStart, pageStart + pageSize);

  // Chọn nhiều (áp trên trang hiện tại).
  const pageIds = paginated.map((p) => p.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected = pageIds.some((id) => selected.has(id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(pageIds));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

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
        <div
          className={cn(
            "grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2",
            (openCat?.sections ?? []).length > 0 ? "lg:grid-cols-4" : "lg:grid-cols-3",
          )}
        >
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
            <option value="currency">{t.currency}</option>
          </Select>
          {(openCat?.sections ?? []).length > 0 ? (
            <Select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
              <option value="all">{t.allSections}</option>
              {(openCat?.sections ?? []).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="__none__">{t.noSection}</option>
            </Select>
          ) : null}
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

      {/* Thanh thao tác hàng loạt — hiện khi có chọn */}
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-yellow bg-yellow-soft px-4 py-2.5">
          <span className="text-sm font-medium text-text">{t.selectedN(selected.size)}</span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={bulkActiveMutation.isPending}
              onClick={() => bulkActiveMutation.mutate({ ids: [...selected], active: false })}
            >
              <EyeOff className="h-3.5 w-3.5" aria-hidden />
              {t.bulkHide}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={bulkActiveMutation.isPending}
              onClick={() => bulkActiveMutation.mutate({ ids: [...selected], active: true })}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden />
              {t.bulkShow}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="text-danger"
              disabled={deleteMutation.isPending}
              onClick={async () => {
                const r = await confirm({
                  title: t.deleteLabel,
                  message: t.deleteManyConfirm(selected.size),
                  tone: "danger",
                });
                if (r.ok) deleteMutation.mutate([...selected]);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              {t.deleteLabel}
            </Button>
          </div>
        </div>
      ) : null}

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
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = !allSelected && someSelected;
                      }}
                      onChange={toggleAll}
                      aria-label={t.selectAll}
                      className="h-4 w-4 accent-yellow"
                    />
                  </th>
                  <th className="px-4 py-3">{t.colProduct}</th>
                  <th className="px-4 py-3">{t.colKind}</th>
                  <th className="px-4 py-3">{t.colSection}</th>
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
                    className={cn(
                      "border-b border-border last:border-0",
                      !product.is_active && "opacity-60",
                      selected.has(product.id) && "bg-yellow-soft/40",
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggleOne(product.id)}
                        aria-label={product.name}
                        className="h-4 w-4 accent-yellow"
                      />
                    </td>
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
                      ) : product.kind === "currency" ? (
                        <Badge variant="gold">{t.currency}</Badge>
                      ) : product.kind === "account" ? (
                        <Badge variant="green">{t.account}</Badge>
                      ) : (
                        <Badge>{t.item}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {product.section ?? <span className="text-text-subtle">—</span>}
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
                            product.is_featured ? "fill-lemon text-lemon" : "text-text-subtle",
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
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          {t.edit}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          className="text-danger hover:text-danger"
                          onClick={async () => {
                            const r = await confirm({
                              title: t.deleteLabel,
                              message: t.deleteOneConfirm(product.name),
                              tone: "danger",
                            });
                            if (r.ok) deleteMutation.mutate([product.id]);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          {t.deleteLabel}
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
