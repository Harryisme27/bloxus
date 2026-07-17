// Dialog khách yêu cầu hủy đơn — lý do BẮT BUỘC.
// immediate=true (đơn chưa thanh toán) → hủy ngay; immediate=false → gửi yêu cầu
// chờ người bán/admin duyệt hoặc tự chốt sau 24h. Cả hai đều gọi requestCancel.
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { requestCancel } from "@/lib/db/orders";
import type { OrderRow } from "@/types/db";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    cancelled: "Đã hủy đơn hàng.",
    requestSent: "Đã gửi yêu cầu hủy đơn.",
    enterReason: "Vui lòng nhập lý do hủy đơn.",
    titleImmediate: "Hủy đơn hàng",
    titleRequest: "Yêu cầu hủy đơn",
    descImmediatePrefix: "Đơn ",
    descImmediateSuffix: " chưa thanh toán sẽ được hủy ngay lập tức.",
    descRequestPrefix: "Yêu cầu hủy đơn ",
    descRequestSuffix:
      " sẽ được gửi tới người bán/admin. Nếu sau 24h chưa được xử lý, bạn có thể tự xác nhận hủy.",
    reasonLabel: "Lý do hủy",
    placeholder: "Cho chúng tôi biết vì sao bạn muốn hủy đơn...",
    close: "Đóng",
    sending: "Đang gửi...",
    cancelNow: "Hủy đơn",
    sendRequest: "Gửi yêu cầu hủy",
  },
  en: {
    cancelled: "Order cancelled.",
    requestSent: "Cancellation request sent.",
    enterReason: "Please enter a reason for cancelling.",
    titleImmediate: "Cancel order",
    titleRequest: "Cancellation request",
    descImmediatePrefix: "Order ",
    descImmediateSuffix: " hasn't been paid and will be cancelled immediately.",
    descRequestPrefix: "The cancellation request for order ",
    descRequestSuffix:
      " will be sent to the seller/admin. If it isn't handled within 24 hours, you can confirm the cancellation yourself.",
    reasonLabel: "Cancellation reason",
    placeholder: "Tell us why you want to cancel this order...",
    close: "Close",
    sending: "Sending...",
    cancelNow: "Cancel order",
    sendRequest: "Send cancellation request",
  },
};

export interface CancelRequestDialogProps {
  /** Đơn cần hủy — truyền null để đóng dialog. */
  order: Pick<OrderRow, "id" | "order_code"> | null;
  /** true khi đơn chưa thanh toán → hủy ngay; false → gửi yêu cầu chờ duyệt/24h. */
  immediate: boolean;
  onClose: () => void;
}

export function CancelRequestDialog({ order, immediate, onClose }: CancelRequestDialogProps) {
  const t = usePick(STR);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const open = order !== null;

  const mutation = useMutation({
    mutationFn: (input: { orderId: string; reason: string }) =>
      requestCancel(input.orderId, input.reason),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["order", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["order-events", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      toast.success(immediate ? t.cancelled : t.requestSent);
      setReason("");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setReason("");
      onClose();
    }
  };

  const submit = () => {
    if (!order) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error(t.enterReason);
      return;
    }
    mutation.mutate({ orderId: order.id, reason: trimmed });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{immediate ? t.titleImmediate : t.titleRequest}</DialogTitle>
          <DialogDescription>
            {immediate ? (
              <>
                {t.descImmediatePrefix}
                <span className="font-mono font-semibold text-text">{order?.order_code}</span>
                {t.descImmediateSuffix}
              </>
            ) : (
              <>
                {t.descRequestPrefix}
                <span className="font-mono font-semibold text-text">{order?.order_code}</span>
                {t.descRequestSuffix}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div>
          <Label htmlFor="cancel-reason">
            {t.reasonLabel} <span className="text-danger">*</span>
          </Label>
          <textarea
            id="cancel-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t.placeholder}
            maxLength={500}
            className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-subtle focus-visible:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            {t.close}
          </Button>
          <Button variant="danger" disabled={!order || mutation.isPending} onClick={submit}>
            <XCircle className="h-4 w-4" aria-hidden />
            {mutation.isPending ? t.sending : immediate ? t.cancelNow : t.sendRequest}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
