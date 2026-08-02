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
  FolderPlus,
  Inbox,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm";
import {
  hardDeleteCategory,
  listCategories,
  listProducts,
  upsertCategory,
  listCategoryFolders,
  upsertCategoryFolder,
  deleteCategoryFolder,
  setCategoriesFolder,
  setCategoriesActive,
} from "@/lib/db/catalog";
import { slugify } from "./helpers";
import type { CategoryRow, CategoryUpsert } from "@/types/db";
import { cn } from "@/lib/utils";
import { usePick } from "@/i18n";
import { CategoryDialog } from "./CategoryDialog";
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
    selectAll: "Chọn tất cả",
    selectedN: (n: number) => `Đã chọn ${n}`,
    moveTo: "Chuyển vào folder…",
    apply: "Áp dụng",
    moved: (n: number) => `Đã chuyển ${n} danh mục.`,
    foldersHeading: "Chọn folder",
    gamesInFolder: (n: number) => `${n} game`,
    unassigned: "Chưa xếp folder",
    backToFolders: "Tất cả folder",
    renameFolder: "Đổi tên folder",
    renamePrompt: "Tên folder mới:",
    openFolder: "Mở folder",
    emptyFolder: "Folder này chưa có game. Bấm 'Thêm danh mục' để tạo.",
    hideFolder: "Ẩn cả folder",
    showFolder: "Hiện cả folder",
    folderHideConfirm: (name: string, n: number) =>
      `Ẩn cả ${n} game trong folder "${name}" khỏi cửa hàng? Không xóa dữ liệu, bật lại được.`,
    folderShowConfirm: (name: string, n: number) => `Hiện lại ${n} game trong folder "${name}"?`,
    folderHidden: (n: number) => `Đã ẩn ${n} game.`,
    folderShown: (n: number) => `Đã hiện ${n} game.`,
    deleteCat: "Xóa",
    deleteCatConfirm: (name: string, products: number) =>
      `XÓA HẲN danh mục "${name}"${products > 0 ? ` cùng ${products} sản phẩm bên trong` : ""}? Không khôi phục được (đơn hàng cũ vẫn giữ nguyên). Nếu chỉ muốn tạm gỡ khỏi cửa hàng, dùng nút Ẩn.`,
    deletedCat: "Đã xóa danh mục.",
    bulkHide: "Ẩn",
    bulkShow: "Hiện",
    bulkHidden: (n: number) => `Đã ẩn ${n} danh mục.`,
    bulkShown: (n: number) => `Đã hiện ${n} danh mục.`,
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
    selectAll: "Select all",
    selectedN: (n: number) => `${n} selected`,
    moveTo: "Move to folder…",
    apply: "Apply",
    moved: (n: number) => `Moved ${n} categories.`,
    foldersHeading: "Pick a folder",
    gamesInFolder: (n: number) => `${n} game${n === 1 ? "" : "s"}`,
    unassigned: "Unassigned",
    backToFolders: "All folders",
    renameFolder: "Rename folder",
    renamePrompt: "New folder name:",
    openFolder: "Open folder",
    emptyFolder: "This folder has no games yet. Click 'Add category' to create one.",
    hideFolder: "Hide whole folder",
    showFolder: "Show whole folder",
    folderHideConfirm: (name: string, n: number) =>
      `Hide all ${n} games in folder "${name}" from the store? No data is deleted; you can re-enable anytime.`,
    folderShowConfirm: (name: string, n: number) => `Show the ${n} games in folder "${name}" again?`,
    folderHidden: (n: number) => `${n} games hidden.`,
    folderShown: (n: number) => `${n} games shown.`,
    deleteCat: "Delete",
    deleteCatConfirm: (name: string, products: number) =>
      `PERMANENTLY delete category "${name}"${products > 0 ? ` along with its ${products} products` : ""}? This cannot be undone (past orders keep their data). Use Hide if you just want it off the store.`,
    deletedCat: "Category deleted.",
    bulkHide: "Hide",
    bulkShow: "Show",
    bulkHidden: (n: number) => `${n} categories hidden.`,
    bulkShown: (n: number) => `${n} categories shown.`,
  },
};

const PAGE_SIZES = [10, 20, 50, 100];

