// Nút chat nổi (góc phải dưới) + panel mini.
// - Chưa đăng nhập: panel hướng dẫn -> /login và /faq (không còn bot demo).
// - Khách đã đăng nhập: hiện thread đơn hàng gần nhất (MessagePane compact),
//   không có thread thì dẫn tới /messages.
// - Staff (admin/CTV): dẫn tới /work/chat.
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle, Inbox, MessageCircle, MessagesSquare, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessagePane, threadTitle } from "@/components/chat/MessagePane";
import { listMyThreads } from "@/lib/db/chat";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    staffChannel: "# Chung",
    orderThread: "Trao đổi đơn hàng",
    loginPrompt: "Đăng nhập để nhắn tin với đội ngũ Uniemarket về đơn hàng của bạn.",
    login: "Đăng nhập",
    faq: "Câu hỏi thường gặp",
    demoNotice: "(Web đang ở chế độ demo — chưa kết nối cơ sở dữ liệu, xem SETUP.md.)",
    staffPrompt: "Bạn là thành viên đội ngũ — trao đổi nội bộ diễn ra trong khu làm việc.",
    openInternalChat: "Mở chat nội bộ",
    inbox: "Hộp tin nhắn",
    viewAllMessages: "Xem tất cả tin nhắn →",
    noConversations: "Bạn chưa có cuộc trò chuyện nào. Kênh trao đổi sẽ mở tự động khi bạn đặt đơn.",
    dialogAria: "Khung chat hỗ trợ Uniemarket",
    supportTitle: "Hỗ trợ Uniemarket",
    latestOrder: "Đơn hàng gần nhất của bạn",
    teamReady: "Đội ngũ luôn sẵn sàng giúp bạn",
    closeChat: "Đóng khung chat",
    closeSupportChat: "Đóng khung chat hỗ trợ",
    openSupportChat: "Mở khung chat hỗ trợ",
  },
  en: {
    staffChannel: "# General",
    orderThread: "Order chat",
    loginPrompt: "Log in to message the Uniemarket team about your order.",
    login: "Log in",
    faq: "Frequently asked questions",
    demoNotice: "(The site is in demo mode — no database connected, see SETUP.md.)",
    staffPrompt: "You're a team member — internal chats happen in the work area.",
    openInternalChat: "Open internal chat",
    inbox: "Inbox",
    viewAllMessages: "View all messages →",
    noConversations: "You don't have any conversations yet. A channel opens automatically when you place an order.",
    dialogAria: "Uniemarket support chat",
    supportTitle: "Uniemarket support",
    latestOrder: "Your latest order",
    teamReady: "Our team is always ready to help",
    closeChat: "Close chat",
    closeSupportChat: "Close support chat",
    openSupportChat: "Open support chat",
  },
};

export function ChatWidget() {
  const t = usePick(STR);
  const [open, setOpen] = useState(false);
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const isStaff = user?.role === "admin" || user?.role === "ctv";

  // Chỉ tải khi panel mở + là khách đã đăng nhập.
  const threadsQuery = useQuery({
    queryKey: ["threads"],
    queryFn: listMyThreads,
    enabled: open && isSupabaseConfigured && Boolean(session) && !isStaff,
  });
  const latestOrderThread =
    (threadsQuery.data ?? []).find((thread) => thread.kind === "order") ?? null;

  const close = () => setOpen(false);

  let panelBody: ReactNode;
  if (!session) {
    // Chưa đăng nhập (hoặc chưa cấu hình Supabase).
    panelBody = (
      <div className="flex flex-1 flex-col justify-center gap-3 p-4 text-center">
        <p className="text-sm text-text-muted">
          {t.loginPrompt}
        </p>
        <Link
          to="/login"
          onClick={close}
          className={buttonVariants({ variant: "primary", size: "md" })}
        >
          {t.login}
        </Link>
        <Link
          to="/faq"
          onClick={close}
          className={buttonVariants({ variant: "secondary", size: "md" })}
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
          {t.faq}
        </Link>
        {!isSupabaseConfigured ? (
          <p className="text-xs text-text-subtle">
            {t.demoNotice}
          </p>
        ) : null}
      </div>
    );
  } else if (isStaff) {
    panelBody = (
      <div className="flex flex-1 flex-col justify-center gap-3 p-4 text-center">
        <p className="text-sm text-text-muted">
          {t.staffPrompt}
        </p>
        <Link
          to="/work/chat"
          onClick={close}
          className={buttonVariants({ variant: "primary", size: "md" })}
        >
          <MessagesSquare className="h-4 w-4" aria-hidden />
          {t.openInternalChat}
        </Link>
        <Link
          to="/messages"
          onClick={close}
          className={buttonVariants({ variant: "secondary", size: "md" })}
        >
          {t.inbox}
        </Link>
      </div>
    );
  } else if (threadsQuery.isPending) {
    panelBody = (
      <div className="flex-1 space-y-3 p-4">
        <Skeleton className="h-10 w-3/5 rounded-2xl" />
        <Skeleton className="ml-auto h-10 w-1/2 rounded-2xl" />
        <Skeleton className="h-10 w-2/3 rounded-2xl" />
      </div>
    );
  } else if (latestOrderThread) {
    panelBody = (
      <>
        <MessagePane
          key={latestOrderThread.id}
          thread={latestOrderThread}
          compact
          className="min-h-0 flex-1 rounded-none border-0"
        />
        <div className="border-t border-border px-3 py-2 text-center">
          <Link
            to={`/messages?thread=${latestOrderThread.id}`}
            onClick={close}
            className="text-xs font-semibold text-yellow hover:text-yellow-hover"
          >
            {t.viewAllMessages}
          </Link>
        </div>
      </>
    );
  } else {
    panelBody = (
      <div className="flex flex-1 flex-col justify-center gap-3 p-4 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-text-subtle">
          <Inbox className="h-5 w-5" aria-hidden />
        </div>
        <p className="text-sm text-text-muted">
          {t.noConversations}
        </p>
        <Link
          to="/messages"
          onClick={close}
          className={buttonVariants({ variant: "secondary", size: "md" })}
        >
          {t.inbox}
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div
          role="dialog"
          aria-label={t.dialogAria}
          className="flex h-[28rem] max-h-[calc(100vh-6rem)] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-2 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green text-text-on-green">
                <MessagesSquare className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-semibold text-text">
                  {session && !isStaff && latestOrderThread
                    ? threadTitle(latestOrderThread, { staff: t.staffChannel, order: t.orderThread })
                    : t.supportTitle}
                </p>
                <p className="text-xs text-text-subtle">
                  {session && !isStaff && latestOrderThread
                    ? t.latestOrder
                    : t.teamReady}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-md p-1 text-text-subtle transition-colors hover:text-text"
              aria-label={t.closeChat}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {panelBody}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-yellow text-text-on-yellow shadow-glow-amber transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        aria-label={open ? t.closeSupportChat : t.openSupportChat}
        aria-expanded={open}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-yellow bg-success" />
          </>
        )}
      </button>
    </div>
  );
}
