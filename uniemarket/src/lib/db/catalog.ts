// Data layer — Danh mục & sản phẩm (đọc công khai + CRUD admin).
// Mọi hàm đều async và ném Error có message tiếng Việt khi thất bại.
import { requireSupabase } from "@/lib/supabase";
import type { CategoryRow, CategoryUpsert, ProductRow, ProductUpsert } from "@/types/db";

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
