// Helper dữ liệu phụ cho khu làm việc (Agent C).
// listWorkOrders() chỉ trả OrderRow (không kèm dòng hàng) — hook/hàm ở đây
// tải gọn order_items theo lô cho bảng đơn + card dashboard.
import { requireSupabase } from "@/lib/supabase";
import type { Lang } from "@/i18n";

/** Dòng hàng rút gọn — đủ để hiển thị tóm tắt + đếm số món. */
export interface OrderItemLite {
  name: string;
  quantity: number;
}

/**
 * Tải dòng hàng cho nhiều đơn cùng lúc (RLS: admin thấy tất cả, CTV chỉ thấy
 * đơn được giao). Trả về map order_id -> danh sách dòng hàng rút gọn.
 */
export async function listItemsForOrders(
  orderIds: string[],
): Promise<Record<string, OrderItemLite[]>> {
  if (orderIds.length === 0) return {};
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("order_items")
    .select("order_id, name, quantity")
    .in("order_id", orderIds);
  if (error) throw new Error(error.message);
  const map: Record<string, OrderItemLite[]> = {};
  for (const row of (data ?? []) as Array<{ order_id: string; name: string; quantity: number }>) {
    (map[row.order_id] ??= []).push({ name: row.name, quantity: row.quantity });
  }
  return map;
}

/** Tổng số món (cộng quantity) của 1 đơn. */
export function countItems(items: OrderItemLite[] | undefined): number {
  if (!items) return 0;
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Tóm tắt dòng hàng: "Tên A ×2, Tên B +1 món khác". */
export function summarizeItems(items: OrderItemLite[] | undefined, lang: Lang): string {
  if (!items || items.length === 0) return "—";
  const parts = items
    .slice(0, 2)
    .map((item) => (item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name));
  const rest = items.length - 2;
  if (rest <= 0) return parts.join(", ");
  return lang === "vi"
    ? `${parts.join(", ")} +${rest} món khác`
    : `${parts.join(", ")} +${rest} more`;
}

/** Mô tả selected_options của 1 dòng hàng service (tier hoặc kéo rank). */
export function describeSelectedOptions(
  opts: Record<string, unknown> | null,
  lang: Lang,
): string | null {
  if (!opts) return null;
  if (typeof opts.tier_id === "string") {
    return `${lang === "vi" ? "Gói" : "Package"}: ${opts.tier_id}`;
  }
  if (typeof opts.from === "string" && typeof opts.to === "string") {
    return `Rank: ${opts.from} → ${opts.to}`;
  }
  return null;
}

/** Nhãn kênh liên hệ của khách ("discord" -> "Discord"...). */
export function contactChannelLabel(channel: string | null, lang: Lang): string {
  if (!channel) return lang === "vi" ? "Liên hệ" : "Contact";
  const key = channel.trim().toLowerCase();
  const phone = lang === "vi" ? "SĐT" : "Phone";
  const known: Record<string, string> = {
    discord: "Discord",
    zalo: "Zalo",
    facebook: "Facebook",
    messenger: "Messenger",
    phone,
    sdt: phone,
    email: "Email",
    telegram: "Telegram",
  };
  return known[key] ?? channel;
}

/** Nhãn phương thức thanh toán. */
export function paymentMethodLabel(method: string | null, lang: Lang): string {
  if (method === "bank_transfer") return lang === "vi" ? "Chuyển khoản" : "Bank transfer";
  if (method === "momo") return "MoMo";
  return "—";
}
