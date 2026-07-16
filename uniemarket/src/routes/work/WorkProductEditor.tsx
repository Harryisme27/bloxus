import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ImagePlus, Loader2, Star, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { listCategories, uploadProductImage, upsertProduct } from "@/lib/db/catalog";
import type { ProductKind, ProductRow, ProductUpsert, ServiceOptions } from "@/types/db";
import { cn } from "@/lib/utils";
import { AdminTextarea } from "@/components/work-admin/Textarea";
import { PriceInput } from "@/components/work-admin/PriceInput";
import { Toggle } from "@/components/work-admin/Toggle";
import {
  ServiceOptionsBuilder,
  buildServiceOptions,
  draftFromServiceOptions,
  type ServiceOptionsDraft,
} from "@/components/work-admin/ServiceOptionsBuilder";
import { parseTags, slugify } from "@/components/work-admin/helpers";

export interface WorkProductEditorProps {
  /** null = tạo sản phẩm mới. */
  product: ProductRow | null;
  onClose: () => void;
}

interface ProductFormState {
  category_id: string;
  kind: ProductKind;
  name: string;
  slug: string;
  description: string;
  price: number | null;
  original_price: number | null;
  rarity: string;
  stockText: string;
  delivery_time_text: string;
  tags: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

/**
 * Trình soạn sản phẩm (panel toàn trang, render bởi WorkCatalog — không phải
 * route riêng). Gồm thông tin cơ bản, giá/kho, ảnh (nén client-side) và
 * builder tuỳ chọn dịch vụ (tiers / rank_range).
 */
export function WorkProductEditor({ product, onClose }: WorkProductEditorProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductFormState>(() => ({
    category_id: product?.category_id ?? "",
    kind: product?.kind ?? "item",
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    price: product ? product.price : null,
    original_price: product?.original_price ?? null,
    rarity: product?.rarity ?? "",
    stockText: product?.stock == null ? "" : String(product.stock),
    delivery_time_text: product?.delivery_time_text ?? "",
    tags: (product?.tags ?? []).join(", "),
    is_featured: product?.is_featured ?? false,
    is_active: product?.is_active ?? true,
    sort_order: product?.sort_order ?? 0,
  }));
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [optionsDraft, setOptionsDraft] = useState<ServiceOptionsDraft>(() =>
    draftFromServiceOptions(product?.service_options ?? null),
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [uploading, setUploading] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["categories", "admin"],
    queryFn: () => listCategories({ activeOnly: false }),
  });
  const categories = categoriesQuery.data ?? [];

  // Sản phẩm mới: mặc định chọn danh mục đầu tiên khi danh sách tải xong.
  useEffect(() => {
    if (categories.length > 0) {
      setForm((prev) => (prev.category_id ? prev : { ...prev, category_id: categories[0].id }));
    }
  }, [categories]);

