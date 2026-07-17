// Khung hội thoại dùng chung: header + danh sách tin nhắn (realtime) + ô nhập.
// Dùng cho cả thread đơn hàng (OrderChatPanel) lẫn thread nội bộ staff
// (/messages, /work/chat, ChatWidget).
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Hash, RefreshCw, Send, ShoppingBag } from "lucide-react";
import { listMessages, postMessage, subscribeToThread } from "@/lib/db/chat";
import { getOrder } from "@/lib/db/orders";
import { getPublicProfile } from "@/lib/db/profiles";
import { relativeTime } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useOrderRealtime } from "@/components/realtime/useOrderRealtime";
import { lastSeenText } from "@/components/realtime/lastSeen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSenderProfiles } from "./useSenderProfiles";
import type { MessageRow, ThreadRow } from "@/types/db";

/** Tiêu đề hiển thị của thread (cột title đã lưu sẵn, có fallback). */
export function threadTitle(thread: ThreadRow): string {
  if (thread.title) return thread.title;
  return thread.kind === "staff" ? "# Chung" : "Trao đổi đơn hàng";
}

export interface MessagePaneProps {
  thread: ThreadRow;
  className?: string;
  /** Gọn cho widget nổi: padding/chữ nhỏ hơn. */
  compact?: boolean;
  /** Ẩn header có sẵn khi khung cha tự render header riêng. */
  hideHeader?: boolean;
}

