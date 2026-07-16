// Data layer — Thông báo in-app (badge sidebar, danh sách thông báo).
// Chỉ đọc + đánh dấu đã đọc; việc TẠO thông báo diễn ra trong RPC phía server.
import { requireSupabase } from "@/lib/supabase";
import type { NotificationRow } from "@/types/db";

/** Thông báo của tôi, mới nhất trước. */
export async function listMy(opts?: { limit?: number }): Promise<NotificationRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 50);
  if (error) throw new Error(error.message);
  return (data ?? []) as NotificationRow[];
}

/** Đánh dấu 1 thông báo là đã đọc. */
export async function markRead(id: number): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Số thông báo chưa đọc (cho badge). */
export async function unreadCount(): Promise<number> {
  const sb = requireSupabase();
  const { count, error } = await sb
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
