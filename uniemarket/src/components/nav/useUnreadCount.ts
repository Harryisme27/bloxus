// Shared unread-notifications count. Reads the ['notifications-unread'] query
// (same key the realtime handler in NotificationBell invalidates) so the bell
// badge, the chat-icon dot and the mobile menu all stay in sync from one cache
// entry. Returns 0 when logged out / Supabase not configured.
import { useQuery } from "@tanstack/react-query";
import { unreadCount } from "@/lib/db/notifications";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export function useUnreadCount(): number {
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  const { data } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: unreadCount,
    enabled: isSupabaseConfigured && userId !== null,
  });
  return data ?? 0;
}
