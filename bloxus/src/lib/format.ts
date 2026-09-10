// Formatting helpers. Giá LƯU bằng VND (BIGINT đồng). Hiển thị có thể quy đổi
// sang USD tuỳ chọn tiền tệ của người xem (chỉ hiển thị — server vẫn tính VND).
import { useLangStore } from "@/i18n";
import { useCurrencyStore, USD_VND_RATE } from "@/store/currencyStore";

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format một số tiền VND theo tiền tệ đang chọn.
 * VND: "875.000 ₫". USD (quy đổi theo tỉ giá): "$35.00". */
export function formatPrice(n: number): string {
  if (useCurrencyStore.getState().currency === "usd") {
    return usdFormatter.format(n / USD_VND_RATE);
  }
  return vndFormatter.format(n);
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
