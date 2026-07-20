// Data layer — Ví/số dư (credit).
import { requireSupabase } from "@/lib/supabase";
import type { CreditTransactionRow } from "@/types/db";

/** Sổ giao dịch số dư của tôi (RLS: chỉ mình + admin). */
export async function listMyCreditTransactions(limit = 30): Promise<CreditTransactionRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("credit_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as CreditTransactionRow[];
}

/** Admin nạp/điều chỉnh số dư cho khách theo email. Trả về số dư mới. */
export async function adminAdjustCredit(
  email: string,
  amount: number,
  note?: string,
): Promise<number> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("admin_adjust_credit", {
    p_email: email,
    p_amount: amount,
    p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}

/** Khách thanh toán 1 đơn bằng số dư. */
export async function payOrderWithCredit(orderId: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("pay_order_with_credit", { p_order_id: orderId });
  if (error) throw new Error(error.message);
}
