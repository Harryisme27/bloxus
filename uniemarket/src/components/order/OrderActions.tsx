// Bảng thao tác cho KHÁCH (chủ đơn): Hoàn tất đơn (Complete Order) + Yêu cầu hoàn tiền.
// Tự ẩn HOÀN TOÀN nếu người xem không phải chủ đơn (nhân viên/CTV xem sẽ không thấy gì).
// Mọi mutation dùng useMutation + invalidate ['order', id]/['my-orders']/['work-orders'].
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock3, PackageCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmReceived, finalizeRefund } from "@/lib/db/orders";
import { orderDisplayStatus } from "@/types/db";
import type { OrderRow } from "@/types/db";
import { useAuthStore } from "@/store/authStore";
import { RefundDialog } from "./RefundDialog";

export interface OrderActionsProps {
  order: OrderRow;
  /** Bố cục gọn: nút nhỏ, bỏ tiêu đề/ghi chú dài (dùng trong danh sách/thẻ). */
  compact?: boolean;
}

export function OrderActions({ order, compact = false }: OrderActionsProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [refundOpen, setRefundOpen] = useState(false);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["order", order.id] });
    void queryClient.invalidateQueries({ queryKey: ["order-events", order.id] });
    void queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    void queryClient.invalidateQueries({ queryKey: ["proofs"] });
  };

  const completeMutation = useMutation({
    mutationFn: () => confirmReceived(order.id),
    onSuccess: () => {
      toast.success("Đã xác nhận nhận hàng — đơn hoàn thành!");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const finalizeRefundMutation = useMutation({
    mutationFn: () => finalizeRefund(order.id),
    onSuccess: () => {
      toast.success("Đã chốt hoàn tiền.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Chỉ CHỦ ĐƠN mới thấy các thao tác này.
  if (!user || user.id !== order.user_id) return null;

  const displayStatus = orderDisplayStatus(order);
  const isDelivered = displayStatus === "delivered";

  // Đang có yêu cầu hoàn tiền chờ xử lý (không tính đơn đã hoàn tiền/đã hủy).
  const refundPending =
    order.refund_requested_at != null &&
    order.status !== "refunded" &&
    order.status !== "cancelled";
  const hoursSinceRefund = order.refund_requested_at
    ? (Date.now() - new Date(order.refund_requested_at).getTime()) / 3_600_000
    : 0;
  const canFinalizeRefund = refundPending && hoursSinceRefund >= 1;

  // "Hoàn tất đơn" xuất hiện ở các bước còn giao hàng; CHỈ BẬT khi đã giao (delivered).
  const showComplete =
    displayStatus === "delivered" ||
    displayStatus === "paid" ||
    displayStatus === "in_progress";

  // Yêu cầu hoàn tiền khi đơn đang chạy/đã xong và chưa có yêu cầu nào.
  const refundEligible =
    !refundPending &&
    (order.status === "paid" ||
      order.status === "in_progress" ||
      order.status === "completed");

  // Không có gì để hiển thị (vd: pending_payment / cancelled / refunded và không có yêu cầu hoàn tiền).
  if (!showComplete && !refundEligible && !refundPending) return null;

  const btnSize = compact ? "sm" : "md";

  return (
    <div
      className={
        compact ? "space-y-3" : "space-y-4 rounded-2xl border border-border bg-surface p-5"
      }
    >
      {!compact ? (
        <p className="font-heading text-base font-semibold text-text">Thao tác đơn hàng</p>
      ) : null}

      {/* Đang yêu cầu hoàn tiền — panel hổ phách (amber) */}
      {refundPending ? (
        <div className="rounded-xl border border-yellow bg-yellow-soft p-4">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-yellow" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-semibold text-text">
                Đang yêu cầu hoàn tiền — chờ admin duyệt hoặc tự động sau 1 giờ
              </p>
              {order.refund_reason ? (
                <p className="mt-1 text-sm text-text-muted">
                  Lý do: <span className="text-text">{order.refund_reason}</span>
                </p>
              ) : null}
              {canFinalizeRefund ? (
                <Button
                  variant="danger"
                  size={btnSize}
                  className="mt-3"
                  disabled={finalizeRefundMutation.isPending}
                  onClick={() => {
                    if (window.confirm("Chốt hoàn tiền ngay bây giờ?"))
                      finalizeRefundMutation.mutate();
                  }}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  {finalizeRefundMutation.isPending ? "Đang xử lý..." : "Chốt hoàn tiền ngay"}
                </Button>
              ) : (
                <p className="mt-2 text-xs text-text-subtle">
                  Sau 1 giờ kể từ lúc gửi yêu cầu, bạn có thể tự chốt hoàn tiền nếu chưa được xử lý.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Nút hành động chính (ẩn khi đang chờ hoàn tiền) */}
      {(showComplete || refundEligible) && !refundPending ? (
        <div className={compact ? "flex flex-wrap gap-2" : "flex flex-col gap-2 sm:flex-row"}>
          {showComplete ? (
            <div className={compact ? "" : "flex-1"}>
              <Button
                variant="gold"
                size={btnSize}
                className="w-full"
                disabled={!isDelivered || completeMutation.isPending}
                onClick={() => {
                  if (window.confirm("Xác nhận đã nhận đúng hàng?")) completeMutation.mutate();
                }}
              >
                <PackageCheck className="h-4 w-4" aria-hidden />
                {completeMutation.isPending ? "Đang xác nhận..." : "Hoàn tất đơn"}
              </Button>
              {!isDelivered && !compact ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-text-subtle">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden /> Chờ người bán giao hàng
                </p>
              ) : null}
            </div>
          ) : null}

          {refundEligible ? (
            <div className={compact ? "" : "flex-1"}>
              <Button
                variant="secondary"
                size={btnSize}
                className="w-full text-danger hover:border-danger"
                onClick={() => setRefundOpen(true)}
              >
                <RotateCcw className="h-4 w-4" aria-hidden /> Yêu cầu hoàn tiền
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <RefundDialog
        order={refundOpen ? { id: order.id, order_code: order.order_code } : null}
        onClose={() => setRefundOpen(false)}
      />
    </div>
  );
}
