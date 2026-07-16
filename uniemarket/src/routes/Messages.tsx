// /messages — hộp tin nhắn của tài khoản (khách + staff đều dùng được;
// RLS phía server quyết định ai thấy thread nào).
// 2 cột: danh sách hội thoại (trái) + khung chat (phải). Deep-link ?thread=<id>.
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
import { listMyThreads } from "@/lib/db/chat";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const PANE_HEIGHT = "h-[65vh] min-h-[28rem]";

export function Messages() {
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
  const activeThread = threads.find((t) => t.id === selectedId) ?? threads[0] ?? null;

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
            Đăng nhập để xem tin nhắn
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
            Mỗi đơn hàng có một kênh trao đổi riêng với đội ngũ Uniemarket.
          </p>
        </div>
        <Link
          to="/login?next=/messages"
          className={buttonVariants({ variant: "primary", size: "md" })}
        >
          Đăng nhập
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
        <p className="text-sm text-text-muted">Không tải được danh sách tin nhắn.</p>
        <p className="max-w-sm text-xs text-text-subtle">
          {threadsQuery.error instanceof Error ? threadsQuery.error.message : ""}
        </p>
        <Button variant="secondary" size="sm" onClick={() => void threadsQuery.refetch()}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Thử lại
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
          <p className="font-heading text-lg font-semibold text-text">Chưa có cuộc trò chuyện</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
            Tin nhắn sẽ xuất hiện khi bạn có đơn hàng — mỗi đơn có một kênh trao đổi riêng với đội
            ngũ hỗ trợ.
          </p>
        </div>
        <Link to="/games" className={buttonVariants({ variant: "primary", size: "md" })}>
          Khám phá cửa hàng
        </Link>
      </div>
    );
  } else {
    content = (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        {/* Cột trái: danh sách — mobile ẩn khi đã chọn thread qua URL */}
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

        {/* Cột phải: khung chat — mobile ẩn khi chưa chọn */}
        <div className={cn("min-w-0", !selectedId && "hidden lg:block")}>
          {selectedId ? (
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 lg:hidden"
              onClick={() => setSearchParams({})}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Danh sách hội thoại
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
              <p className="text-sm text-text-subtle">Chọn một hội thoại để bắt đầu.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <PageContainer className="py-8 sm:py-12">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text sm:text-3xl">Tin nhắn</h1>
        <p className="mt-1 text-sm text-text-muted">
          Trao đổi với đội ngũ Uniemarket về các đơn hàng của bạn.
        </p>
      </div>
      {content}
    </PageContainer>
  );
}
