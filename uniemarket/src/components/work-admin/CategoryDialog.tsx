import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertCategory } from "@/lib/db/catalog";
import type { CategoryRow, CategoryUpsert } from "@/types/db";
import { AdminTextarea } from "./Textarea";
import { Toggle } from "./Toggle";
import { slugify } from "./helpers";

const DEFAULT_ACCENT = "#f5b01e";

interface CategoryFormState {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  accent_color: string;
  contact_field_label: string;
  contact_field_placeholder: string;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
}

function initForm(category: CategoryRow | null): CategoryFormState {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    tagline: category?.tagline ?? "",
    description: category?.description ?? "",
    accent_color: category?.accent_color ?? "",
    contact_field_label: category?.contact_field_label ?? "",
    contact_field_placeholder: category?.contact_field_placeholder ?? "",
    sort_order: category?.sort_order ?? 0,
    is_featured: category?.is_featured ?? false,
    is_active: category?.is_active ?? true,
  };
}

export interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = tạo mới. */
  category: CategoryRow | null;
}

/** Dialog tạo/sửa danh mục — lưu qua upsertCategory, invalidate ['categories']. */
export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CategoryFormState>(() => initForm(category));
  const [slugTouched, setSlugTouched] = useState(Boolean(category));

  useEffect(() => {
    if (open) {
      setForm(initForm(category));
      setSlugTouched(Boolean(category));
    }
  }, [open, category]);

  const saveMutation = useMutation({
    mutationFn: (input: CategoryUpsert) => upsertCategory(input),
    onSuccess: () => {
      toast.success(category ? "Đã cập nhật danh mục" : "Đã tạo danh mục mới");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  function set<K extends keyof CategoryFormState>(key: K, value: CategoryFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    const name = form.name.trim();
    const slug = slugify(form.slug.trim());
    if (!name || !slug) {
      toast.error("Vui lòng nhập tên và slug danh mục.");
      return;
    }
    saveMutation.mutate({
      id: category?.id,
      slug,
      name,
      tagline: form.tagline.trim() || null,
      description: form.description.trim() || null,
      accent_color: form.accent_color.trim() || null,
      contact_field_label: form.contact_field_label.trim() || null,
      contact_field_placeholder: form.contact_field_placeholder.trim() || null,
      sort_order: form.sort_order,
      is_featured: form.is_featured,
      is_active: form.is_active,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{category ? "Sửa danh mục" : "Thêm danh mục"}</DialogTitle>
          <DialogDescription>
            Danh mục là các game/nhóm dịch vụ hiển thị trên cửa hàng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="cat-name">Tên danh mục *</Label>
            <Input
              id="cat-name"
              value={form.name}
              placeholder="VD: Liên Minh Huyền Thoại"
              onChange={(e) => {
                const name = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  name,
                  slug: slugTouched ? prev.slug : slugify(name),
                }));
              }}
            />
          </div>

          <div>
            <Label htmlFor="cat-slug">Slug (đường dẫn) *</Label>
            <Input
              id="cat-slug"
              value={form.slug}
              placeholder="lien-minh-huyen-thoai"
              className="font-mono"
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
            />
          </div>

          <div>
            <Label htmlFor="cat-tagline">Tagline (mô tả ngắn)</Label>
            <Input
              id="cat-tagline"
              value={form.tagline}
              placeholder="VD: Cày rank, vật phẩm, quà tặng"
              onChange={(e) => set("tagline", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="cat-desc">Mô tả</Label>
            <AdminTextarea
              id="cat-desc"
              value={form.description}
              placeholder="Mô tả chi tiết hiển thị ở đầu trang danh mục…"
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="cat-accent">Màu nhấn</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Chọn màu nhấn"
                value={/^#[0-9a-fA-F]{6}$/.test(form.accent_color) ? form.accent_color : DEFAULT_ACCENT}
                onChange={(e) => set("accent_color", e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-lg border border-border-strong bg-surface-2 p-1"
              />
              <Input
                id="cat-accent"
                value={form.accent_color}
                placeholder="#f5b01e (để trống = mặc định)"
                className="font-mono"
                onChange={(e) => set("accent_color", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cat-contact-label">Nhãn ô liên hệ khi đặt hàng</Label>
              <Input
                id="cat-contact-label"
                value={form.contact_field_label}
                placeholder="VD: Tên tài khoản trong game"
                onChange={(e) => set("contact_field_label", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cat-contact-ph">Gợi ý trong ô liên hệ</Label>
              <Input
                id="cat-contact-ph"
                value={form.contact_field_placeholder}
                placeholder="VD: Nhập IGN#TAG"
                onChange={(e) => set("contact_field_placeholder", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="cat-sort">Thứ tự</Label>
              <Input
                id="cat-sort"
                type="number"
                value={String(form.sort_order)}
                onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-start sm:justify-start">
              <Label className="mb-0 sm:mb-1.5">Nổi bật</Label>
              <Toggle
                checked={form.is_featured}
                onCheckedChange={(v) => set("is_featured", v)}
                label="Danh mục nổi bật"
              />
            </div>
            <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-start sm:justify-start">
              <Label className="mb-0 sm:mb-1.5">Đang hiển thị</Label>
              <Toggle
                checked={form.is_active}
                onCheckedChange={(v) => set("is_active", v)}
                label="Danh mục đang hiển thị"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saveMutation.isPending}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Đang lưu…" : "Lưu danh mục"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
