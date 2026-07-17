// Dialog khách yêu cầu hoàn tiền — lý do BẮT BUỘC.
// Gợi ý sẵn các lý do dạng chip; chọn "Lý do khác" thì buộc mô tả bằng textarea.
// Submit → requestRefund(orderId, finalReason). Tự động sau 1h hoặc admin duyệt.
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { requestRefund } from "@/lib/db/orders";
import type { OrderRow } from "@/types/db";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    otherReason: "Lý do khác",
    suggestedReasons: [
      "Người bán không giao hàng",
      "Hàng không đúng mô tả",
      "Giao quá chậm",
      "Tôi đổi ý",
    ],
    sent: "Đã gửi yêu cầu hoàn tiền.",
    pickReason: "Vui lòng chọn lý do hoàn tiền.",
    describeReason: "Vui lòng mô tả lý do hoàn tiền.",
    title: "Yêu cầu hoàn tiền",
    descPrefix: "Yêu cầu hoàn tiền cho đơn ",
    descSuffix:
      " sẽ được gửi tới admin. Nếu sau 1 giờ chưa được xử lý, bạn có thể tự chốt hoàn tiền.",
    reasonLabel: "Lý do hoàn tiền",
    describeLabel: "Mô tả lý do",
    noteLabel: "Ghi chú thêm (không bắt buộc)",
    placeholderOther: "Mô tả chi tiết lý do bạn muốn hoàn tiền...",
    placeholderNote: "Bổ sung chi tiết nếu cần...",
    close: "Đóng",
    sending: "Đang gửi...",
    submit: "Gửi yêu cầu hoàn tiền",
  },
  en: {
    otherReason: "Other reason",
    suggestedReasons: [
      "The seller didn't deliver",
      "The item doesn't match the description",
      "Delivered too slowly",
      "I changed my mind",
    ],
    sent: "Refund request sent.",
    pickReason: "Please choose a refund reason.",
    describeReason: "Please describe your refund reason.",
    title: "Request a refund",
    descPrefix: "The refund request for order ",
    descSuffix:
      " will be sent to the admin. If it isn't handled within 1 hour, you can finalize the refund yourself.",
    reasonLabel: "Refund reason",
    describeLabel: "Describe your reason",
    noteLabel: "Additional note (optional)",
    placeholderOther: "Describe in detail why you want a refund...",
    placeholderNote: "Add more detail if needed...",
    close: "Close",
    sending: "Sending...",
    submit: "Send refund request",
  },
};

export interface RefundDialogProps {
  /** Đơn cần hoàn tiền — truyền null để đóng dialog. */
  order: Pick<OrderRow, "id" | "order_code"> | null;
  onClose: () => void;
}

export function RefundDialog({ order, onClose }: RefundDialogProps) {
  const t = usePick(STR);
  const [selected, setSelected] = useState<string>("");
  const [custom, setCustom] = useState("");
  const queryClient = useQueryClient();
  const open = order !== null;
  const isOther = selected === t.otherReason;
  const suggestedReasons = [...t.suggestedReasons, t.otherReason];

  const reset = () => {
    setSelected("");
    setCustom("");
  };

  const mutation = useMutation({
    mutationFn: (input: { orderId: string; reason: string }) =>
      requestRefund(input.orderId, input.reason),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["order", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["order-events", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      toast.success(t.sent);
      reset();
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
      onClose();
    }
  };

  const submit = () => {
    if (!order) return;
    if (!selected) {
      toast.error(t.pickReason);
      return;
    }
    const trimmedCustom = custom.trim();
    let finalReason: string;
    if (isOther) {
      if (!trimmedCustom) {
        toast.error(t.describeReason);
        return;
      }
      finalReason = trimmedCustom;
    } else {
      // Lý do gợi ý, kèm ghi chú tự nhập nếu khách bổ sung.
      finalReason = trimmedCustom ? `${selected} — ${trimmedCustom}` : selected;
    }
    mutation.mutate({ orderId: order.id, reason: finalReason });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>
            {t.descPrefix}
            <span className="font-mono font-semibold text-text">{order?.order_code}</span>
            {t.descSuffix}
          </DialogDescription>
        </DialogHeader>

        <div>
          <Label>
            {t.reasonLabel} <span className="text-danger">*</span>
          </Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {suggestedReasons.map((r) => {
              const active = selected === r;
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(r)}
                  className={
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors " +
                    (active
                      ? "border-yellow bg-yellow-soft text-text"
                      : "border-border-strong bg-surface-2 text-text-muted hover:border-yellow hover:text-text")
                  }
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {selected ? (
          <div className="mt-4">
            <Label htmlFor="refund-note">
              {isOther ? (
                <>
                  {t.describeLabel} <span className="text-danger">*</span>
                </>
              ) : (
                t.noteLabel
              )}
            </Label>
            <textarea
              id="refund-note"
              rows={3}
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              placeholder={isOther ? t.placeholderOther : t.placeholderNote}
              maxLength={500}
              className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-subtle focus-visible:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
            />
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            {t.close}
          </Button>
          <Button variant="danger" disabled={!order || mutation.isPending} onClick={submit}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            {mutation.isPending ? t.sending : t.submit}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
