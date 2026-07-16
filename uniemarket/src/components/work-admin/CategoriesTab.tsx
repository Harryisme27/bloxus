import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EyeOff, Pencil, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteCategory, listCategories, listProducts, upsertCategory } from "@/lib/db/catalog";
import type { CategoryRow, CategoryUpsert } from "@/types/db";
import { cn } from "@/lib/utils";
import { CategoryDialog } from "./CategoryDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { Toggle } from "./Toggle";
import { EmptyBlock, LoadError, TableSkeleton } from "./States";

/** Tab "Danh mục" trong /work/catalog — bảng danh mục + CRUD. */
export function CategoriesTab() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<{ open: boolean; category: CategoryRow | null }>({
    open: false,
    category: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);

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
      toast.success("Đã ẩn danh mục khỏi cửa hàng");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const categories = categoriesQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-muted">
          {categoriesQuery.isSuccess ? `${categories.length} danh mục` : " "}
        </p>
        <Button size="sm" onClick={() => setDialog({ open: true, category: null })}>
          <Plus className="h-4 w-4" aria-hidden />
          Thêm danh mục
        </Button>
      </div>

      {categoriesQuery.isPending ? (
        <TableSkeleton rows={5} />
      ) : categoriesQuery.isError ? (
        <LoadError message={categoriesQuery.error.message} onRetry={() => categoriesQuery.refetch()} />
      ) : categories.length === 0 ? (
        <EmptyBlock
          title="Chưa có danh mục nào"
          hint='Bấm "Thêm danh mục" để tạo danh mục đầu tiên cho cửa hàng.'
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                  <th className="px-4 py-3">Danh mục</th>
                  <th className="px-4 py-3 text-center">Thứ tự</th>
                  <th className="px-4 py-3 text-center">Sản phẩm</th>
                  <th className="px-4 py-3 text-center">Nổi bật</th>
                  <th className="px-4 py-3 text-center">Đang hiển thị</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
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
                        title={category.is_featured ? "Bỏ nổi bật" : "Đánh dấu nổi bật"}
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
                          {category.is_featured ? "Bỏ nổi bật" : "Đánh dấu nổi bật"}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={category.is_active}
                        disabled={quickUpdateMutation.isPending}
                        label={`Hiển thị danh mục ${category.name}`}
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
                          Sửa
                        </Button>
                        {category.is_active ? (
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(category)}>
                            <EyeOff className="h-3.5 w-3.5" aria-hidden />
                            Ẩn
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        title={`Ẩn danh mục "${deleteTarget?.name ?? ""}"?`}
        description="Danh mục sẽ bị ẩn khỏi cửa hàng, không xoá dữ liệu. Sản phẩm bên trong vẫn được giữ nguyên và bạn có thể bật hiển thị lại bất cứ lúc nào."
        confirmLabel="Ẩn danh mục"
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
