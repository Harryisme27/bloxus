// Data layer — Nội dung marketing/tin cậy: minh chứng giao hàng (proofs) và
// đánh giá của khách (reviews). Đọc công khai; chỉ admin ghi (RLS lo).
import { requireSupabase } from "@/lib/supabase";
import type { ProofRow, ReviewRow } from "@/types/db";

/** Minh chứng giao hàng, mới nhất trước. */
export async function listProofs(): Promise<ProofRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("proofs")
    .select("*")
    .order("delivered_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProofRow[];
}

/** Đánh giá của khách, mới nhất trước. */
export async function listReviews(): Promise<ReviewRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReviewRow[];
}

/** Khách gửi đánh giá cho đơn đã hoàn thành (1 đánh giá / đơn). */
export async function submitOrderReview(
  orderId: string,
  stars: number,
  text?: string,
): Promise<ReviewRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("submit_order_review", {
    p_order_id: orderId,
    p_stars: stars,
    p_text: text ?? null,
  });
  if (error) throw new Error(error.message);
  return data as ReviewRow;
}

/** Đánh giá đã gửi cho 1 đơn (null nếu chưa có). */
export async function getOrderReview(orderId: string): Promise<ReviewRow | null> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("reviews")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ReviewRow | null) ?? null;
}
