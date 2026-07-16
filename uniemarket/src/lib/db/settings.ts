// Data layer — Cài đặt shop (STK ngân hàng, Momo, QR, thương hiệu).
// Các khóa công khai (bank_*, momo_*, brand) ai cũng đọc được để checkout
// hiển thị thông tin chuyển khoản; chỉ admin ghi.
import { requireSupabase } from "@/lib/supabase";
import type { AppSettingRow } from "@/types/db";

export type AppSettings = Record<string, unknown>;

/** Đọc toàn bộ cài đặt thành map { key: value }. */
export async function getSettings(): Promise<AppSettings> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("app_settings").select("*");
  if (error) throw new Error(error.message);
  const map: AppSettings = {};
  for (const row of (data ?? []) as AppSettingRow[]) {
    map[row.key] = row.value;
  }
  return map;
}

/** Admin cập nhật 1 khóa cài đặt (value là JSON bất kỳ, thường là string). */
export async function updateSetting(key: string, value: unknown): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb
    .from("app_settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}
