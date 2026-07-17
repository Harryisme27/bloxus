// Banner cảnh báo khách đang YÊU CẦU HOÀN TIỀN.
// Admin có nút "Duyệt hoàn tiền" / "Từ chối" (resolveRefund). CTV chỉ thấy cảnh báo.
// Tự ẩn khi chưa có yêu cầu hoàn tiền, hoặc đơn đã hoàn tiền / đã hủy.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveRefund } from "@/lib/db/orders";
import { useAuthStore } from "@/store/authStore";
import type { OrderRow } from "@/types/db";

export interface RefundRequestBannerProps {
  order: Pick<OrderRow, "id" | "order_code" | "status" | "refund_requested_at" | "refund_reason">;
}

/** Cảnh báo yêu cầu hoàn tiền — hiện ở đầu workview khi refund_requested_at != null. */
export function RefundRequestBanner({ order }: RefundRequestBannerProps) {
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");

  const resolveMutation = useMutation({
    mutationFn: (input: { approve: boolean; note?: string }) =>
      resolveRefund(order.id, input.approve, input.note),
    onSuccess: (updated, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["order", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["order-events", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success(
        variables.approve
          ? `Đã duyệt hoàn tiền đơn ${updated.order_code}.`
          : `Đã từ chối yêu cầu hoàn tiền đơn ${updated.order_code}.`,
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Chỉ hiện khi có yêu cầu hoàn tiền và đơn chưa hoàn tiền / chưa hủy.
  if (
    order.refund_requested_at == null ||
    order.status === "refunded" ||
    order.status === "cancelled"
  ) {
    return null;
  }

  const handleApprove = () => {
    const ok = window.confirm(
      `Duyệt HOÀN TIỀN đơn ${order.order_code}? Đơn sẽ chuyển sang "Đã hoàn tiền". Nhớ chuyển tiền lại cho khách trước nhé.`,
    );
    if (ok) resolveMutation.mutate({ approve: true });
  };

  const handleReject = () => {
    // prompt trả null khi bấm Hủy -> không làm gì.
    const note = window.prompt("Lý do từ chối yêu cầu hoàn tiền (gửi cho khách, tùy chọn):", "");
    if (note === null) return;
    resolveMutation.mutate({ approve: false, note: note.trim() || undefined });
  };

  return (
    <div className="rounded-2xl border border-yellow bg-yellow-soft p-5 shadow-glow-amber">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-bold text-yellow">
            ⚠️ Khách YÊU CẦU HOÀN TIỀN.
          </p>
          <p className="mt-1 text-sm text-text">
            Lý do:{" "}
            <span className="font-medium">{order.refund_reason || "(không ghi lý do)"}</span>
          </p>

          {isAdmin ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                disabled={resolveMutation.isPending}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                Duyệt hoàn tiền
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReject}
                disabled={resolveMutation.isPending}
              >
                <X className="h-4 w-4" aria-hidden />
                Từ chối
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-text-muted">
              Vui lòng chờ admin xử lý yêu cầu hoàn tiền của khách.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
