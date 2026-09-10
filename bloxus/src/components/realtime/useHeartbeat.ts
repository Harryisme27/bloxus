// Heartbeat hook — cập nhật mốc "hoạt động gần đây" (last_seen) định kỳ.
//
// Khi đã đăng nhập, gọi touchLastSeen() ngay lúc mount rồi lặp lại mỗi 60s để
// người khác thấy trạng thái online. Dừng hẳn khi unmount hoặc đăng xuất. An
// toàn khi chưa cấu hình Supabase — khi đó không làm gì cả.
import { useEffect } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { touchLastSeen } from "@/lib/db/profiles";
import { useAuthStore } from "@/store/authStore";

const HEARTBEAT_INTERVAL_MS = 60_000;

/** Bơm last_seen mỗi 60s trong lúc người dùng đang mở app. */
export function useHeartbeat(): void {
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;

    const beat = () => {
      void touchLastSeen().catch(() => {
        // Bỏ qua lỗi mạng lẻ — nhịp kế tiếp sẽ thử lại.
      });
    };

    beat();
    const id = window.setInterval(beat, HEARTBEAT_INTERVAL_MS);

    return () => {
      window.clearInterval(id);
    };
  }, [session]);
}
