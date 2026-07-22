// /notifications — trang xem TOÀN BỘ thông báo (chuông chỉ giữ 15 cái mới).
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { RequireAuth } from "@/components/account/RequireAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listMy, markRead } from "@/lib/db/notifications";
import { requireSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePick } from "@/i18n";
import type { NotificationRow } from "@/types/db";

const PER_PAGE = 15;

const STR = {
  vi: {
    title: "Thông báo",
    subtitle: "Toàn bộ thông báo của bạn — mới nhất trước.",
    empty: "Chưa có thông báo nào.",
    markAll: "Đánh dấu đã đọc tất cả",
    page: "Trang",
  },
  en: {
    title: "Notifications",
    subtitle: "All your notifications — newest first.",
    empty: "No notifications yet.",
    markAll: "Mark all as read",
    page: "Page",
  },
};

export function Notifications() {
  return (
    <RequireAuth>
      <NotificationsContent />
    </RequireAuth>
  );
}

function NotificationsContent() {
  const t = usePick(STR);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const query = useQuery({
    queryKey: ["all-notifications"],
    queryFn: () => listMy({ limit: 200 }),
    enabled: isSupabaseConfigured,
  });
  const all = query.data ?? [];
  const pages = Math.max(1, Math.ceil(all.length / PER_PAGE));
  const rows = all.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const hasUnread = all.some((n) => !n.read_at);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["all-notifications"] });
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    void queryClient.invalidateQueries({ queryKey: ["unread-count"] });
  };

  const markAllMut = useMutation({
    mutationFn: async () => {
      const sb = requireSupabase();
      const { error } = await sb
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  async function handleClick(n: NotificationRow) {
    if (!n.read_at) {
      try {
        await markRead(n.id);
      } catch {
        // đánh dấu đọc lỗi thì vẫn điều hướng bình thường
      }
      invalidate();
    }
    if (n.link) navigate(n.link);
  }

  return (
    <PageContainer className="py-10 sm:py-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 font-heading text-3xl font-bold text-text">
            <Bell className="h-7 w-7 text-yellow" aria-hidden />
            {t.title}
          </h1>
          <p className="mt-2 text-text-muted">{t.subtitle}</p>
        </div>
        {hasUnread ? (
          <Button size="sm" variant="secondary" disabled={markAllMut.isPending} onClick={() => markAllMut.mutate()}>
            <Check className="h-3.5 w-3.5" aria-hidden /> {t.markAll}
          </Button>
        ) : null}
      </div>

      {query.isPending ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : all.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-12 text-center text-sm text-text-muted">
          {t.empty}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {rows.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => void handleClick(n)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2",
                    !n.read_at && "bg-yellow-soft/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.read_at ? "bg-border-strong" : "bg-yellow",
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-sm", n.read_at ? "text-text-muted" : "font-semibold text-text")}>
                      {n.title}
                    </span>
                    {n.body ? (
                      <span className="mt-0.5 block truncate text-xs text-text-subtle">{n.body}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs text-text-subtle">{relativeTime(n.created_at)}</span>
                </button>
              </li>
            ))}
          </ul>
          {pages > 1 ? (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-text-muted">
              <Button size="sm" variant="secondary" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Button>
              <span>{t.page} {page + 1}/{pages}</span>
              <Button size="sm" variant="secondary" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ) : null}
        </>
      )}
    </PageContainer>
  );
}
