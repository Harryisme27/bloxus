// Chat icon linking to /messages, with a small amber dot when there is any
// unread notification. We approximate "unread messages" with the shared unread
// notification count (order_delivered / message / etc. all surface here) to keep
// it simple — the count comes from the same cache the bell uses.
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useUnreadCount } from "@/components/nav/useUnreadCount";

export function ChatIconLink() {
  const hasUnread = useUnreadCount() > 0;

  return (
    <Link
      to="/messages"
      aria-label="Tin nhắn"
      className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
      {hasUnread ? (
        <span
          className="absolute right-2 top-2 h-2 w-2 rounded-full bg-yellow ring-2 ring-bg"
          aria-hidden="true"
        />
      ) : null}
    </Link>
  );
}
