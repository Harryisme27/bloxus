// Helper hiển thị trạng thái "hoạt động gần đây" từ mốc last_seen_at.
import { relativeTime } from "@/lib/format";

/** Coi là "đang online" nếu hoạt động trong vòng 3 phút. */
const ONLINE_THRESHOLD_MS = 3 * 60_000;

/**
 * Chuyển mốc last_seen_at (ISO) thành nhãn tiếng Việt để hiển thị:
 * - `null`            → "Chưa rõ"
 * - trong vòng 3 phút → "Đang hoạt động"
 * - còn lại           → "Hoạt động " + relativeTime(iso)  (vd "Hoạt động 3 giờ trước")
 */
export function lastSeenText(iso: string | null): string {
  if (!iso) return "Chưa rõ";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Chưa rõ";
  if (Date.now() - then <= ONLINE_THRESHOLD_MS) return "Đang hoạt động";
  return "Hoạt động " + relativeTime(iso);
}
