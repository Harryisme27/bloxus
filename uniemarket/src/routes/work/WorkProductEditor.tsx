import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  listCategories,
  uploadProductImage,
  upsertProduct,
  getProductSecret,
  setProductSecret,
} from "@/lib/db/catalog";
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
import { usePick, useLangStore } from "@/i18n";

const STR = {
  vi: {
    updated: "Đã cập nhật sản phẩm",
    created: "Đã tạo sản phẩm mới",
    uploadedMany: (n: number) => `Đã tải ${n} ảnh lên`,
    uploadedOne: "Đã tải ảnh lên",
    uploadFail: "Tải ảnh thất bại.",
    needNameSlug: "Vui lòng nhập tên và slug sản phẩm.",
    needCategory: "Vui lòng chọn danh mục.",
    priceGtZero: "Giá bán phải lớn hơn 0.",
    originalGtPrice: "Giá gốc (hiển thị gạch ngang) phải lớn hơn giá bán.",
    stockNonNeg: "Tồn kho phải là số không âm (để trống nếu không giới hạn).",
    back: "Quay lại",
    editTitle: "Sửa sản phẩm",
    addTitle: "Thêm sản phẩm",
    dialogDesc: "Sản phẩm/dịch vụ hiển thị trên cửa hàng — điền thông tin, giá và ảnh.",
    sectionLabel: "Khu vực",
    sectionNone: "— Không phân khu —",
    sectionEmptyHint: "Danh mục này chưa có khu vực — thêm ở phần Sửa danh mục.",
    cancel: "Hủy",
    saving: "Đang lưu…",
    save: "Lưu sản phẩm",
    basicInfo: "Thông tin cơ bản",
    categoryLabel: "Danh mục *",
    noCategory: "Chưa có danh mục",
    hiddenSuffix: " (đã ẩn)",
    kindLabel: "Loại sản phẩm *",
    item: "Vật phẩm",
    service: "Dịch vụ",
    account: "Tài khoản",
    instantLabel: "Giao ngay",
    instantHint:
      "Khi bật, đơn tự hoàn tất ngay khi xác nhận thanh toán và trả nội dung giao cho khách.",
    contentLabel: "Nội dung giao (khách thấy sau khi thanh toán)",
    contentHint:
      "Tài khoản / mã / hướng dẫn nhận hàng. Bí mật — chỉ hiện trong đơn của khách sau khi thanh toán.",
    nameLabel: "Tên sản phẩm *",
    namePlaceholder: "VD: Kéo rank Vàng lên Kim Cương",
    slugLabel: "Slug (đường dẫn) *",
    slugPlaceholder: "keo-rank-vang-len-kim-cuong",
    descLabel: "Mô tả",
    descPlaceholder: "Mô tả chi tiết sản phẩm/dịch vụ, cam kết, lưu ý cho khách…",
    serviceOptions: "Tuỳ chọn dịch vụ",
    images: "Hình ảnh",
    imagesHint:
      "Ảnh đầu tiên là ảnh đại diện. Ảnh sẽ được tự động thu nhỏ về tối đa 1200px, tối đa 2MB/ảnh.",
    coverBadge: "Ảnh đại diện",
    setCover: "Đặt làm ảnh đại diện",
    removeImageTitle: "Xoá ảnh",
    removeImage: (n: number) => `Xoá ảnh ${n}`,
    uploading: "Đang tải lên…",
    addImage: "Thêm ảnh",
    priceStock: "Giá & kho",
    priceServiceLabel: "Giá hiển thị (giá từ) *",
    priceItemLabel: "Giá bán *",
    pricePlaceholder: "875.000",
    originalLabel: "Giá gốc (gạch ngang, tuỳ chọn)",
    originalPlaceholder: "Để trống nếu không giảm giá",
    stockLabel: "Tồn kho",
    stockPlaceholder: "Để trống = không giới hạn",
    deliveryLabel: "Thời gian giao/hoàn thành",
    deliveryPlaceholder: "VD: Giao trong 15–30 phút",
    rarityLabel: "Độ hiếm (tuỳ chọn)",
    rarityPlaceholder: "VD: Huyền thoại",
    tagsLabel: "Tags (phân tách bằng dấu phẩy)",
    tagsPlaceholder: "VD: hot, giảm giá, mùa 5",
    display: "Hiển thị",
    active: "Đang bán",
    activeHint: "Tắt để ẩn khỏi cửa hàng.",
    featured: "Nổi bật",
    featuredHint: "Ưu tiên hiển thị ở trang chủ.",
    sortLabel: "Thứ tự sắp xếp",
  },
  en: {
    updated: "Product updated",
    created: "New product created",
    uploadedMany: (n: number) => `Uploaded ${n} images`,
    uploadedOne: "Image uploaded",
    uploadFail: "Image upload failed.",
    needNameSlug: "Please enter a product name and slug.",
    needCategory: "Please choose a category.",
    priceGtZero: "The selling price must be greater than 0.",
    originalGtPrice:
      "The original price (shown struck through) must be greater than the selling price.",
    stockNonNeg: "Stock must be a non-negative number (leave empty for unlimited).",
    back: "Back",
    editTitle: "Edit product",
    addTitle: "Add product",
    dialogDesc: "Products/services shown in the store — fill in details, price, and images.",
    sectionLabel: "Section",
    sectionNone: "— No section —",
    sectionEmptyHint: "This category has no sections yet — add them in Edit category.",
    cancel: "Cancel",
    saving: "Saving…",
    save: "Save product",
    basicInfo: "Basic information",
    categoryLabel: "Category *",
    noCategory: "No categories",
    hiddenSuffix: " (hidden)",
    kindLabel: "Product type *",
    item: "Item",
    service: "Service",
    account: "Account",
    instantLabel: "Instant delivery",
    instantHint:
      "When on, the order auto-completes as soon as payment is confirmed and the delivery content is handed to the buyer.",
    contentLabel: "Delivery content (buyer sees after payment)",
    contentHint:
      "Account / code / redemption instructions. Secret — only shown inside the buyer's order after payment.",
    nameLabel: "Product name *",
    namePlaceholder: "e.g. Gold to Diamond rank boost",
    slugLabel: "Slug (URL path) *",
    slugPlaceholder: "gold-to-diamond-rank-boost",
    descLabel: "Description",
    descPlaceholder:
      "Detailed description of the product/service, guarantees, notes for the customer…",
    serviceOptions: "Service options",
    images: "Images",
    imagesHint:
      "The first image is the cover. Images are automatically resized to a max of 1200px, up to 2MB each.",
    coverBadge: "Cover image",
    setCover: "Set as cover image",
    removeImageTitle: "Remove image",
    removeImage: (n: number) => `Remove image ${n}`,
    uploading: "Uploading…",
    addImage: "Add image",
    priceStock: "Price & stock",
    priceServiceLabel: "Display price (from) *",
    priceItemLabel: "Selling price *",
    pricePlaceholder: "875.000",
    originalLabel: "Original price (struck through, optional)",
    originalPlaceholder: "Leave empty if not on sale",
    stockLabel: "Stock",
    stockPlaceholder: "Empty = unlimited",
    deliveryLabel: "Delivery/completion time",
    deliveryPlaceholder: "e.g. Delivered in 15–30 minutes",
    rarityLabel: "Rarity (optional)",
    rarityPlaceholder: "e.g. Legendary",
    tagsLabel: "Tags (comma-separated)",
    tagsPlaceholder: "e.g. hot, sale, season 5",
    display: "Display",
    active: "On sale",
    activeHint: "Turn off to hide from the store.",
    featured: "Featured",
    featuredHint: "Prioritize showing on the homepage.",
    sortLabel: "Sort order",
  },
};

