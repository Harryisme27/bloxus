// Khung chat gắn với 1 đơn hàng — HỢP ĐỒNG DÙNG CHUNG (trang chi tiết đơn của
// khách + trang xử lý đơn của staff đều import component này).
// Props CỐ ĐỊNH: { orderId: string; threadId?: string; className?: string }.
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MessageCircleOff, RefreshCw } from "lucide-react";
import { getThread } from "@/lib/db/chat";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { SetupNotice } from "@/components/SetupNotice";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessagePane } from "./MessagePane";
import { resolveOrderThread } from "./resolveOrderThread";

export interface OrderChatPanelProps {
  orderId: string;
  /** Nếu đã biết sẵn thread id thì truyền vào để khỏi tra cứu. */
  threadId?: string;
  /** Điều khiển kích thước từ bên ngoài (vd. "h-[28rem]"). */
  className?: string;
}

export function OrderChatPanel({ orderId, threadId, className }: OrderChatPanelProps) {
  const session = useAuthStore((s) => s.session);
  const authLoading = useAuthStore((s) => s.loading);

  const threadQuery = useQuery({
    queryKey: ["order-thread", orderId, threadId ?? null],
    queryFn: () => (threadId ? getThread(threadId) : resolveOrderThread(orderId)),
    enabled: isSupabaseConfigured && Boolean(session),
  });

  if (!isSupabaseConfigured) {
    return (
      <div className={className}>
        <SetupNotice />
      </div>
    );
  }

  if (authLoading || (session && threadQuery.isPending)) {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4",
          className,
        )}
      >
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-10 w-3/5 rounded-2xl" />
        <Skeleton className="ml-auto h-10 w-1/2 rounded-2xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center",
          className,
        )}
      >
        <p className="text-sm text-text-muted">Đăng nhập để trao đổi về đơn hàng này.</p>
        <Link to="/login" className={buttonVariants({ variant: "primary", size: "sm" })}>
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (threadQuery.isError) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center",
          className,
        )}
      >
        <p className="text-sm text-text-muted">Không tải được kênh trao đổi.</p>
        <p className="max-w-xs text-xs text-text-subtle">
          {threadQuery.error instanceof Error ? threadQuery.error.message : ""}
        </p>
        <Button variant="secondary" size="sm" onClick={() => void threadQuery.refetch()}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Thử lại
        </Button>
      </div>
    );
  }

  const thread = threadQuery.data;
  if (!thread) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong bg-surface p-6 text-center",
          className,
        )}
      >
        <MessageCircleOff className="h-6 w-6 text-text-subtle" aria-hidden />
        <p className="text-sm text-text-muted">Chưa có kênh trao đổi cho đơn này.</p>
        <p className="max-w-xs text-xs text-text-subtle">
          Kênh chat được tạo tự động khi đặt đơn — nếu bạn thấy thông báo này, hãy tải lại trang
          hoặc liên hệ hỗ trợ.
        </p>
      </div>
    );
  }

  return <MessagePane key={thread.id} thread={thread} className={className} />;
}
