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
