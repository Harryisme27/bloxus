// /work/chat — chat nội bộ đội ngũ (kênh # Chung, chỉ admin + Seller thấy).
// Trang này nằm sau RequireRole(['admin','ctv']) nên session/role đã bảo đảm.
import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Hash, RefreshCw } from "lucide-react";
import { SetupNotice } from "@/components/SetupNotice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessagePane } from "@/components/chat/MessagePane";
import { ThreadList } from "@/components/chat/ThreadList";
import { listMyThreads } from "@/lib/db/chat";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { usePick } from "@/i18n";

const PANE_HEIGHT = "h-[62vh] min-h-[26rem]";

const STR = {
  vi: {
    loadError: "Không tải được kênh chat nội bộ.",
    retry: "Thử lại",
    emptyTitle: "Chưa thấy kênh nội bộ nào",
    emptyBodyPre: "Kênh",
    emptyBodyMid: "được tạo sẵn khi chạy file",
    emptyBodyPost:
      ". Nếu bạn vừa được duyệt Seller, thử tải lại trang; nếu vẫn không thấy, báo admin kiểm tra bước cài đặt.",
    backToChannels: "Danh sách kênh",
    pickChannel: "Chọn một kênh để bắt đầu.",
    title: "Chat nội bộ",
    subtitle:
      "Kênh # Chung của đội ngũ — khách hàng không thấy nội dung ở đây. Tên người gửi kèm nhãn vai trò (Admin / Seller).",
  },
  en: {
    loadError: "Couldn't load the team chat channels.",
    retry: "Try again",
    emptyTitle: "No internal channels found",
    emptyBodyPre: "The",
    emptyBodyMid: "channel is created automatically when you run",
    emptyBodyPost:
      ". If you were just approved as a Seller, try reloading the page; if it still doesn't appear, ask an admin to check the setup step.",
    backToChannels: "Channel list",
    pickChannel: "Pick a channel to get started.",
    title: "Team chat",
    subtitle:
      "The team's # Chung channel — customers can't see anything here. Sender names include a role label (Admin / Seller).",
  },
};

export function WorkChat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const t = usePick(STR);
  const selectedId = searchParams.get("thread");

  const threadsQuery = useQuery({
    queryKey: ["threads"],
    queryFn: listMyThreads,
    enabled: isSupabaseConfigured,
  });

  // Chỉ giữ thread nội bộ (kind='staff') — thread đơn hàng xem ở trang đơn.
  const staffThreads = (threadsQuery.data ?? []).filter((t) => t.kind === "staff");
  const activeThread = staffThreads.find((t) => t.id === selectedId) ?? staffThreads[0] ?? null;

  let content: ReactNode;

  if (!isSupabaseConfigured) {
    content = <SetupNotice />;
  } else if (threadsQuery.isPending) {
    content = (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div className="space-y-2 rounded-2xl border border-border bg-surface p-3">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
        <Skeleton className={cn("hidden rounded-2xl lg:block", PANE_HEIGHT)} />
      </div>
    );
  } else if (threadsQuery.isError) {
    content = (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-10 text-center">
        <p className="text-sm text-text-muted">{t.loadError}</p>
        <p className="max-w-sm text-xs text-text-subtle">
          {threadsQuery.error instanceof Error ? threadsQuery.error.message : ""}
        </p>
        <Button variant="secondary" size="sm" onClick={() => void threadsQuery.refetch()}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          {t.retry}
        </Button>
      </div>
    );
  } else if (staffThreads.length === 0) {
    content = (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-soft text-green">
          <Hash className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold text-text">{t.emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-text-muted">
            {t.emptyBodyPre} <span className="font-semibold text-text"># Chung</span>{" "}
            {t.emptyBodyMid}{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">supabase/01-schema.sql</code>
            {t.emptyBodyPost}
          </p>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div className={cn("min-w-0", selectedId && "hidden lg:block")}>
          <div
            className={cn(
              "overflow-y-auto rounded-2xl border border-border bg-surface p-2",
              PANE_HEIGHT,
            )}
          >
            <ThreadList
              threads={staffThreads}
              selectedId={activeThread?.id ?? null}
              onSelect={(thread) => setSearchParams({ thread: thread.id })}
            />
          </div>
        </div>
        <div className={cn("min-w-0", !selectedId && "hidden lg:block")}>
          {selectedId ? (
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 lg:hidden"
              onClick={() => setSearchParams({})}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t.backToChannels}
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
              <p className="text-sm text-text-subtle">{t.pickChannel}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-text">{t.title}</h1>
      </div>
      {content}
    </div>
  );
}
