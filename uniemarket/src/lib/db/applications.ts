// Data layer — Tuyển CTV (đơn ứng tuyển + duyệt).
import { requireSupabase } from "@/lib/supabase";
import { useLangStore } from "@/i18n";
import type { CtvApplicationInput, CtvApplicationRow, CtvApplicationStatus } from "@/types/db";

const isEn = () => useLangStore.getState().lang === "en";

/** Nộp đơn ứng tuyển CTV (mỗi người tối đa 1 đơn đang chờ — DB chặn đơn trùng). */
export async function submitApplication(
  input: CtvApplicationInput,
): Promise<CtvApplicationRow> {
  const sb = requireSupabase();
  const { data: sessionData } = await sb.auth.getSession();
  const uid = sessionData.session?.user.id;
  if (!uid)
    throw new Error(
      isEn()
        ? "You must be logged in to apply as a collaborator."
        : "Bạn cần đăng nhập để ứng tuyển CTV.",
    );
  const { data, error } = await sb
    .from("ctv_applications")
    .insert({
      user_id: uid,
      full_name: input.fullName,
      contact: input.contact,
      experience: input.experience ?? null,
      games: input.games ?? null,
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") {
      throw new Error(
        isEn()
          ? "You already have a pending application."
          : "Bạn đã có một đơn ứng tuyển đang chờ duyệt.",
      );
    }
    throw new Error(error.message);
  }
  return data as CtvApplicationRow;
}

/** Đơn ứng tuyển mới nhất của tôi (null nếu chưa nộp). */
export async function getMyApplication(): Promise<CtvApplicationRow | null> {
  const sb = requireSupabase();
  const { data: sessionData } = await sb.auth.getSession();
  const uid = sessionData.session?.user.id;
  if (!uid) return null;
  const { data, error } = await sb
    .from("ctv_applications")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as CtvApplicationRow | null) ?? null;
}

/** Danh sách đơn ứng tuyển (admin — RLS chặn người thường). */
export async function listApplications(opts?: {
  status?: CtvApplicationStatus;
}): Promise<CtvApplicationRow[]> {
  const sb = requireSupabase();
  let query = sb
    .from("ctv_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (opts?.status) query = query.eq("status", opts.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as CtvApplicationRow[];
}

/** Admin duyệt/từ chối đơn. Duyệt = nâng role người nộp lên 'ctv' (RPC lo). */
export async function approveCtv(
  applicationId: string,
  approve: boolean,
  note?: string,
): Promise<CtvApplicationRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("approve_ctv", {
    p_application_id: applicationId,
    p_approve: approve,
    p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
  return data as CtvApplicationRow;
}
