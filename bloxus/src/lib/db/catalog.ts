// Data layer — Danh mục & sản phẩm (đọc công khai + CRUD admin).
// Mọi hàm đều async và ném Error có message tiếng Việt khi thất bại.
import { requireSupabase } from "@/lib/supabase";
import type {
  CategoryFolderRow,
  CategoryRow,
  CategoryUpsert,
  ProductRow,
  ProductUpsert,
} from "@/types/db";

// ----------------------------------------------------------------------------
// Folder (nhóm danh mục: Roblox, CS2...)
// ----------------------------------------------------------------------------

export async function listCategoryFolders(): Promise<CategoryFolderRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("category_folders")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryFolderRow[];
}

export async function upsertCategoryFolder(input: {
  id?: string;
  name: string;
  slug: string;
  sort_order?: number;
}): Promise<CategoryFolderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("category_folders")
    .upsert(input, { onConflict: "id" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as CategoryFolderRow;
}

export async function deleteCategoryFolder(id: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("category_folders").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Gán nhiều danh mục vào 1 folder cùng lúc (null = gỡ khỏi folder). */
export async function setCategoriesFolder(
  ids: string[],
  folderId: string | null,
): Promise<void> {
  if (ids.length === 0) return;
  const sb = requireSupabase();
  const { error } = await sb.from("categories").update({ folder_id: folderId }).in("id", ids);
  if (error) throw new Error(error.message);
}

// ----------------------------------------------------------------------------
// Đọc (anon + authenticated — RLS chỉ trả về hàng đang bán cho người thường)
// ----------------------------------------------------------------------------

export async function listCategories(opts?: { activeOnly?: boolean }): Promise<CategoryRow[]> {
  const sb = requireSupabase();
  let query = sb.from("categories").select("*").order("sort_order", { ascending: true });
  if (opts?.activeOnly !== false) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryRow[];
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("categories").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as CategoryRow | null) ?? null;
}

export async function listProducts(opts?: {
  categorySlug?: string;
  featured?: boolean;
  activeOnly?: boolean;
}): Promise<ProductRow[]> {
  const sb = requireSupabase();

  let categoryId: string | null = null;
  if (opts?.categorySlug) {
    const category = await getCategoryBySlug(opts.categorySlug);
    if (!category) return [];
    categoryId = category.id;
  }

  let query = sb
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (opts?.activeOnly !== false) query = query.eq("is_active", true);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (opts?.featured !== undefined) query = query.eq("is_featured", opts.featured);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductRow[];
}

/** Tìm nhanh cho thanh search navbar: game theo tên + sản phẩm theo tên. */
export async function searchCatalog(q: string): Promise<{
  categories: CategoryRow[];
  products: ProductRow[];
}> {
  const sb = requireSupabase();
  const term = `%${q.trim()}%`;
  const [cats, prods] = await Promise.all([
    sb
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .ilike("name", term)
      .order("sort_order", { ascending: true })
      .limit(3),
    sb
      .from("products")
      .select("*")
      .eq("is_active", true)
      .ilike("name", term)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .limit(6),
  ]);
  if (cats.error) throw new Error(cats.error.message);
  if (prods.error) throw new Error(prods.error.message);
  return {
    categories: (cats.data ?? []) as CategoryRow[],
    products: (prods.data ?? []) as ProductRow[],
  };
}

export async function getProductById(id: string): Promise<ProductRow | null> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ProductRow | null) ?? null;
}

// ----------------------------------------------------------------------------
// Ghi (admin — RLS từ chối với người thường)
// ----------------------------------------------------------------------------

export async function upsertCategory(input: CategoryUpsert): Promise<CategoryRow> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("categories")
    .upsert(input, { onConflict: "id" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as CategoryRow;
}

/** Xóa mềm: chỉ ẩn danh mục (is_active = false), không mất dữ liệu. */
export async function deleteCategory(id: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("categories").update({ is_active: false }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Ẩn/hiện nhiều danh mục cùng lúc (dùng cho nút ẩn cả folder). */
export async function setCategoriesActive(ids: string[], active: boolean): Promise<void> {
  if (ids.length === 0) return;
  const sb = requireSupabase();
  const { error } = await sb.from("categories").update({ is_active: active }).in("id", ids);
  if (error) throw new Error(error.message);
}

/** XÓA HẲN danh mục KÈM toàn bộ sản phẩm bên trong (khác deleteCategory chỉ
 * ẩn). Đơn hàng cũ không mất gì — order_items lưu snapshot tên/giá. */
export async function hardDeleteCategory(id: string): Promise<void> {
  const sb = requireSupabase();
  // Xóa sản phẩm trước (FK products.category_id không cascade).
  const { error: prodErr } = await sb.from("products").delete().eq("category_id", id);
  if (prodErr) throw new Error(prodErr.message);
  const { error } = await sb.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** XÓA HẲN nhiều sản phẩm (không khôi phục được). Đơn hàng cũ không mất gì —
 * order_items lưu snapshot tên/giá và tự gỡ liên kết (FK set null). */
export async function deleteProducts(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const sb = requireSupabase();
  const { error } = await sb.from("products").delete().in("id", ids);
  if (error) throw new Error(error.message);
}

/** Ẩn/mở bán nhiều sản phẩm cùng lúc (chọn tất cả -> ẩn). */
export async function setProductsActive(ids: string[], active: boolean): Promise<void> {
  if (ids.length === 0) return;
  const sb = requireSupabase();
  const { error } = await sb.from("products").update({ is_active: active }).in("id", ids);
  if (error) throw new Error(error.message);
}

export async function upsertProduct(input: ProductUpsert): Promise<ProductRow> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("products")
    .upsert(input, { onConflict: "id" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ProductRow;
}

/** Nội dung giao bí mật của sản phẩm (admin/manager). null nếu chưa đặt. */
export async function getProductSecret(productId: string): Promise<string> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("get_product_secret", { p_product_id: productId });
  if (error) throw new Error(error.message);
  return (data as string | null) ?? "";
}

export async function setProductSecret(productId: string, content: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("set_product_secret", {
    p_product_id: productId,
    p_content: content,
  });
  if (error) throw new Error(error.message);
}

export async function setProductActive(id: string, isActive: boolean): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("products").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Tải ảnh sản phẩm lên bucket `product-images` (chỉ admin có quyền ghi).
 * Trả về { path, publicUrl } — lưu publicUrl vào products.images.
 */
export async function uploadProductImage(
  file: File,
): Promise<{ path: string; publicUrl: string }> {
  const sb = requireSupabase();
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `products/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = sb.storage.from("product-images").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