export function MessagePane({ thread, className, compact, hideHeader }: MessagePaneProps) {
  const myId = useAuthStore((s) => s.session?.user.id ?? null);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useQuery({
    queryKey: ["messages", thread.id],
    queryFn: () => listMessages(thread.id),
    enabled: isSupabaseConfigured,
  });
  const messages = messagesQuery.data ?? [];

  const senderProfiles = useSenderProfiles(
    messages.filter((m) => m.sender_id !== myId).map((m) => m.sender_id),
  );

  // --- Header thread đơn hàng: người đối diện + "hoạt động gần đây" ---
  const isOrderThread = thread.kind === "order" && Boolean(thread.order_id);

  // Đơn của thread — cùng queryKey ['order', id] với OrderDetailsSidebar nên
  // dữ liệu dùng chung; useOrderRealtime làm mới key này khi đơn đổi.
  const orderQuery = useQuery({
    queryKey: ["order", thread.order_id],
    queryFn: () => getOrder(thread.order_id as string),
    enabled: isSupabaseConfigured && isOrderThread,
    staleTime: 30_000,
  });
  const order = orderQuery.data ?? null;

  // Realtime đơn hàng: trạng thái đổi -> sidebar (dùng cùng cache) cập nhật ngay.
  useOrderRealtime(isOrderThread ? (thread.order_id ?? undefined) : undefined);

  // Người đối diện: tôi là khách -> CTV được giao ("Đội hỗ trợ" khi chưa giao);
  // tôi là staff -> khách đặt đơn.
  const iAmBuyer = order && myId ? order.user_id === myId : false;
  const counterpartyId = order ? (iAmBuyer ? order.assigned_ctv : order.user_id) : null;

  const counterpartyQuery = useQuery({
    queryKey: ["public-profile", counterpartyId],
    queryFn: () => getPublicProfile(counterpartyId as string),
    enabled: isSupabaseConfigured && Boolean(counterpartyId),
    staleTime: 5 * 60 * 1000,
  });
  const counterparty = counterpartyQuery.data ?? null;

  const counterpartyName = iAmBuyer
    ? (counterparty?.display_name ?? counterparty?.username ?? "Đội hỗ trợ")
    : (counterparty?.display_name ?? counterparty?.username ?? "Khách hàng");
  const counterpartyAvatar =
    counterparty?.avatar_url && /^https?:\/\//i.test(counterparty.avatar_url)
      ? counterparty.avatar_url
      : null;
  // "⚡ Phản hồi: vài giây · 🕓 Hoạt động 3 giờ trước" (bỏ phần hoạt động khi
  // chưa có hồ sơ người đối diện, vd "Đội hỗ trợ").
  const orderSubtitle = counterparty
    ? `⚡ Phản hồi: vài giây · 🕓 ${lastSeenText(counterparty.last_seen_at)}`
    : "⚡ Phản hồi: vài giây";

  // Realtime: tin mới -> thêm vào cache (chống trùng id) + cập nhật inbox.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const unsubscribe = subscribeToThread(thread.id, (msg) => {
      queryClient.setQueryData<MessageRow[]>(["messages", thread.id], (old) => {
        const list = old ?? [];
        if (list.some((m) => m.id === msg.id)) return list;
        return [...list, msg];
      });
      void queryClient.invalidateQueries({ queryKey: ["threads"] });
    });
    return unsubscribe;
  }, [thread.id, queryClient]);

  // Tự cuộn xuống cuối khi có tin mới.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, thread.id]);

  const sendMutation = useMutation({
    mutationFn: (body: string) => postMessage(thread.id, body),
    onMutate: (body) => {
      // Optimistic: hiện tin ngay với id tạm.
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      queryClient.setQueryData<MessageRow[]>(["messages", thread.id], (old) => [
        ...(old ?? []),
        {
          id: tempId,
          thread_id: thread.id,
          sender_id: myId ?? "",
          body,
          attachments: [],
          created_at: new Date().toISOString(),
        },
      ]);
      return { tempId };
    },
    onError: (err, _body, ctx) => {
      if (ctx) {
        queryClient.setQueryData<MessageRow[]>(["messages", thread.id], (old) =>
          (old ?? []).filter((m) => m.id !== ctx.tempId),
        );
      }
      toast.error(err instanceof Error ? err.message : "Không gửi được tin nhắn.");
    },
    onSuccess: (row, _body, ctx) => {
      queryClient.setQueryData<MessageRow[]>(["messages", thread.id], (old) => {
        const list = (old ?? []).filter((m) => m.id !== ctx.tempId);
        if (list.some((m) => m.id === row.id)) return list;
        return [...list, row];
      });
      void queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  function handleSend() {
    const body = draft.trim();
    if (!body || sendMutation.isPending) return;
    setDraft("");
    sendMutation.mutate(body);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter gửi, Shift+Enter xuống dòng.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface",
        className,
      )}
    >
      {!hideHeader ? (
        <div
          className={cn(
            "flex items-center gap-3 border-b border-border bg-surface-2",
            compact ? "px-3 py-2.5" : "px-4 py-3",
          )}
        >
          {isOrderThread ? (
            counterpartyAvatar ? (
              <img
                src={counterpartyAvatar}
                alt={counterpartyName}
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-soft text-yellow">
                <ShoppingBag className="h-4 w-4" aria-hidden />
              </span>
            )
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-soft text-green">
              <Hash className="h-4 w-4" aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-semibold text-text">
              {isOrderThread && order ? counterpartyName : threadTitle(thread)}
            </p>
            <p className="truncate text-xs text-text-subtle">
              {isOrderThread ? orderSubtitle : "Kênh nội bộ đội ngũ"}
            </p>
          </div>
        </div>
      ) : null}

      {/* Danh sách tin nhắn */}
      <div
        ref={scrollRef}
        className={cn("flex-1 space-y-3 overflow-y-auto", compact ? "p-3" : "p-4")}
      >
        {messagesQuery.isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-3/5 rounded-2xl" />
            <Skeleton className="ml-auto h-10 w-1/2 rounded-2xl" />
            <Skeleton className="h-10 w-2/3 rounded-2xl" />
          </div>
        ) : messagesQuery.isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-text-muted">Không tải được tin nhắn.</p>
            <p className="max-w-xs text-xs text-text-subtle">
              {messagesQuery.error instanceof Error ? messagesQuery.error.message : ""}
            </p>
            <Button variant="secondary" size="sm" onClick={() => void messagesQuery.refetch()}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Thử lại
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="max-w-xs text-center text-sm text-text-subtle">
              Chưa có tin nhắn — hãy bắt đầu trao đổi
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === myId;
            const isTemp = msg.id.startsWith("temp-");
            const profile = isOwn ? undefined : senderProfiles[msg.sender_id];
            const name = isOwn
              ? "Bạn"
              : (profile?.display_name ?? profile?.username ?? "Thành viên");
            return (
              <div
                key={msg.id}
                className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    isOwn
                      ? "rounded-br-sm bg-yellow text-text-on-yellow"
                      : "rounded-bl-sm bg-surface-2 text-text",
                    isTemp && "opacity-60",
                  )}
                >
                  {msg.body}
                </div>
                <span className="flex items-center gap-1.5 px-1 text-[11px] text-text-subtle">
                  <span>{name}</span>
                  {profile?.role === "admin" ? (
                    <Badge variant="gold" className="px-1.5 py-0 text-[10px]">
                      Admin
                    </Badge>
                  ) : null}
                  {profile?.role === "ctv" ? (
                    <Badge variant="green" className="px-1.5 py-0 text-[10px]">
                      CTV
                    </Badge>
                  ) : null}
                  <span>· {isTemp ? "đang gửi…" : relativeTime(msg.created_at)}</span>
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Ô nhập */}
      <form
        className={cn("flex items-end gap-2 border-t border-border", compact ? "p-2.5" : "p-3")}
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Nhập tin nhắn… (Enter để gửi)"
          aria-label="Nhập tin nhắn"
          className={cn(
            "max-h-32 flex-1 resize-none rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-subtle",
            "focus-visible:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow",
          )}
        />
        <Button
          type="submit"
          variant="primary"
          size={compact ? "sm" : "md"}
          aria-label="Gửi tin nhắn"
          disabled={!draft.trim() || sendMutation.isPending || messagesQuery.isPending}
        >
          <Send className="h-4 w-4" aria-hidden />
          {!compact ? <span className="hidden sm:inline">Gửi</span> : null}
        </Button>
      </form>
    </div>
  );
}
