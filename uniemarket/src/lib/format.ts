// Formatting helpers. Currency is VND (BIGINT đồng, không có phần thập phân).
import { useLangStore } from "@/i18n";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

/** Format a number as VND currency, e.g. formatPrice(875000) -> "875.000 ₫". */
export function formatPrice(n: number): string {
  return currencyFormatter.format(n);
}

/** Format an ISO date string as a short, human-readable relative time. Song ngữ:
 * đọc ngôn ngữ hiện tại từ store (component gọi nó re-render khi đổi ngôn ngữ). */
export function relativeTime(iso: string): string {
  const lang = useLangStore.getState().lang;
  const en = lang === "en";
  const then = new Date(iso).getTime();
  const diffSec = Math.round((Date.now() - then) / 1000);

  if (diffSec < 5) return en ? "just now" : "vừa xong";
  if (diffSec < 60) return en ? `${diffSec}s ago` : `${diffSec} giây trước`;

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return en ? `${diffMin} min ago` : `${diffMin} phút trước`;

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return en ? `${diffHour}h ago` : `${diffHour} giờ trước`;

  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return en ? `${diffDay}d ago` : `${diffDay} ngày trước`;

  const diffMonth = Math.round(diffDay / 30);
  if (diffMonth < 12) return en ? `${diffMonth}mo ago` : `${diffMonth} tháng trước`;

  const diffYear = Math.round(diffMonth / 12);
  return en ? `${diffYear}y ago` : `${diffYear} năm trước`;
}
