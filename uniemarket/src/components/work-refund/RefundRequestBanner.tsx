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
import { usePick } from "@/i18n";

const STR = {
  vi: {
    approved: (code: string) => `Đã duyệt hoàn tiền đơn ${code}.`,
    rejected: (code: string) => `Đã từ chối yêu cầu hoàn tiền đơn ${code}.`,
    confirmApprove: (code: string) =>
      `Duyệt HOÀN TIỀN đơn ${code}? Đơn sẽ chuyển sang "Đã hoàn tiền". Nhớ chuyển tiền lại cho khách trước nhé.`,
    rejectPrompt: "Lý do từ chối yêu cầu hoàn tiền (gửi cho khách, tùy chọn):",
    heading: "⚠️ Khách YÊU CẦU HOÀN TIỀN.",
    reasonLabel: "Lý do:",
    noReason: "(không ghi lý do)",
    approve: "Duyệt hoàn tiền",
    reject: "Từ chối",
    ctvWait: "Vui lòng chờ admin xử lý yêu cầu hoàn tiền của khách.",
  },
  en: {
    approved: (code: string) => `Refund for order ${code} approved.`,
    rejected: (code: string) => `Refund request for order ${code} declined.`,
    confirmApprove: (code: string) =>
      `Approve REFUND for order ${code}? The order will move to "Refunded". Remember to transfer the money back to the customer first.`,
    rejectPrompt: "Reason for declining the refund request (sent to the customer, optional):",
    heading: "⚠️ The customer is REQUESTING A REFUND.",
    reasonLabel: "Reason:",
    noReason: "(no reason given)",
    approve: "Approve refund",
    reject: "Decline",
    ctvWait: "Please wait for an admin to resolve the customer's refund request.",
  },
};

export interface RefundRequestBannerProps {
  order: Pick<OrderRow, "id" | "order_code" | "status" | "refund_requested_at" | "refund_reason">;
}

/** Cảnh báo yêu cầu hoàn tiền — hiện ở đầu workview khi refund_requested_at != null. */
export function RefundRequestBanner({ order }: RefundRequestBannerProps) {
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const t = usePick(STR);

  const resolveMutation = useMutation({
    mutationFn: (input: { approve: boolean; note?: string }) =>
      resolveRefund(order.id, input.approve, input.note),
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

  // Chỉ hiện khi có yêu cầu hoàn tiền và đơn chưa hoàn tiền / chưa hủy.
  if (
    order.refund_requested_at == null ||
    order.status === "refunded" ||
    order.status === "cancelled"
  ) {
    return null;
  }

  const handleApprove = () => {
    const ok = window.confirm(t.confirmApprove(order.order_code));
    if (ok) resolveMutation.mutate({ approve: true });
  };

  const handleReject = () => {
    // prompt trả null khi bấm Hủy -> không làm gì.
    const note = window.prompt(t.rejectPrompt, "");
    if (note === null) return;
    resolveMutation.mutate({ approve: false, note: note.trim() || undefined });
  };

  return (
    <div className="rounded-2xl border border-yellow bg-yellow-soft p-5 shadow-glow-amber">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-bold text-yellow">{t.heading}</p>
          <p className="mt-1 text-sm text-text">
            {t.reasonLabel}{" "}
            <span className="font-medium">{order.refund_reason || t.noReason}</span>
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