export interface WorkProductEditorProps {
  /** null = tạo sản phẩm mới. */
  product: ProductRow | null;
  /** Category mặc định khi tạo mới trong 1 folder danh mục. */
  defaultCategoryId?: string;
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
  section: string;
  stockText: string;
  delivery_time_text: string;
  instant_delivery: boolean;
  deliveryContent: string;
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
export function WorkProductEditor({ product, defaultCategoryId, onClose }: WorkProductEditorProps) {
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const lang = useLangStore((state) => state.lang);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductFormState>(() => ({
    category_id: product?.category_id ?? defaultCategoryId ?? "",
    kind: product?.kind ?? "item",
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    price: product ? product.price : null,
    original_price: product?.original_price ?? null,
    rarity: product?.rarity ?? "",
    section: product?.section ?? "",
    stockText: product?.stock == null ? "" : String(product.stock),
    delivery_time_text: product?.delivery_time_text ?? "",
    instant_delivery: product?.instant_delivery ?? false,
    deliveryContent: "",
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

  // Nạp nội dung giao bí mật khi sửa sản phẩm sẵn có.
  const secretQuery = useQuery({
    queryKey: ["product-secret", product?.id],
    queryFn: () => getProductSecret(product!.id),
    enabled: Boolean(product?.id),
  });
  useEffect(() => {
    if (secretQuery.data !== undefined) {
      setForm((prev) => ({ ...prev, deliveryContent: secretQuery.data ?? "" }));
    }
  }, [secretQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async ({ input, secret }: { input: ProductUpsert; secret: string | null }) => {
      const saved = await upsertProduct(input);
      if (secret !== null) await setProductSecret(saved.id, secret);
      return saved;
    },
    onSuccess: () => {
      toast.success(product ? t.updated : t.created);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-secret", product?.id] });
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
        const prepared = await prepareImage(file, lang);
        const { publicUrl } = await uploadProductImage(prepared);
        setImages((prev) => [...prev, publicUrl]);
      }
      toast.success(files.length > 1 ? t.uploadedMany(files.length) : t.uploadedOne);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.uploadFail);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSave() {
    const name = form.name.trim();
    const slug = slugify(form.slug.trim());
    if (!name || !slug) {
      toast.error(t.needNameSlug);
      return;
    }
    if (!form.category_id) {
      toast.error(t.needCategory);
      return;
    }
    if (!form.price || form.price <= 0) {
      toast.error(t.priceGtZero);
      return;
    }
    if (form.original_price !== null && form.original_price <= form.price) {
      toast.error(t.originalGtPrice);
      return;
    }

    let serviceOptions: ServiceOptions | null = null;
    if (form.kind === "service") {
      const built = buildServiceOptions(optionsDraft, lang);
      if (built.error) {
        toast.error(built.error);
        return;
      }
      serviceOptions = built.options;
    }

    const hasStock = form.kind === "item" || form.kind === "account";
    let stock: number | null = null;
    if (hasStock && form.stockText.trim() !== "") {
      const parsed = Number(form.stockText);
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast.error(t.stockNonNeg);
        return;
      }
      stock = Math.floor(parsed);
    }
    const instant = hasStock && form.instant_delivery;

    saveMutation.mutate({
      // Nội dung giao lưu riêng ở product_secrets (chỉ khi item/account).
      secret: hasStock ? form.deliveryContent.trim() : null,
      input: {
        id: product?.id,
        category_id: form.category_id,
        slug,
        kind: form.kind,
        name,
        description: form.description.trim() || null,
        price: form.price,
        original_price: form.original_price,
        rarity: form.rarity.trim() || null,
        section: form.section.trim() || null,
        stock,
        images,
        delivery_time_text: form.delivery_time_text.trim() || null,
        instant_delivery: instant,
        service_options: serviceOptions,
        tags: parseTags(form.tags),
        is_featured: form.is_featured,
        is_active: form.is_active,
        sort_order: form.sort_order,
      },
    });
  }

  return (
    <div>
      <DialogHeader>
        <DialogTitle>{product ? t.editTitle : t.addTitle}</DialogTitle>
        <DialogDescription>{t.dialogDesc}</DialogDescription>
      </DialogHeader>

      <div className="mt-4 space-y-5">
        {/* Cột chính */}
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.basicInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="prod-category">{t.categoryLabel}</Label>
                  <Select
                    id="prod-category"
                    value={form.category_id}
                    onChange={(e) => set("category_id", e.target.value)}
                    disabled={categoriesQuery.isPending}
                  >
                    {categories.length === 0 ? <option value="">{t.noCategory}</option> : null}
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                        {category.is_active ? "" : t.hiddenSuffix}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>{t.kindLabel}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["item", "service", "account"] as const).map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => set("kind", kind)}
                        className={cn(
                          "h-10 rounded-lg border px-2 text-sm font-medium transition-colors",
                          form.kind === kind
                            ? "border-yellow bg-yellow-soft text-yellow"
                            : "border-border-strong text-text-muted hover:bg-surface-2 hover:text-text",
                        )}
                      >
                        {kind === "item" ? t.item : kind === "service" ? t.service : t.account}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Khu vực trong danh mục (bloxmart-style) — nhóm sản phẩm ở trang game. */}
              <div>
                <Label htmlFor="prod-section">{t.sectionLabel}</Label>
                {(() => {
                  const sections =
                    categories.find((c) => c.id === form.category_id)?.sections ?? [];
                  if (sections.length === 0) {
                    return <p className="text-xs text-text-subtle">{t.sectionEmptyHint}</p>;
                  }
                  return (
                    <Select
                      id="prod-section"
                      value={form.section}
                      onChange={(e) => set("section", e.target.value)}
                    >
                      <option value="">{t.sectionNone}</option>
                      {sections.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                      {/* Giữ giá trị cũ nếu khu đã bị xóa khỏi danh mục. */}
                      {form.section && !sections.includes(form.section) ? (
                        <option value={form.section}>{form.section}</option>
                      ) : null}
                    </Select>
                  );
                })()}
              </div>

              <div>
                <Label htmlFor="prod-name">{t.nameLabel}</Label>
                <Input
                  id="prod-name"
                  value={form.name}
                  placeholder={t.namePlaceholder}
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
                <Label htmlFor="prod-slug">{t.slugLabel}</Label>
                <Input
                  id="prod-slug"
                  value={form.slug}
                  placeholder={t.slugPlaceholder}
                  className="font-mono"
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="prod-desc">{t.descLabel}</Label>
                <AdminTextarea
                  id="prod-desc"
                  value={form.description}
                  className="min-h-[120px]"
                  placeholder={t.descPlaceholder}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {form.kind === "service" ? (
            <Card>
              <CardHeader>
                <CardTitle>{t.serviceOptions}</CardTitle>
              </CardHeader>
              <CardContent>
                <ServiceOptionsBuilder value={optionsDraft} onChange={setOptionsDraft} />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{t.images}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-text-muted">{t.imagesHint}</p>
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
                        {t.coverBadge}
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
                        {t.setCover}
                      </button>
                    )}
                    <button
                      type="button"
                      title={t.removeImageTitle}
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-text transition-colors hover:bg-danger"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                      <span className="sr-only">{t.removeImage(index + 1)}</span>
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
                    {uploading ? t.uploading : t.addImage}
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
              <CardTitle>{t.priceStock}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prod-price">
                  {form.kind === "service" ? t.priceServiceLabel : t.priceItemLabel}
                </Label>
                <PriceInput
                  id="prod-price"
                  value={form.price}
                  placeholder={t.pricePlaceholder}
                  onChange={(price) => set("price", price)}
                />
              </div>
              <div>
                <Label htmlFor="prod-original">{t.originalLabel}</Label>
                <PriceInput
                  id="prod-original"
                  value={form.original_price}
                  placeholder={t.originalPlaceholder}
                  onChange={(price) => set("original_price", price)}
                />
              </div>
              {form.kind === "item" || form.kind === "account" ? (
                <>
                  <div>
                    <Label htmlFor="prod-stock">{t.stockLabel}</Label>
                    <Input
                      id="prod-stock"
                      type="number"
                      min={0}
                      value={form.stockText}
                      placeholder={t.stockPlaceholder}
                      onChange={(e) => set("stockText", e.target.value)}
                    />
                  </div>

                  {/* Giao ngay + nội dung giao bí mật */}
                  <div className="rounded-xl border border-border bg-surface-2 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text">{t.instantLabel}</p>
                        <p className="mt-0.5 text-xs text-text-subtle">{t.instantHint}</p>
                      </div>
                      <Toggle
                        checked={form.instant_delivery}
                        onCheckedChange={(v) => set("instant_delivery", v)}
                        label={t.instantLabel}
                      />
                    </div>
                    {form.instant_delivery ? (
                      <div className="mt-3">
                        <Label htmlFor="prod-content">{t.contentLabel}</Label>
                        <AdminTextarea
                          id="prod-content"
                          value={form.deliveryContent}
                          placeholder="account: user / pass..."
                          onChange={(e) => set("deliveryContent", e.target.value)}
                        />
                        <p className="mt-1 text-xs text-text-subtle">{t.contentHint}</p>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
              <div>
                <Label htmlFor="prod-delivery">{t.deliveryLabel}</Label>
                <Input
                  id="prod-delivery"
                  value={form.delivery_time_text}
                  placeholder={t.deliveryPlaceholder}
                  onChange={(e) => set("delivery_time_text", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="prod-rarity">{t.rarityLabel}</Label>
                <Input
                  id="prod-rarity"
                  value={form.rarity}
                  placeholder={t.rarityPlaceholder}
                  onChange={(e) => set("rarity", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="prod-tags">{t.tagsLabel}</Label>
                <Input
                  id="prod-tags"
                  value={form.tags}
                  placeholder={t.tagsPlaceholder}
                  onChange={(e) => set("tags", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.display}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text">{t.active}</p>
                  <p className="text-xs text-text-muted">{t.activeHint}</p>
                </div>
                <Toggle
                  checked={form.is_active}
                  onCheckedChange={(v) => set("is_active", v)}
                  label={t.active}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text">{t.featured}</p>
                  <p className="text-xs text-text-muted">{t.featuredHint}</p>
                </div>
                <Toggle
                  checked={form.is_featured}
                  onCheckedChange={(v) => set("is_featured", v)}
                  label={t.featured}
                />
              </div>
              <div>
                <Label htmlFor="prod-sort">{t.sortLabel}</Label>
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

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={saveMutation.isPending}>
          {t.cancel}
        </Button>
        <Button onClick={handleSave} disabled={saveMutation.isPending || uploading}>
          {saveMutation.isPending ? t.saving : t.save}
        </Button>
      </div>
    </div>
  );
}
