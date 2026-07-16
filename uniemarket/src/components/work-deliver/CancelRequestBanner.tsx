// Banner cảnh báo khách đang YÊU CẦU HỦY đơn — tạm dừng giao hàng.
// Admin có nút "Duyệt hủy" / "Từ chối" (resolveCancel). CTV chỉ thấy cảnh báo.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Ban, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveCancel } from "@/lib/db/orders";
import type { OrderRow } from "@/types/db";

export interface CancelRequestBannerProps {
  order: Pick<OrderRow, "id" | "order_code" | "cancel_request_reason">;
  isAdmin: boolean;
}

/** Cảnh báo yêu cầu hủy — hiện ở đầu workview khi cancel_requested_at != null. */
export function CancelRequestBanner({ order, isAdmin }: CancelRequestBannerProps) {
  const queryClient = useQueryClient();

  const resolveMutation = useMutation({
    mutationFn: (input: { approve: boolean; note?: string }) =>
      resolveCancel(order.id, input.approve, input.note),
    onSuccess: (updated, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["order", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["order-events", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success(
        variables.approve
          ? `Đã duyệt hủy đơn ${updated.order_code}.`
          : `Đã từ chối yêu cầu hủy đơn ${updated.order_code}.`,
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleApprove = () => {
    const ok = window.confirm(
      `Duyệt HỦY đơn ${order.order_code}? Đơn sẽ chuyển sang "Đã hủy" và hoàn lại tồn kho (nếu có).`,
    );
    if (ok) resolveMutation.mutate({ approve: true });
  };

  const handleReject = () => {
    // prompt trả null khi bấm Hủy -> không làm gì.
    const note = window.prompt("Lý do từ chối yêu cầu hủy (gửi cho khách, tùy chọn):", "");
    if (note === null) return;
    resolveMutation.mutate({ approve: false, note: note.trim() || undefined });
  };

  return (
    <div className="rounded-2xl border border-danger bg-danger-soft p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-bold text-danger">
            ⚠️ Khách đang YÊU CẦU HỦY đơn — TẠM DỪNG giao hàng.
          </p>
          <p className="mt-1 text-sm text-text">
            Lý do:{" "}
            <span className="font-medium">
              {order.cancel_request_reason || "(không ghi lý do)"}
            </span>
          </p>

          {isAdmin ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={handleApprove}
                disabled={resolveMutation.isPending}
              >
                <Ban className="h-4 w-4" aria-hidden />
                Duyệt hủy
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
              Vui lòng chờ admin xử lý yêu cầu hủy trước khi tiếp tục giao hàng.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
