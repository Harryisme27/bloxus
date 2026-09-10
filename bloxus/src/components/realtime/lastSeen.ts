// Helper hiển thị trạng thái "hoạt động gần đây" từ mốc last_seen_at (song ngữ).
import { relativeTime } from "@/lib/format";
import { useLangStore } from "@/i18n";

/** Coi là "đang online" nếu hoạt động trong vòng 3 phút. */
const ONLINE_THRESHOLD_MS = 3 * 60_000;

/** Chuyển mốc last_seen_at (ISO) thành nhãn hiển thị theo ngôn ngữ hiện tại. */
export function lastSeenText(iso: string | null): string {
  const en = useLangStore.getState().lang === "en";
  if (!iso) return en ? "Unknown" : "Chưa rõ";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return en ? "Unknown" : "Chưa rõ";
  if (Date.now() - then <= ONLINE_THRESHOLD_MS) return en ? "Active now" : "Đang hoạt động";
  return (en ? "Active " : "Hoạt động ") + relativeTime(iso);
}
