// Data layer — Hồ sơ người dùng.
import { requireSupabase } from "@/lib/supabase";
import type { ProfileRow, PublicProfileRow } from "@/types/db";

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
  if (!uid) throw new Error("Bạn cần đăng nhập để cập nhật hồ sơ.");
  const { data, error } = await sb
    .from("profiles")
    .update(patch)
    .eq("id", uid)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ProfileRow;
}

/** Danh sách CTV đã duyệt (chỉ admin đọc được — RLS). Dùng cho màn giao đơn. */
export async function listCtvs(): Promise<ProfileRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("role", "ctv")
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
