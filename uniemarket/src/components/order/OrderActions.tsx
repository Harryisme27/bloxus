// Bảng thao tác cho KHÁCH (chủ đơn): Hoàn tất đơn (Complete Order) + Yêu cầu hoàn tiền.
// Tự ẩn HOÀN TOÀN nếu người xem không phải chủ đơn (nhân viên/CTV xem sẽ không thấy gì).
// Mọi mutation dùng useMutation + invalidate ['order', id]/['my-orders']/['work-orders'].
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock3, PackageCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { confirmReceived, finalizeRefund } from "@/lib/db/orders";
import { orderDisplayStatus } from "@/types/db";
import type { OrderRow } from "@/types/db";
import { useAuthStore } from "@/store/authStore";
import { usePick } from "@/i18n";
import { RefundDialog } from "./RefundDialog";

const STR = {
  vi: {
    receiptConfirmed: "Đã xác nhận nhận hàng — đơn hoàn thành!",
    refundFinalized: "Đã chốt hoàn tiền.",
    orderActions: "Thao tác đơn hàng",
    refundPendingTitle: "Đang yêu cầu hoàn tiền — chờ admin duyệt hoặc tự động sau 1 giờ",
    reason: "Lý do:",
    confirmFinalizeRefund: "Chốt hoàn tiền ngay bây giờ?",
    processing: "Đang xử lý...",
    finalizeRefundNow: "Chốt hoàn tiền ngay",
    finalizeRefundHint:
      "Sau 1 giờ kể từ lúc gửi yêu cầu, bạn có thể tự chốt hoàn tiền nếu chưa được xử lý.",
    confirmReceived: "Xác nhận đã nhận đúng hàng?",
    confirming: "Đang xác nhận...",
    completeOrder: "Hoàn tất đơn",
    waitingDelivery: "Chờ người bán giao hàng",
    requestRefund: "Yêu cầu hoàn tiền",
  },
  en: {
    receiptConfirmed: "Receipt confirmed — order completed!",
    refundFinalized: "Refund finalized.",
    orderActions: "Order actions",
    refundPendingTitle: "Refund requested — awaiting admin approval or automatic after 1 hour",
    reason: "Reason:",
    confirmFinalizeRefund: "Finalize the refund right now?",
    processing: "Processing...",
    finalizeRefundNow: "Finalize refund now",
    finalizeRefundHint:
      "One hour after your request, you can finalize the refund yourself if it hasn't been handled.",
    confirmReceived: "Confirm you received the correct items?",
    confirming: "Confirming...",
    completeOrder: "Complete order",
    waitingDelivery: "Waiting for the seller to deliver",
    requestRefund: "Request a refund",
  },
};

export interface OrderActionsProps {
  order: OrderRow;
  /** Bố cục gọn: nút nhỏ, bỏ tiêu đề/ghi chú dài (dùng trong danh sách/thẻ). */
  compact?: boolean;
}

export function OrderActions({ order, compact = false }: OrderActionsProps) {
  const t = usePick(STR);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const confirm = useConfirm();
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
      toast.success(t.receiptConfirmed);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const finalizeRefundMutation = useMutation({
    mutationFn: () => finalizeRefund(order.id),
    onSuccess: () => {
      toast.success(t.refundFinalized);
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

  // Yêu cầu hoàn tiền CHỈ khi đơn đang chạy (paid/in_progress) và chưa có yêu cầu.
  // Đơn đã HOÀN THÀNH (khách xác nhận nhận hàng) thì KHÔNG được hoàn tiền nữa.
  const refundEligible =
    !refundPending && (order.status === "paid" || order.status === "in_progress");

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
        <p className="font-heading text-base font-semibold text-text">{t.orderActions}</p>
      ) : null}

      {/* Đang yêu cầu hoàn tiền — panel hổ phách (amber) */}
      {refundPending ? (
        <div className="rounded-xl border border-yellow bg-yellow-soft p-4">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-yellow" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-semibold text-text">
                {t.refundPendingTitle}
              </p>
              {order.refund_reason ? (
                <p className="mt-1 text-sm text-text-muted">
                  {t.reason} <span className="text-text">{order.refund_reason}</span>
                </p>
              ) : null}
              {canFinalizeRefund ? (
                <Button
                  variant="danger"
                  size={btnSize}
                  className="mt-3 w-full"
                  disabled={finalizeRefundMutation.isPending}
                  onClick={async () => {
                    const r = await confirm({ title: t.finalizeRefundNow, message: t.confirmFinalizeRefund, tone: "danger" });
                    if (r.ok) finalizeRefundMutation.mutate();
                  }}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  {finalizeRefundMutation.isPending ? t.processing : t.finalizeRefundNow}
                </Button>
              ) : (
                <p className="mt-2 text-xs text-text-subtle">
                  {t.finalizeRefundHint}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Nút hành động chính (ẩn khi đang chờ hoàn tiền). Xếp DỌC để không bị cắt
          trong cột hẹp (sidebar chi tiết đơn / trang đơn). */}
      {(showComplete || refundEligible) && !refundPending ? (
        <div className="flex flex-col gap-2">
          {showComplete ? (
            <div>
              <Button
                variant="gold"
                size={btnSize}
                className="w-full"
                disabled={!isDelivered || completeMutation.isPending}
                onClick={async () => {
                  const r = await confirm({ title: t.completeOrder, message: t.confirmReceived });
                  if (r.ok) completeMutation.mutate();
                }}
              >
                <PackageCheck className="h-4 w-4" aria-hidden />
                {completeMutation.isPending ? t.confirming : t.completeOrder}
              </Button>
              {!isDelivered && !compact ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-text-subtle">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden /> {t.waitingDelivery}
                </p>
              ) : null}
            </div>
          ) : null}

          {refundEligible ? (
            <div>
              <Button
                variant="secondary"
                size={btnSize}
                className="w-full text-danger hover:border-danger"
                onClick={() => setRefundOpen(true)}
              >
                <RotateCcw className="h-4 w-4" aria-hidden /> {t.requestRefund}
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
