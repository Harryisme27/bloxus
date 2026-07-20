import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, EyeOff, FolderPlus, Pencil, Plus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  deleteCategory,
  listCategories,
  listProducts,
  upsertCategory,
  listCategoryFolders,
  upsertCategoryFolder,
  deleteCategoryFolder,
} from "@/lib/db/catalog";
import { slugify } from "./helpers";
import type { CategoryRow, CategoryUpsert } from "@/types/db";
import { cn } from "@/lib/utils";
import { usePick } from "@/i18n";
import { CategoryDialog } from "./CategoryDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { Toggle } from "./Toggle";
import { EmptyBlock, LoadError, TableSkeleton } from "./States";

const STR = {
  vi: {
    hidden: "Đã ẩn danh mục khỏi cửa hàng",
    count: (n: number) => `${n} danh mục`,
    add: "Thêm danh mục",
    emptyTitle: "Chưa có danh mục nào",
    emptyHint: 'Bấm "Thêm danh mục" để tạo danh mục đầu tiên cho cửa hàng.',
    colCategory: "Danh mục",
    colOrder: "Thứ tự",
    colProducts: "Sản phẩm",
    colFeatured: "Nổi bật",
    colVisible: "Đang hiển thị",
    colActions: "Thao tác",
    unfeature: "Bỏ nổi bật",
    feature: "Đánh dấu nổi bật",
    toggleVisible: (name: string) => `Hiển thị danh mục ${name}`,
    edit: "Sửa",
    hide: "Ẩn",
    confirmTitle: (name: string) => `Ẩn danh mục "${name}"?`,
    confirmDesc:
      "Danh mục sẽ bị ẩn khỏi cửa hàng, không xoá dữ liệu. Sản phẩm bên trong vẫn được giữ nguyên và bạn có thể bật hiển thị lại bất cứ lúc nào.",
    confirmLabel: "Ẩn danh mục",
    perPage: (n: number) => `${n} / trang`,
    showing: (a: number, b: number, total: number) => `${a}–${b} / ${total}`,
    prev: "Trước",
    next: "Sau",
    foldersTitle: "Folder (nhóm game)",
    foldersHint: "VD: Roblox, CS2 — gom các game cùng hệ để khách dễ tìm.",
    folderNamePh: "Tên folder mới…",
    addFolder: "Thêm folder",
    folderAdded: "Đã thêm folder.",
    folderDeleted: "Đã xoá folder.",
    folderDelConfirm: (name: string) => `Xoá folder "${name}"? Game bên trong sẽ về 'chưa xếp'.`,
    colFolder: "Folder",
    noFolder: "—",
  },
  en: {
    hidden: "Category hidden from the store",
    count: (n: number) => `${n} categories`,
    add: "Add category",
    emptyTitle: "No categories yet",
    emptyHint: 'Click "Add category" to create the store\'s first category.',
    colCategory: "Category",
    colOrder: "Order",
    colProducts: "Products",
    colFeatured: "Featured",
    colVisible: "Visible",
    colActions: "Actions",
    unfeature: "Remove featured",
    feature: "Mark as featured",
    toggleVisible: (name: string) => `Show category ${name}`,
    edit: "Edit",
    hide: "Hide",
    confirmTitle: (name: string) => `Hide category "${name}"?`,
    confirmDesc:
      "The category will be hidden from the store without deleting any data. Products inside are kept and you can make it visible again anytime.",
    confirmLabel: "Hide category",
    perPage: (n: number) => `${n} / page`,
    showing: (a: number, b: number, total: number) => `${a}–${b} of ${total}`,
    prev: "Prev",
    next: "Next",
    foldersTitle: "Folders (game groups)",
    foldersHint: "e.g. Roblox, CS2 — group games of the same platform so customers browse easily.",
    folderNamePh: "New folder name…",
    addFolder: "Add folder",
    folderAdded: "Folder added.",
    folderDeleted: "Folder deleted.",
    folderDelConfirm: (name: string) => `Delete folder "${name}"? Its games become 'unassigned'.`,
    colFolder: "Folder",
    noFolder: "—",
  },
};

