// Dịch ghi chú order_events sang EN ở client.
// Server (RPC/trigger) ghi note bằng tiếng Việt cố định — khách xem EN vẫn thấy
// tiếng Việt. Các mẫu câu chuẩn được dịch tại đây; ghi chú tự do của admin/Seller
// (không khớp mẫu) giữ nguyên. Xem VI thì trả nguyên văn.
import type { Lang } from "@/i18n";

/** Câu cố định server ghi -> bản EN. */
const EXACT: Record<string, string> = {
  "Khách đặt đơn hàng.": "Customer placed the order.",
  "Admin xác nhận đã nhận thanh toán.": "Admin confirmed the payment.",
  "Seller tự nhận đơn.": "A seller claimed the order.",
  "Admin giao đơn cho Seller.": "Admin assigned the order to a seller.",
  "Người bán đã giao hàng — chờ khách xác nhận.":
    "The seller marked the order as delivered — waiting for the customer to confirm.",
  "Khách xác nhận đã nhận hàng — hoàn thành.":
    "Customer confirmed receipt — order completed.",
  "Quá hạn xử lý — đơn được trả về hàng đợi.":
    "Claim timed out — the order returned to the queue.",
  "Quá thời gian xử lý — đơn quay lại hàng đợi.":
    "Claim timed out — the order returned to the queue.",
  "Đơn đã được hoàn tiền.": "The order has been refunded.",
  "Admin từ chối yêu cầu hủy.": "Admin declined the cancellation request.",
  "Admin duyệt hủy": "Admin approved the cancellation",
  "Khách tự hủy sau 24h": "Auto-cancelled by the customer after 24h",
  "Vui lòng trao đổi với người bán.": "Please discuss with the seller.",
};

/** Mẫu câu có phần đuôi động (lý do khách nhập...) -> dịch phần đầu, giữ đuôi. */
const PREFIXES: Array<[string, string]> = [
  ["Khách yêu cầu hoàn tiền: ", "Customer requested a refund: "],
  ["Khách yêu cầu hủy đơn: ", "Customer requested cancellation: "],
  [
    "Khách yêu cầu hủy — TẠM DỪNG giao hàng. Lý do: ",
    "Customer requested cancellation — delivery PAUSED. Reason: ",
  ],
  ["Admin từ chối hoàn tiền.", "Admin declined the refund."],
  ["Khách hủy đơn ", "Customer cancelled the order "],
];

/**
 * Dịch note của order_events theo ngôn ngữ đang xem.
 * EN: dịch mẫu câu chuẩn; không khớp mẫu (ghi chú tự do) thì giữ nguyên.
 */
export function translateOrderNote(note: string | null, lang: Lang): string | null {
  if (!note || lang === "vi") return note;
  const trimmed = note.trim();
  const exact = EXACT[trimmed];
  if (exact) return exact;
  for (const [vi, en] of PREFIXES) {
    if (trimmed.startsWith(vi)) return en + trimmed.slice(vi.length).trimStart();
  }
  return note;
}