/** Tab "Danh mục" trong /work/catalog — folder-first: chọn folder rồi xem game. */
export function CategoriesTab() {
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const openSlug = searchParams.get("folder"); // null | <slug> | "__unassigned__"
  const [dialog, setDialog] = useState<{ open: boolean; category: CategoryRow | null }>({
    open: false,
    category: null,
  });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [moveTarget, setMoveTarget] = useState("");
  const [newFolder, setNewFolder] = useState("");

  const openFolderView = (slug: string | null) => {
    setSelected(new Set());
    setPage(1);
    if (slug) setSearchParams({ folder: slug });
    else setSearchParams({});
  };

  const categoriesQuery = useQuery({
    queryKey: ["categories", "admin"],
    queryFn: () => listCategories({ activeOnly: false }),
  });
  const foldersQuery = useQuery({ queryKey: ["category-folders"], queryFn: listCategoryFolders });
  const folderName = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of foldersQuery.data ?? []) map.set(f.id, f.name);
    return map;
  }, [foldersQuery.data]);

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

  const moveMutation = useMutation({
    mutationFn: ({ ids, folderId }: { ids: string[]; folderId: string | null }) =>
      setCategoriesFolder(ids, folderId),
    onSuccess: (_d, vars) => {
      toast.success(t.moved(vars.ids.length));
      setSelected(new Set());
      setMoveTarget("");
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const addFolderMutation = useMutation({
    mutationFn: (name: string) =>
      upsertCategoryFolder({ name: name.trim(), slug: slugify(name.trim()) || "folder" }),
    onSuccess: () => {
      toast.success(t.folderAdded);
      setNewFolder("");
      void queryClient.invalidateQueries({ queryKey: ["category-folders"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });
  const renameFolderMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      upsertCategoryFolder({ id, name: name.trim(), slug: slugify(name.trim()) || "folder" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["category-folders"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });
  // Ẩn/hiện hàng loạt danh mục (nút ẩn cả folder + thanh chọn nhiều).
  const bulkActiveMutation = useMutation({
    mutationFn: ({ ids, active }: { ids: string[]; active: boolean }) =>
      setCategoriesActive(ids, active),
    onSuccess: (_d, vars) => {
      toast.success(vars.active ? t.folderShown(vars.ids.length) : t.folderHidden(vars.ids.length));
      setSelected(new Set());
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  // Xóa hẳn danh mục (khác nút Ẩn — không khôi phục được).
  const hardDeleteMutation = useMutation({
    mutationFn: (id: string) => hardDeleteCategory(id),
    onSuccess: () => {
      toast.success(t.deletedCat);
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => deleteCategoryFolder(id),
    onSuccess: () => {
      toast.success(t.folderDeleted);
      void queryClient.invalidateQueries({ queryKey: ["category-folders"] });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const categories = categoriesQuery.data ?? [];
  const folders = foldersQuery.data ?? [];
  const folderIds = useMemo(() => new Set(folders.map((f) => f.id)), [folders]);

  // Folder đang mở (null = màn danh sách folder).
  const openFolder =
    openSlug && openSlug !== "__unassigned__" ? folders.find((f) => f.slug === openSlug) ?? null : null;
  const isUnassignedView = openSlug === "__unassigned__";
  const inFolderView = Boolean(openSlug);

  // Game chưa xếp folder.
  const unassigned = categories.filter((c) => !c.folder_id || !folderIds.has(c.folder_id));
  // Danh mục hiển thị trong màn chi tiết.
  const viewCats = isUnassignedView
    ? unassigned
    : openFolder
      ? categories.filter((c) => c.folder_id === openFolder.id)
      : [];

  useEffect(() => {
    setPage(1);
  }, [pageSize, openSlug]);

  const totalPages = Math.max(1, Math.ceil(viewCats.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const paginated = viewCats.slice(pageStart, pageStart + pageSize);

  // Chọn nhiều (áp trên trang hiện tại).
  const pageIds = paginated.map((c) => c.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected = pageIds.some((id) => selected.has(id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(pageIds));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const dialogsAndClose = (
    <>
      <CategoryDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        category={dialog.category}
        defaultFolderId={openFolder?.id ?? null}
      />
    </>
  );

  // ============ MÀN DANH SÁCH FOLDER (thẻ lưới) ============
  if (!inFolderView) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-heading text-sm font-semibold text-text">{t.foldersHeading}</p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (newFolder.trim() && !addFolderMutation.isPending) addFolderMutation.mutate(newFolder);
            }}
          >
            <Input
              value={newFolder}
              placeholder={t.folderNamePh}
              onChange={(e) => setNewFolder(e.target.value)}
              className="w-44"
            />
            <Button type="submit" size="sm" variant="secondary" disabled={!newFolder.trim() || addFolderMutation.isPending}>
              <FolderPlus className="h-4 w-4" aria-hidden />
              {t.addFolder}
            </Button>
          </form>
        </div>

        {categoriesQuery.isPending || foldersQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-2" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((f) => {
              const inFolder = categories.filter((c) => c.folder_id === f.id);
              const count = inFolder.length;
              const anyActive = inFolder.some((c) => c.is_active);
              return (
                <div
                  key={f.id}
                  className="group relative rounded-2xl border border-border bg-surface p-5 transition-all hover:border-yellow hover:shadow-glow-amber"
                >
                  <button
                    type="button"
                    onClick={() => openFolderView(f.slug)}
                    aria-label={`${t.openFolder} ${f.name}`}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-soft text-yellow">
                      <Folder className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-heading text-base font-semibold text-text">
                        {f.name}
                      </span>
                      <span className="block text-xs text-text-subtle">{t.gamesInFolder(count)}</span>
                    </span>
                  </button>
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {count > 0 ? (
                      <button
                        type="button"
                        title={anyActive ? t.hideFolder : t.showFolder}
                        aria-label={anyActive ? t.hideFolder : t.showFolder}
                        disabled={bulkActiveMutation.isPending}
                        onClick={async () => {
                          const r = await confirm({
                            title: anyActive ? t.hideFolder : t.showFolder,
                            message: anyActive
                              ? t.folderHideConfirm(f.name, count)
                              : t.folderShowConfirm(f.name, count),
                            tone: anyActive ? "danger" : undefined,
                          });
                          if (r.ok) {
                            bulkActiveMutation.mutate({
                              ids: inFolder.map((c) => c.id),
                              active: !anyActive,
                            });
                          }
                        }}
                        className="rounded-md p-1.5 text-text-subtle hover:bg-surface-2 hover:text-text"
                      >
                        {anyActive ? (
                          <EyeOff className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                        )}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      aria-label={t.renameFolder}
                      onClick={async () => {
                        const r = await confirm({
                          title: t.renameFolder,
                          input: { label: t.renamePrompt, defaultValue: f.name, required: true },
                        });
                        if (r.ok && r.value) renameFolderMutation.mutate({ id: f.id, name: r.value });
                      }}
                      className="rounded-md p-1.5 text-text-subtle hover:bg-surface-2 hover:text-text"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={t.folderDeleted}
                      disabled={deleteFolderMutation.isPending}
                      onClick={async () => {
                        const r = await confirm({
                          title: t.folderDeleted,
                          message: t.folderDelConfirm(f.name),
                          tone: "danger",
                        });
                        if (r.ok) deleteFolderMutation.mutate(f.id);
                      }}
                      className="rounded-md p-1.5 text-text-subtle hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
              );
            })}

            {unassigned.length > 0 ? (
              <button
                type="button"
                onClick={() => openFolderView("__unassigned__")}
                className="flex items-center gap-3 rounded-2xl border border-dashed border-border-strong bg-surface p-5 text-left transition-all hover:border-yellow"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-text-muted">
                  <Inbox className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-heading text-base font-semibold text-text">
                    {t.unassigned}
                  </span>
                  <span className="block text-xs text-text-subtle">
                    {t.gamesInFolder(unassigned.length)}
                  </span>
                </span>
              </button>
            ) : null}
          </div>
        )}

        {dialogsAndClose}
      </div>
    );
  }

  // ============ MÀN CHI TIẾT FOLDER (bảng game) ============
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => openFolderView(null)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t.backToFolders}
        </button>
        <ChevronRight className="h-4 w-4 text-text-subtle" aria-hidden />
        <span className="font-semibold text-text">
          {isUnassignedView ? t.unassigned : openFolder?.name ?? openSlug}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-muted">
          {categoriesQuery.isSuccess ? t.count(viewCats.length) : " "}
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

      {/* Thanh gán folder hàng loạt — hiện khi có chọn */}
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
            <div className="w-48">
              <Select
                value={moveTarget}
                onChange={(e) => setMoveTarget(e.target.value)}
                aria-label={t.moveTo}
              >
                <option value="">{t.moveTo}</option>
                <option value="__none__">{t.noFolder}</option>
                {(foldersQuery.data ?? []).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              size="sm"
              disabled={!moveTarget || moveMutation.isPending}
              onClick={() =>
                moveMutation.mutate({
                  ids: [...selected],
                  folderId: moveTarget === "__none__" ? null : moveTarget,
                })
              }
            >
              {t.apply}
            </Button>
          </div>
        </div>
      ) : null}

      {categoriesQuery.isPending ? (
        <TableSkeleton rows={5} />
      ) : categoriesQuery.isError ? (
        <LoadError message={categoriesQuery.error.message} onRetry={() => categoriesQuery.refetch()} />
      ) : viewCats.length === 0 ? (
        <EmptyBlock title={t.emptyTitle} hint={t.emptyFolder} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
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
                  <th className="px-4 py-3">{t.colCategory}</th>
                  <th className="px-4 py-3">{t.colFolder}</th>
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
                      selected.has(category.id) && "bg-yellow-soft/40",
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(category.id)}
                        onChange={() => toggleOne(category.id)}
                        aria-label={category.name}
                        className="h-4 w-4 accent-yellow"
                      />
                    </td>
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
                    <td className="px-4 py-3 text-text-muted">
                      {category.folder_id ? folderName.get(category.folder_id) ?? t.noFolder : t.noFolder}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={hardDeleteMutation.isPending}
                          className="text-danger hover:text-danger"
                          onClick={async () => {
                            const r = await confirm({
                              title: t.deleteCat,
                              message: t.deleteCatConfirm(
                                category.name,
                                productCounts.get(category.id) ?? 0,
                              ),
                              tone: "danger",
                            });
                            if (r.ok) hardDeleteMutation.mutate(category.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          {t.deleteCat}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {viewCats.length > pageSize ? (
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
              <span className="text-xs text-text-subtle">
                {t.showing(pageStart + 1, Math.min(pageStart + pageSize, viewCats.length), viewCats.length)}
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

      {dialogsAndClose}
    </div>
  );
}
