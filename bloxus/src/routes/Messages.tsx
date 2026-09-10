// /messages — hộp tin nhắn của tài khoản (khách + staff đều dùng được;
// RLS phía server quyết định ai thấy thread nào).
// 3 cột (desktop): danh sách hội thoại (trái) · khung chat (giữa) · "Chi tiết
// đơn" (phải). Mobile: xếp chồng — chọn thread mới hiện chat + sidebar bên dưới.
// Deep-link ?thread=<id>.
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Inbox, MessagesSquare, RefreshCw } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { SetupNotice } from "@/components/SetupNotice";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessagePane } from "@/components/chat/MessagePane";
import { ThreadList } from "@/components/chat/ThreadList";
import { OrderDetailsSidebar } from "@/components/chat/OrderDetailsSidebar";
import { listMyThreads } from "@/lib/db/chat";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { usePick } from "@/i18n";

const PANE_HEIGHT = "h-[65vh] min-h-[28rem]";

const STR = {
  vi: {
    loginTitle: "Đăng nhập để xem tin nhắn",
    loginBody: "Mỗi đơn hàng có một kênh trao đổi riêng với đội ngũ Bloxus.",
    login: "Đăng nhập",
    loadFailed: "Không tải được danh sách tin nhắn.",
    retry: "Thử lại",
    emptyTitle: "Chưa có cuộc trò chuyện",
    emptyBody:
      "Tin nhắn sẽ xuất hiện khi bạn có đơn hàng — mỗi đơn có một kênh trao đổi riêng với đội ngũ hỗ trợ.",
    exploreStore: "Khám phá cửa hàng",
    threadListBack: "Danh sách hội thoại",
    selectThread: "Chọn một hội thoại để bắt đầu.",
    title: "Tin nhắn",
    subtitle: "Trao đổi với đội ngũ Bloxus về các đơn hàng của bạn.",
  },
  en: {
    loginTitle: "Log in to see your messages",
    loginBody: "Every order has its own chat channel with the Bloxus team.",
    login: "Log in",
    loadFailed: "Couldn't load your messages.",
    retry: "Try again",
    emptyTitle: "No conversations yet",
    emptyBody:
      "Messages appear once you have an order — each order has its own chat channel with the support team.",
    exploreStore: "Explore the store",
    threadListBack: "Conversation list",
    selectThread: "Select a conversation to start.",
    title: "Messages",
    subtitle: "Chat with the Bloxus team about your orders.",
  },
};

export function Messages() {
  const t = usePick(STR);
  const session = useAuthStore((s) => s.session);
  const authLoading = useAuthStore((s) => s.loading);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("thread");

  const threadsQuery = useQuery({
    queryKey: ["threads"],
    queryFn: listMyThreads,
    enabled: isSupabaseConfigured && Boolean(session),
  });

  const threads = threadsQuery.data ?? [];
  // Thread đang mở: theo URL, fallback thread mới nhất (desktop).
  const activeThread = threads.find((thread) => thread.id === selectedId) ?? threads[0] ?? null;

  let content: ReactNode;

  if (!isSupabaseConfigured) {
    content = <SetupNotice />;
  } else if (authLoading) {
    content = (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <Skeleton className={cn("rounded-2xl", PANE_HEIGHT)} />
        <Skeleton className={cn("hidden rounded-2xl lg:block", PANE_HEIGHT)} />
      </div>
    );
  } else if (!session) {
    content = (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-soft text-yellow">
          <MessagesSquare className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold text-text">
            {t.loginTitle}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
            {t.loginBody}
          </p>
        </div>
        <Link
          to="/login?next=/messages"
          className={buttonVariants({ variant: "primary", size: "md" })}
        >
          {t.login}
        </Link>
      </div>
    );
  } else if (threadsQuery.isPending) {
    content = (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="space-y-2 rounded-2xl border border-border bg-surface p-3">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
        <Skeleton className={cn("hidden rounded-2xl lg:block", PANE_HEIGHT)} />
      </div>
    );
  } else if (threadsQuery.isError) {
    content = (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-10 text-center">
        <p className="text-sm text-text-muted">{t.loadFailed}</p>
        <p className="max-w-sm text-xs text-text-subtle">
          {threadsQuery.error instanceof Error ? threadsQuery.error.message : ""}
        </p>
        <Button variant="secondary" size="sm" onClick={() => void threadsQuery.refetch()}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          {t.retry}
        </Button>
      </div>
    );
  } else if (threads.length === 0) {
    content = (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-text-subtle">
          <Inbox className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold text-text">{t.emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
            {t.emptyBody}
          </p>
        </div>
        <Link to="/games" className={buttonVariants({ variant: "primary", size: "md" })}>
          {t.exploreStore}
        </Link>
      </div>
    );
  } else {
    content = (
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        {/* Cột trái: danh sách hội thoại — mobile ẩn khi đã chọn thread */}
        <div className={cn("min-w-0", selectedId && "hidden lg:block")}>
          <div
            className={cn(
              "overflow-y-auto rounded-2xl border border-border bg-surface p-2",
              PANE_HEIGHT,
            )}
          >
            <ThreadList
              threads={threads}
              selectedId={activeThread?.id ?? null}
              onSelect={(thread) => setSearchParams({ thread: thread.id })}
            />
          </div>
        </div>

        {/* Cột giữa: khung chat — mobile ẩn khi chưa chọn */}
        <div className={cn("min-w-0", !selectedId && "hidden lg:block")}>
          {selectedId ? (
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 lg:hidden"
              onClick={() => setSearchParams({})}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t.threadListBack}
            </Button>
          ) : null}
          {activeThread ? (
            <MessagePane key={activeThread.id} thread={activeThread} className={PANE_HEIGHT} />
          ) : (
            <div
              className={cn(
                "flex items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface",
                PANE_HEIGHT,
              )}
            >
              <p className="text-sm text-text-subtle">{t.selectThread}</p>
            </div>
          )}
        </div>

        {/* Cột phải: "Chi tiết đơn" — mobile xếp dưới chat khi đã chọn thread */}
        <div className={cn("min-w-0", !selectedId && "hidden lg:block")}>
          {activeThread ? (
            <OrderDetailsSidebar
              key={activeThread.id}
              thread={activeThread}
              className="lg:h-[65vh] lg:min-h-[28rem]"
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <PageContainer className="py-8 sm:py-12">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text sm:text-3xl">{t.title}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {t.subtitle}
        </p>
      </div>
      {content}
    </PageContainer>
  );
}
