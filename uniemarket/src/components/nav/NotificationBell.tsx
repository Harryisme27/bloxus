// Notification bell with unread badge + dropdown panel.
//
// - Badge: unread count via the shared ['notifications-unread'] query.
// - Panel: recent notifications (listMy({limit:15})); unread rows highlighted.
//   Clicking a row → markRead + navigate(link) + close.
// - Realtime: subscribeToMyNotifications → prepend to the list cache, toast.info,
//   refetch unread, and play the order beep for staff on 'order_new'.
//
// This is the app's SINGLE notifications realtime subscription (rendered once in
// the Navbar), so it does not also mount @/components/chat/useNotifications.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, CheckCheck } from "lucide-react";
import { listMy, markRead } from "@/lib/db/notifications";
import { subscribeToMyNotifications } from "@/lib/db/chat";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isStaffRole } from "@/lib/roles";
import { useAuthStore } from "@/store/authStore";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { playOrderBeep } from "@/components/nav/OrderSound";
import { useUnreadCount } from "@/components/nav/useUnreadCount";
import { usePick } from "@/i18n";
import type { NotificationRow } from "@/types/db";

const UNREAD_KEY = ["notifications-unread"];
const LIST_KEY = ["notifications"];

const STR = {
  vi: {
    notifications: "Thông báo",
    unreadSuffix: "chưa đọc",
    loading: "Đang tải...",
    empty: "Chưa có thông báo nào.",
    markAllRead: "Đánh dấu đã đọc tất cả",
    viewAll: "Xem tất cả",
  },
  en: {
    notifications: "Notifications",
    unreadSuffix: "unread",
    loading: "Loading...",
    empty: "No notifications yet.",
    markAllRead: "Mark all as read",
    viewAll: "View all",
  },
};

export function NotificationBell() {
  const t = usePick(STR);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  const role = useAuthStore((s) => s.user?.role ?? null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const enabled = isSupabaseConfigured && userId !== null;
  const unread = useUnreadCount();

  // Recent list is only fetched while the panel is open.
  const listQuery = useQuery({
    queryKey: LIST_KEY,
    queryFn: () => listMy({ limit: 15 }),
    enabled: enabled && open,
  });
  const rows = listQuery.data ?? [];

  // Realtime: prepend + toast + sound + refetch unread. Runs once while mounted.
  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = subscribeToMyNotifications((n) => {
      queryClient.setQueryData<NotificationRow[]>(LIST_KEY, (prev) =>
        prev ? [n, ...prev.filter((r) => r.id !== n.id)].slice(0, 15) : prev,
      );
      void queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
      toast.info(n.title, { description: n.body ?? undefined });
      // Đơn mới (admin) hoặc đơn vào hàng chờ nhận (Seller) -> phát âm thanh.
      if (
        (n.type === "order_new" || n.type === "order_claimable") &&
        isStaffRole(role)
      ) {
        playOrderBeep();
      }
    });
    return unsubscribe;
  }, [enabled, role, queryClient]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markReadMut = useMutation({
    mutationFn: (id: number) => markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
      void queryClient.invalidateQueries({ queryKey: LIST_KEY });
    },
    onError: (err) => toast.error(err.message),
  });

  const markAllMut = useMutation({
    mutationFn: async () => {
      const unreadIds = rows.filter((r) => !r.read_at).map((r) => r.id);
      await Promise.all(unreadIds.map((id) => markRead(id)));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
      void queryClient.invalidateQueries({ queryKey: LIST_KEY });
    },
    onError: (err) => toast.error(err.message),
  });

  function handleRow(n: NotificationRow) {
    if (!n.read_at) markReadMut.mutate(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  const hasUnread = rows.some((r) => !r.read_at);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.notifications}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text",
          open && "bg-surface-2 text-text",
        )}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 ? (
          <span className="tabular-nums-mono absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow px-1 text-[11px] font-bold text-text-on-yellow">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-heading text-sm font-semibold text-text">{t.notifications}</span>
            {unread > 0 ? (
              <span className="tabular-nums-mono rounded-full bg-surface-3 px-2 py-0.5 text-[11px] font-semibold text-text-muted">
                {unread} {t.unreadSuffix}
              </span>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {listQuery.isLoading ? (
              <p className="px-4 py-8 text-center text-sm text-text-subtle">{t.loading}</p>
            ) : rows.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-text-subtle">
                {t.empty}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((n) => {
                  const isUnread = !n.read_at;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleRow(n)}
                        className={cn(
                          "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-3",
                          isUnread && "bg-yellow-soft",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            isUnread ? "bg-yellow" : "bg-transparent",
                          )}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block truncate text-sm",
                              isUnread ? "font-semibold text-text" : "font-medium text-text-muted",
                            )}
                          >
                            {n.title}
                          </span>
                          {n.body ? (
                            <span className="mt-0.5 block line-clamp-2 text-xs text-text-muted">
                              {n.body}
                            </span>
                          ) : null}
                          <span className="mt-1 block text-[11px] text-text-subtle">
                            {relativeTime(n.created_at)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-3 hover:text-text"
            >
              {t.viewAll}
            </button>
            <button
              type="button"
              onClick={() => markAllMut.mutate()}
              disabled={markAllMut.isPending || !hasUnread}
              className="flex items-center justify-center gap-1.5 border-l border-border px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-3 hover:text-text disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              {t.markAllRead}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
