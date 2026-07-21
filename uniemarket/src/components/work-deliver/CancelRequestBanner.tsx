// Banner cảnh báo khách đang YÊU CẦU HỦY đơn — tạm dừng giao hàng.
// Admin có nút "Duyệt hủy" / "Từ chối" (resolveCancel). Seller chỉ thấy cảnh báo.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Ban, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { resolveCancel } from "@/lib/db/orders";
import type { OrderRow } from "@/types/db";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    approved: (code: string) => `Đã duyệt hủy đơn ${code}.`,
    rejected: (code: string) => `Đã từ chối yêu cầu hủy đơn ${code}.`,
    confirmApprove: (code: string) =>
      `Duyệt HỦY đơn ${code}? Đơn sẽ chuyển sang "Đã hủy" và hoàn lại tồn kho (nếu có).`,
    rejectPrompt: "Lý do từ chối yêu cầu hủy (gửi cho khách, tùy chọn):",
    heading: "⚠️ Khách đang YÊU CẦU HỦY đơn — TẠM DỪNG giao hàng.",
    reasonLabel: "Lý do:",
    noReason: "(không ghi lý do)",
    approve: "Duyệt hủy",
    reject: "Từ chối",
    ctvWait: "Vui lòng chờ admin xử lý yêu cầu hủy trước khi tiếp tục giao hàng.",
  },
  en: {
    approved: (code: string) => `Cancellation of order ${code} approved.`,
    rejected: (code: string) => `Cancellation request for order ${code} declined.`,
    confirmApprove: (code: string) =>
      `Approve CANCELLATION of order ${code}? The order will move to "Cancelled" and any stock will be restored.`,
    rejectPrompt: "Reason for declining the cancellation request (sent to the customer, optional):",
    heading: "⚠️ The customer is REQUESTING CANCELLATION — PAUSE delivery.",
    reasonLabel: "Reason:",
    noReason: "(no reason given)",
    approve: "Approve cancellation",
    reject: "Decline",
    ctvWait:
      "Please wait for an admin to resolve the cancellation request before continuing delivery.",
  },
};

export interface CancelRequestBannerProps {
  order: Pick<OrderRow, "id" | "order_code" | "cancel_request_reason">;
  isAdmin: boolean;
}

/** Cảnh báo yêu cầu hủy — hiện ở đầu workview khi cancel_requested_at != null. */
export function CancelRequestBanner({ order, isAdmin }: CancelRequestBannerProps) {
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const confirm = useConfirm();

  const resolveMutation = useMutation({
    mutationFn: (input: { approve: boolean; note?: string }) =>
      resolveCancel(order.id, input.approve, input.note),
    onSuccess: (updated, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["order", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["order-events", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success(
        variables.approve ? t.approved(updated.order_code) : t.rejected(updated.order_code),
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleApprove = async () => {
    const r = await confirm({ title: t.approve, message: t.confirmApprove(order.order_code), tone: "danger" });
    if (r.ok) resolveMutation.mutate({ approve: true });
  };

  const handleReject = async () => {
    const r = await confirm({
      title: t.reject,
      input: { label: t.rejectPrompt, multiline: true },
    });
    if (r.ok) resolveMutation.mutate({ approve: false, note: r.value || undefined });
  };

  return (
    <div className="rounded-2xl border border-danger bg-danger-soft p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-bold text-danger">{t.heading}</p>
          <p className="mt-1 text-sm text-text">
            {t.reasonLabel}{" "}
            <span className="font-medium">
              {order.cancel_request_reason || t.noReason}
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
                {t.approve}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReject}
                disabled={resolveMutation.isPending}
              >
                <X className="h-4 w-4" aria-hidden />
                {t.reject}
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-text-muted">{t.ctvWait}</p>
          )}
        </div>
      </div>
    </div>
  );
}