  const saveMutation = useMutation({
    mutationFn: (input: ProductUpsert) => upsertProduct(input),
    onSuccess: () => {
      toast.success(product ? "Đã cập nhật sản phẩm" : "Đã tạo sản phẩm mới");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  function set<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { prepareImage } = await import("@/components/work-admin/uploads");
      for (const file of Array.from(files)) {
        const prepared = await prepareImage(file);
        const { publicUrl } = await uploadProductImage(prepared);
        setImages((prev) => [...prev, publicUrl]);
      }
      toast.success(files.length > 1 ? `Đã tải ${files.length} ảnh lên` : "Đã tải ảnh lên");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tải ảnh thất bại.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSave() {
    const name = form.name.trim();
    const slug = slugify(form.slug.trim());
    if (!name || !slug) {
      toast.error("Vui lòng nhập tên và slug sản phẩm.");
      return;
    }
    if (!form.category_id) {
      toast.error("Vui lòng chọn danh mục.");
      return;
    }
    if (!form.price || form.price <= 0) {
      toast.error("Giá bán phải lớn hơn 0.");
      return;
    }
    if (form.original_price !== null && form.original_price <= form.price) {
      toast.error("Giá gốc (hiển thị gạch ngang) phải lớn hơn giá bán.");
      return;
    }

    let serviceOptions: ServiceOptions | null = null;
    if (form.kind === "service") {
      const built = buildServiceOptions(optionsDraft);
      if (built.error) {
        toast.error(built.error);
        return;
      }
      serviceOptions = built.options;
    }

    let stock: number | null = null;
    if (form.kind === "item" && form.stockText.trim() !== "") {
      const parsed = Number(form.stockText);
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast.error("Tồn kho phải là số không âm (để trống nếu không giới hạn).");
        return;
      }
      stock = Math.floor(parsed);
    }

    saveMutation.mutate({
      id: product?.id,
      category_id: form.category_id,
      slug,
      kind: form.kind,
      name,
      description: form.description.trim() || null,
      price: form.price,
      original_price: form.original_price,
      rarity: form.rarity.trim() || null,
      stock,
      images,
      delivery_time_text: form.delivery_time_text.trim() || null,
      service_options: serviceOptions,
      tags: parseTags(form.tags),
      is_featured: form.is_featured,
      is_active: form.is_active,
      sort_order: form.sort_order,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Quay lại
          </Button>
          <h1 className="font-heading text-2xl font-bold text-text">
            {product ? "Sửa sản phẩm" : "Thêm sản phẩm"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saveMutation.isPending}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending || uploading}>
            {saveMutation.isPending ? "Đang lưu…" : "Lưu sản phẩm"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Cột chính */}
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="prod-category">Danh mục *</Label>
                  <Select
                    id="prod-category"
                    value={form.category_id}
                    onChange={(e) => set("category_id", e.target.value)}
                    disabled={categoriesQuery.isPending}
                  >
                    {categories.length === 0 ? <option value="">Chưa có danh mục</option> : null}
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                        {category.is_active ? "" : " (đã ẩn)"}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Loại sản phẩm *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["item", "service"] as const).map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => set("kind", kind)}
                        className={cn(
                          "h-10 rounded-lg border px-3 text-sm font-medium transition-colors",
                          form.kind === kind
                            ? "border-yellow bg-yellow-soft text-yellow"
                            : "border-border-strong text-text-muted hover:bg-surface-2 hover:text-text",
                        )}
                      >
                        {kind === "item" ? "Vật phẩm" : "Dịch vụ"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="prod-name">Tên sản phẩm *</Label>
                <Input
                  id="prod-name"
                  value={form.name}
                  placeholder="VD: Kéo rank Vàng lên Kim Cương"
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
                <Label htmlFor="prod-slug">Slug (đường dẫn) *</Label>
                <Input
                  id="prod-slug"
                  value={form.slug}
                  placeholder="keo-rank-vang-len-kim-cuong"
                  className="font-mono"
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="prod-desc">Mô tả</Label>
                <AdminTextarea
                  id="prod-desc"
                  value={form.description}
                  className="min-h-[120px]"
                  placeholder="Mô tả chi tiết sản phẩm/dịch vụ, cam kết, lưu ý cho khách…"
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {form.kind === "service" ? (
            <Card>
              <CardHeader>
                <CardTitle>Tuỳ chọn dịch vụ</CardTitle>
              </CardHeader>
              <CardContent>
                <ServiceOptionsBuilder value={optionsDraft} onChange={setOptionsDraft} />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Hình ảnh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-text-muted">
                Ảnh đầu tiên là ảnh đại diện. Ảnh sẽ được tự động thu nhỏ về tối đa 1200px, tối đa
                2MB/ảnh.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="group relative overflow-hidden rounded-xl border border-border bg-surface-2"
                  >
                    <img src={url} alt="" className="aspect-square w-full object-cover" />
                    {index === 0 ? (
                      <Badge variant="gold" className="absolute left-2 top-2">
                        <Star className="h-3 w-3 fill-yellow" aria-hidden />
                        Ảnh đại diện
                      </Badge>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setImages((prev) => [
                            prev[index],
                            ...prev.filter((_, i) => i !== index),
                          ])
                        }
                        className="absolute inset-x-2 bottom-2 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-text opacity-0 transition-opacity hover:bg-black/85 focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        Đặt làm ảnh đại diện
                      </button>
                    )}
                    <button
                      type="button"
                      title="Xoá ảnh"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-text transition-colors hover:bg-danger"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                      <span className="sr-only">Xoá ảnh {index + 1}</span>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong text-text-subtle transition-colors hover:border-yellow hover:text-yellow disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                  ) : (
                    <ImagePlus className="h-6 w-6" aria-hidden />
                  )}
                  <span className="text-xs font-medium">
                    {uploading ? "Đang tải lên…" : "Thêm ảnh"}
                  </span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void handleFiles(e.target.files)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Cột phụ */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Giá & kho</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prod-price">
                  {form.kind === "service" ? "Giá hiển thị (giá từ) *" : "Giá bán *"}
                </Label>
                <PriceInput
                  id="prod-price"
                  value={form.price}
                  placeholder="875.000"
                  onChange={(price) => set("price", price)}
                />
              </div>
              <div>
                <Label htmlFor="prod-original">Giá gốc (gạch ngang, tuỳ chọn)</Label>
                <PriceInput
                  id="prod-original"
                  value={form.original_price}
                  placeholder="Để trống nếu không giảm giá"
                  onChange={(price) => set("original_price", price)}
                />
              </div>
              {form.kind === "item" ? (
                <div>
                  <Label htmlFor="prod-stock">Tồn kho</Label>
                  <Input
                    id="prod-stock"
                    type="number"
                    min={0}
                    value={form.stockText}
                    placeholder="Để trống = không giới hạn"
                    onChange={(e) => set("stockText", e.target.value)}
                  />
                </div>
              ) : null}
              <div>
                <Label htmlFor="prod-delivery">Thời gian giao/hoàn thành</Label>
                <Input
                  id="prod-delivery"
                  value={form.delivery_time_text}
                  placeholder="VD: Giao trong 15–30 phút"
                  onChange={(e) => set("delivery_time_text", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="prod-rarity">Độ hiếm (tuỳ chọn)</Label>
                <Input
                  id="prod-rarity"
                  value={form.rarity}
                  placeholder="VD: Huyền thoại"
                  onChange={(e) => set("rarity", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="prod-tags">Tags (phân tách bằng dấu phẩy)</Label>
                <Input
                  id="prod-tags"
                  value={form.tags}
                  placeholder="VD: hot, giảm giá, mùa 5"
                  onChange={(e) => set("tags", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hiển thị</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text">Đang bán</p>
                  <p className="text-xs text-text-muted">Tắt để ẩn khỏi cửa hàng.</p>
                </div>
                <Toggle
                  checked={form.is_active}
                  onCheckedChange={(v) => set("is_active", v)}
                  label="Đang bán"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text">Nổi bật</p>
                  <p className="text-xs text-text-muted">Ưu tiên hiển thị ở trang chủ.</p>
                </div>
                <Toggle
                  checked={form.is_featured}
                  onCheckedChange={(v) => set("is_featured", v)}
                  label="Nổi bật"
                />
              </div>
              <div>
                <Label htmlFor="prod-sort">Thứ tự sắp xếp</Label>
                <Input
                  id="prod-sort"
                  type="number"
                  value={String(form.sort_order)}
                  onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
