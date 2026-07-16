// Danh sách hội thoại (inbox) dùng chung cho /messages và /work/chat.
import { Hash, ShoppingBag } from "lucide-react";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { threadTitle } from "./MessagePane";
import type { ThreadRow } from "@/types/db";

export interface ThreadListProps {
  threads: ThreadRow[];
  /** Thread đang mở (highlight). */
  selectedId?: string | null;
  onSelect: (thread: ThreadRow) => void;
  className?: string;
}

export function ThreadList({ threads, selectedId, onSelect, className }: ThreadListProps) {
  // Sắp xếp: nhắn gần nhất lên đầu (fallback created_at khi chưa có tin nào).
  const sorted = [...threads].sort((a, b) => {
    const ta = new Date(a.last_message_at ?? a.created_at).getTime();
    const tb = new Date(b.last_message_at ?? b.created_at).getTime();
    return tb - ta;
  });

  return (
    <div className={cn("flex flex-col gap-1", className)} role="list">
      {sorted.map((thread) => {
        const Icon = thread.kind === "staff" ? Hash : ShoppingBag;
        const active = thread.id === selectedId;
        return (
          <button
            key={thread.id}
            type="button"
            role="listitem"
            onClick={() => onSelect(thread)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-surface-2",
              active && "border-yellow bg-yellow-soft hover:bg-yellow-soft",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                thread.kind === "staff"
                  ? "bg-green-soft text-green"
                  : "bg-yellow-soft text-yellow",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block truncate text-sm font-semibold",
                  active ? "text-yellow" : "text-text",
                )}
              >
                {threadTitle(thread)}
              </span>
              <span className="block text-xs text-text-subtle">
                {thread.last_message_at
                  ? relativeTime(thread.last_message_at)
                  : "Chưa có tin nhắn"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
