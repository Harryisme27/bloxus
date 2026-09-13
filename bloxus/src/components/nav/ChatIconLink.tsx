// Chat icon linking to /messages, with a small amber dot when there is any
// unread notification. We approximate "unread messages" with the shared unread
// notification count (order_delivered / message / etc. all surface here) to keep
// it simple — the count comes from the same cache the bell uses.
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useUnreadCount } from "@/components/nav/useUnreadCount";
import { usePick } from "@/i18n";

const STR = {
  vi: { messages: "Tin nhắn" },
  en: { messages: "Messages" },
};

export function ChatIconLink() {
  const t = usePick(STR);
  const hasUnread = useUnreadCount() > 0;

  return (
    <Link
      to="/messages"
      aria-label={t.messages}
      className="relative hidden h-11 w-11 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-2 hover:text-text min-[520px]:flex"
    >
      <MessageCircle className="h-[22px] w-[22px]" aria-hidden="true" />
      {hasUnread ? (
        <span
          className="absolute right-2 top-2 h-2 w-2 rounded-full bg-yellow ring-2 ring-bg"
          aria-hidden="true"
        />
      ) : null}
    </Link>
  );
}
