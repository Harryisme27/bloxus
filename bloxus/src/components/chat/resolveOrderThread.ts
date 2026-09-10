// Tìm thread trao đổi gắn với một đơn hàng.
// Thread đơn hàng được tạo phía server khi đặt đơn (place_order) — helper này
// chỉ tra cứu, không tạo mới.
import { requireSupabase } from "@/lib/supabase";
import type { ThreadRow } from "@/types/db";

/** Thread kind='order' của đơn `orderId` (null nếu chưa có / không có quyền xem). */
export async function resolveOrderThread(orderId: string): Promise<ThreadRow | null> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("threads")
    .select("*")
    .eq("order_id", orderId)
    .eq("kind", "order")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ThreadRow | null) ?? null;
}