/** Quản lý folder gọn: liệt kê chip + thêm/xoá. */
function FolderManager({ t }: { t: (typeof STR)["en"] }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const query = useQuery({ queryKey: ["category-folders"], queryFn: listCategoryFolders });

  const addMutation = useMutation({
    mutationFn: (n: string) =>
      upsertCategoryFolder({ name: n.trim(), slug: slugify(n.trim()) || "folder" }),
    onSuccess: () => {
      toast.success(t.folderAdded);
      setName("");
      void queryClient.invalidateQueries({ queryKey: ["category-folders"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });
  const delMutation = useMutation({
    mutationFn: (id: string) => deleteCategoryFolder(id),
    onSuccess: () => {
      toast.success(t.folderDeleted);
      void queryClient.invalidateQueries({ queryKey: ["category-folders"] });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const folders = query.data ?? [];

  return (
    <Card className="p-4">
      <p className="font-heading text-sm font-semibold text-text">{t.foldersTitle}</p>
      <p className="mt-0.5 text-xs text-text-subtle">{t.foldersHint}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {folders.map((f) => (
          <span
            key={f.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface-2 py-1 pl-3 pr-1.5 text-sm text-text"
          >
            {f.name}
            <button
              type="button"
              aria-label={`Delete ${f.name}`}
              disabled={delMutation.isPending}
              onClick={() => {
                if (confirm(t.folderDelConfirm(f.name))) delMutation.mutate(f.id);
              }}
              className="flex h-5 w-5 items-center justify-center rounded-full text-text-subtle hover:bg-danger-soft hover:text-danger"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </span>
        ))}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() && !addMutation.isPending) addMutation.mutate(name);
        }}
      >
        <Input
          value={name}
          placeholder={t.folderNamePh}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={!name.trim() || addMutation.isPending}>
          <FolderPlus className="h-4 w-4" aria-hidden />
          {t.addFolder}
        </Button>
      </form>
    </Card>
  );
}

const PAGE_SIZES = [10, 20, 50, 100];

/** Tab "Danh mục" trong /work/catalog — bảng danh mục + CRUD. */
export function CategoriesTab() {
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const [dialog, setDialog] = useState<{ open: boolean; category: CategoryRow | null }>({
    open: false,
    category: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const categoriesQuery = useQuery({
    queryKey: ["categories", "admin"],
    queryFn: () => listCategories({ activeOnly: false }),
  });

  const productsQuery = useQuery({
    queryKey: ["products", "admin"],
    queryFn: () => listProducts({ activeOnly: false }),
  });

  const productCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of productsQuery.data ?? []) {
      counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1);
    }
    return counts;
  }, [productsQuery.data]);

  const quickUpdateMutation = useMutation({
    mutationFn: (input: CategoryUpsert) => upsertCategory(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success(t.hidden);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const categories = categoriesQuery.data ?? [];

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const totalPages = Math.max(1, Math.ceil(categories.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const paginated = categories.slice(pageStart, pageStart + pageSize);

  return (
    <div className="space-y-4">
      <FolderManager t={t} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-muted">
          {categoriesQuery.isSuccess ? t.count(categories.length) : " "}
        </p>
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
          <Button size="sm" onClick={() => setDialog({ open: true, category: null })}>
            <Plus className="h-4 w-4" aria-hidden />
            {t.add}
          </Button>
        </div>
      </div>

      {categoriesQuery.isPending ? (
        <TableSkeleton rows={5} />
      ) : categoriesQuery.isError ? (
        <LoadError message={categoriesQuery.error.message} onRetry={() => categoriesQuery.refetch()} />
      ) : categories.length === 0 ? (
        <EmptyBlock title={t.emptyTitle} hint={t.emptyHint} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                  <th className="px-4 py-3">{t.colCategory}</th>
                  <th className="px-4 py-3 text-center">{t.colOrder}</th>
                  <th className="px-4 py-3 text-center">{t.colProducts}</th>
                  <th className="px-4 py-3 text-center">{t.colFeatured}</th>
                  <th className="px-4 py-3 text-center">{t.colVisible}</th>
                  <th className="px-4 py-3 text-right">{t.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((category) => (
                  <tr
                    key={category.id}
                    className={cn(
                      "border-b border-border last:border-0",
                      !category.is_active && "opacity-60",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full border border-border-strong"
                          style={{ backgroundColor: category.accent_color ?? "transparent" }}
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-text">{category.name}</p>
                          <p className="truncate font-mono text-xs text-text-subtle">/{category.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono tabular-nums-mono text-text-muted">
                      {category.sort_order}
                    </td>
                    <td className="px-4 py-3 text-center font-mono tabular-nums-mono text-text-muted">
                      {productsQuery.isSuccess ? (productCounts.get(category.id) ?? 0) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        title={category.is_featured ? t.unfeature : t.feature}
                        disabled={quickUpdateMutation.isPending}
                        onClick={() =>
                          quickUpdateMutation.mutate({
                            id: category.id,
                            slug: category.slug,
                            name: category.name,
                            is_featured: !category.is_featured,
                          })
                        }
                        className="rounded-md p-1.5 transition-colors hover:bg-surface-2 disabled:opacity-50"
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            category.is_featured ? "fill-yellow text-yellow" : "text-text-subtle",
                          )}
                          aria-hidden
                        />
                        <span className="sr-only">
                          {category.is_featured ? t.unfeature : t.feature}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={category.is_active}
                        disabled={quickUpdateMutation.isPending}
                        label={t.toggleVisible(category.name)}
                        onCheckedChange={(active) =>
                          quickUpdateMutation.mutate({
                            id: category.id,
                            slug: category.slug,
                            name: category.name,
                            is_active: active,
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDialog({ open: true, category })}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          {t.edit}
                        </Button>
                        {category.is_active ? (
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(category)}>
                            <EyeOff className="h-3.5 w-3.5" aria-hidden />
                            {t.hide}
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {categories.length > pageSize ? (
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
              <span className="text-xs text-text-subtle">
                {t.showing(pageStart + 1, Math.min(pageStart + pageSize, categories.length), categories.length)}
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

      <CategoryDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        category={dialog.category}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t.confirmTitle(deleteTarget?.name ?? "")}
        description={t.confirmDesc}
        confirmLabel={t.confirmLabel}
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
