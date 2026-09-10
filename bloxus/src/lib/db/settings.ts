// Data layer — Cài đặt shop (STK ngân hàng, Momo, QR, thương hiệu).
// Các khóa công khai (bank_*, momo_*, brand) ai cũng đọc được để checkout
// hiển thị thông tin chuyển khoản; chỉ admin ghi.
import { requireSupabase } from "@/lib/supabase";
import type { AppSettingRow } from "@/types/db";
import type { GatewaysSettings } from "@/lib/paymentGateways";

export type AppSettings = Record<string, unknown>;

/**
 * Cổng thanh toán ĐANG BẬT mà khách được xem (RPC public_payment_gateways đã bỏ
 * secret_key). Khách không đọc được setting payment_gateways trực tiếp vì RLS.
 * Rỗng -> mặc định bank + momo.
 */
export async function getPublicGateways(): Promise<GatewaysSettings> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("public_payment_gateways");
  if (error) throw new Error(error.message);
  const gws = (data ?? {}) as GatewaysSettings;
  if (!gws || Object.keys(gws).length === 0) {
    return { bank_transfer: { enabled: true }, momo: { enabled: true } };
  }
  return gws;
}

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
