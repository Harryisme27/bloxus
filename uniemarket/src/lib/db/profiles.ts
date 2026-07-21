// Data layer — Hồ sơ người dùng.
import { requireSupabase } from "@/lib/supabase";
import { useLangStore } from "@/i18n";
import type { ProfileRow, PublicProfileRow, RoleRequestRow, UserRole } from "@/types/db";

/** Cập nhật mốc "hoạt động gần đây" của tôi (gọi định kỳ khi đang dùng app). */
export async function touchLastSeen(): Promise<void> {
  const sb = requireSupabase();
  await sb.rpc("touch_last_seen");
}

/** Danh sách category_id đã phân cho 1 Seller (admin đọc). */
export async function listCtvCategories(ctvId: string): Promise<string[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("ctv_categories").select("category_id").eq("ctv_id", ctvId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => (r as { category_id: string }).category_id);
}

/** Admin phân danh mục cho Seller (all = truy cập mọi danh mục). */
export async function setCtvCategories(
  ctvId: string,
  categoryIds: string[],
  all: boolean,
): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("set_ctv_categories", {
    p_ctv: ctvId,
    p_category_ids: categoryIds,
    p_all: all,
  });
  if (error) throw new Error(error.message);
}

/** Admin cấp quyền cho một tài khoản theo email (customer | ctv | admin). */
export async function setUserRole(email: string, role: UserRole): Promise<ProfileRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("set_user_role", { p_email: email, p_role: role });
  if (error) throw new Error(error.message);
  return data as ProfileRow;
}

/** Manager đề xuất cấp quyền — admin sẽ duyệt (RPC request_role_grant). */
export async function requestRoleGrant(
  email: string,
  role: UserRole,
  note?: string,
): Promise<RoleRequestRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("request_role_grant", {
    p_email: email,
    p_role: role,
    p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
  return data as RoleRequestRow;
}

/** Danh sách đề xuất cấp quyền (RLS: admin thấy hết, manager thấy của mình). */
export async function listRoleRequests(): Promise<RoleRequestRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("role_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return (data ?? []) as RoleRequestRow[];
}

/** Admin duyệt/từ chối đề xuất cấp quyền. */
export async function reviewRoleGrant(
  requestId: string,
  approve: boolean,
  note?: string,
): Promise<RoleRequestRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("review_role_grant", {
    p_request_id: requestId,
    p_approve: approve,
    p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
  return data as RoleRequestRow;
}

/** Hồ sơ của tôi (null khi chưa đăng nhập). */
export async function getMyProfile(): Promise<ProfileRow | null> {
  const sb = requireSupabase();
  const { data: sessionData } = await sb.auth.getSession();
  const uid = sessionData.session?.user.id;
  if (!uid) return null;
  const { data, error } = await sb.from("profiles").select("*").eq("id", uid).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ProfileRow | null) ?? null;
}

/** Cập nhật hồ sơ của tôi. KHÔNG đổi được role (trigger phía DB chặn). */
export async function updateMyProfile(
  patch: Partial<Pick<ProfileRow, "display_name" | "avatar_url" | "phone" | "discord" | "username">>,
): Promise<ProfileRow> {
  const sb = requireSupabase();
  const { data: sessionData } = await sb.auth.getSession();
  const uid = sessionData.session?.user.id;
  if (!uid)
    throw new Error(
      useLangStore.getState().lang === "en"
        ? "You must be logged in to update your profile."
        : "Bạn cần đăng nhập để cập nhật hồ sơ.",
    );
  const { data, error } = await sb
    .from("profiles")
    .update(patch)
    .eq("id", uid)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ProfileRow;
}

/** Danh sách người nhận đơn được (Seller + manager). Dùng cho màn giao đơn + trang Seller. */
export async function listCtvs(): Promise<ProfileRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .in("role", ["ctv", "manager"])
    .order("username", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProfileRow[];
}

/** Toàn bộ nhân sự (admin + manager + ctv) — cho "Role List" (chỉ admin đọc — RLS). */
export async function listStaff(): Promise<ProfileRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .in("role", ["admin", "manager", "ctv"])
    .order("role", { ascending: true })
    .order("username", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProfileRow[];
}

/** Hồ sơ công khai tối thiểu (tên + avatar) — cho chat hiển thị người gửi. */
export async function getPublicProfile(id: string): Promise<PublicProfileRow | null> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("public_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PublicProfileRow | null) ?? null;
}
