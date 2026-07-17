// Hook thông báo realtime cho người đang đăng nhập.
// - Toast (sonner) khi có thông báo mới; bấm "Xem" để đi tới link liên quan.
// - unread: số thông báo chưa đọc (queryKey ['notifications-unread']).
// KHÔNG tự mount ở đâu cả — bước tích hợp sẽ gọi hook này trong Navbar
// (đúng 1 lần cho toàn app, bên trong Router context).
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { subscribeToMyNotifications } from "@/lib/db/chat";
import { unreadCount } from "@/lib/db/notifications";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { usePick } from "@/i18n";

const STR = {
  vi: { view: "Xem" },
  en: { view: "View" },
};

export interface UseNotificationsResult {
  /** Số thông báo chưa đọc (0 khi chưa đăng nhập / chưa cấu hình). */
  unread: number;
}

export function useNotifications(): UseNotificationsResult {
  const t = usePick(STR);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id ?? null);

  const unreadQuery = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: unreadCount,
    enabled: isSupabaseConfigured && userId !== null,
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) return;
    const unsubscribe = subscribeToMyNotifications((notification) => {
      const link = notification.link;
      toast(notification.title, {
        description: notification.body ?? undefined,
        action: link ? { label: t.view, onClick: () => navigate(link) } : undefined,
      });
      void queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });
    return unsubscribe;
  }, [userId, navigate, queryClient]);

  return { unread: unreadQuery.data ?? 0 };
}
