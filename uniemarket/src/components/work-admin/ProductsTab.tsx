import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageIcon, Pencil, Plus, Search, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { listCategories, listProducts, setProductActive, upsertProduct } from "@/lib/db/catalog";
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
    allCategories: "Tất cả danh mục",
    allKinds: "Tất cả loại",
    item: "Vật phẩm",
    service: "Dịch vụ",
    activeAndHidden: "Đang bán + đã ẩn",
    activeOnly: "Đang bán",
    hiddenOnly: "Đã ẩn",
    add: "Thêm sản phẩm",
    emptyNone: "Chưa có sản phẩm nào",
    emptyNoMatch: "Không có sản phẩm khớp bộ lọc",
    hintNone: 'Bấm "Thêm sản phẩm" để đăng bán vật phẩm hoặc dịch vụ đầu tiên.',
    hintNoMatch: "Thử đổi bộ lọc hoặc từ khóa tìm kiếm.",
    colProduct: "Sản phẩm",
    colCategory: "Danh mục",
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
  },
  en: {
    opened: "Product is now on sale",
    hiddenProd: "Product hidden",
    searchPlaceholder: "Search by product name…",
    allCategories: "All categories",
    allKinds: "All types",
    item: "Item",
    service: "Service",
    activeAndHidden: "On sale + hidden",
    activeOnly: "On sale",
    hiddenOnly: "Hidden",
    add: "Add product",
    emptyNone: "No products yet",
    emptyNoMatch: "No products match the filters",
    hintNone: 'Click "Add product" to list your first item or service.',
    hintNoMatch: "Try changing the filters or search term.",
    colProduct: "Product",
    colCategory: "Category",
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
  },
};

export interface ProductsTabProps {
  onCreate: () => void;
  onEdit: (product: ProductRow) => void;
}

/** Tab "Sản phẩm" trong /work/catalog — bảng sản phẩm có lọc + bật/tắt bán. */
export function ProductsTab({ onCreate, onEdit }: ProductsTabProps) {
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const productsQuery = useQuery({
    queryKey: ["products", "admin"],
    queryFn: () => listProducts({ activeOnly: false }),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", "admin"],
    queryFn: () => listCategories({ activeOnly: false }),
  });

  const categoryNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categoriesQuery.data ?? []) map.set(category.id, category.name);
    return map;
  }, [categoriesQuery.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (productsQuery.data ?? []).filter((product) => {
      if (categoryFilter !== "all" && product.category_id !== categoryFilter) return false;
      if (kindFilter !== "all" && product.kind !== kindFilter) return false;
      if (activeFilter === "active" && !product.is_active) return false;
      if (activeFilter === "hidden" && product.is_active) return false;
      if (term && !product.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [productsQuery.data, categoryFilter, kindFilter, activeFilter, search]);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
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
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">{t.allCategories}</option>
            {(categoriesQuery.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
            <option value="all">{t.allKinds}</option>
            <option value="item">{t.item}</option>
            <option value="service">{t.service}</option>
          </Select>
          <Select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
            <option value="all">{t.activeAndHidden}</option>
            <option value="active">{t.activeOnly}</option>
            <option value="hidden">{t.hiddenOnly}</option>
          </Select>
        </div>
        <Button size="sm" className="shrink-0" onClick={onCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          {t.add}
        </Button>
      </div>

      {productsQuery.isPending ? (
        <TableSkeleton rows={6} />
      ) : productsQuery.isError ? (
        <LoadError message={productsQuery.error.message} onRetry={() => productsQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyBlock
          title={(productsQuery.data ?? []).length === 0 ? t.emptyNone : t.emptyNoMatch}
          hint={(productsQuery.data ?? []).length === 0 ? t.hintNone : t.hintNoMatch}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                  <th className="px-4 py-3">{t.colProduct}</th>
                  <th className="px-4 py-3">{t.colCategory}</th>
                  <th className="px-4 py-3">{t.colKind}</th>
                  <th className="px-4 py-3 text-right">{t.colPrice}</th>
                  <th className="px-4 py-3 text-center">{t.colStock}</th>
                  <th className="px-4 py-3 text-center">{t.colFeatured}</th>
                  <th className="px-4 py-3 text-center">{t.colActive}</th>
                  <th className="px-4 py-3 text-right">{t.colEdit}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    className={cn(
                      "border-b border-border last:border-0",
                      !product.is_active && "opacity-60",
                    )}
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
                    <td className="px-4 py-3 text-text-muted">
                      {categoryNames.get(product.category_id) ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {product.kind === "service" ? (
                        <Badge variant="gold">{t.service}</Badge>
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
                        <span className="sr-only">
                          {product.is_featured ? t.unfeature : t.feature}
                        </span>
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
        </Card>
      )}
    </div>
  );
}
