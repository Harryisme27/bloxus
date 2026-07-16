// Formatting helpers. Currency is VND (BIGINT đồng, không có phần thập phân).
const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

/** Format a number as VND currency, e.g. formatPrice(875000) -> "875.000 ₫". */
export function formatPrice(n: number): string {
  return currencyFormatter.format(n);
}

/** Format an ISO date string as a short, human-readable relative time (Vietnamese). */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 5) return "vừa xong";
  if (diffSec < 60) return `${diffSec} giây trước`;

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;

  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;

  const diffMonth = Math.round(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} tháng trước`;

  const diffYear = Math.round(diffMonth / 12);
  return `${diffYear} năm trước`;
}
