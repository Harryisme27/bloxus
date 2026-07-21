// Data layer — Ví/số dư (credit).
import { requireSupabase } from "@/lib/supabase";
import type {
  CreditTransactionRow,
  TopupRequestRow,
  WithdrawalRequestRow,
} from "@/types/db";

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

// ---- Nạp tiền (topup) ----
export async function requestTopup(amount: number, method?: string, note?: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("request_topup", {
    p_amount: amount,
    p_method: method ?? null,
    p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
}
export async function reviewTopup(id: string, approve: boolean): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("review_topup", { p_id: id, p_approve: approve });
  if (error) throw new Error(error.message);
}
export async function listTopupRequests(): Promise<TopupRequestRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("topup_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as TopupRequestRow[];
}

// ---- Rút tiền (withdrawal) ----
export async function requestWithdrawal(
  amount: number,
  method: string,
  destination?: string,
): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("request_withdrawal", {
    p_amount: amount,
    p_method: method,
    p_destination: destination ?? null,
  });
  if (error) throw new Error(error.message);
}

/** Lưu tài khoản nhận tiền (payout_info) của chính mình. */
export async function setPayoutInfo(info: Record<string, string>): Promise<void> {
  const sb = requireSupabase();
  const { data: sess } = await sb.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) throw new Error("Not signed in");
  const { error } = await sb.from("profiles").update({ payout_info: info }).eq("id", uid);
  if (error) throw new Error(error.message);
}
export async function reviewWithdrawal(id: string, approve: boolean, note?: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("review_withdrawal", {
    p_id: id,
    p_approve: approve,
    p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
}
export async function listWithdrawalRequests(): Promise<WithdrawalRequestRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("withdrawal_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as WithdrawalRequestRow[];
}
