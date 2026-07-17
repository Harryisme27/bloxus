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

const OTHER_REASON = "Lý do khác";

const SUGGESTED_REASONS = [
  "Người bán không giao hàng",
  "Hàng không đúng mô tả",
  "Giao quá chậm",
  "Tôi đổi ý",
  OTHER_REASON,
] as const;

export interface RefundDialogProps {
  /** Đơn cần hoàn tiền — truyền null để đóng dialog. */
  order: Pick<OrderRow, "id" | "order_code"> | null;
  onClose: () => void;
}

export function RefundDialog({ order, onClose }: RefundDialogProps) {
  const [selected, setSelected] = useState<string>("");
  const [custom, setCustom] = useState("");
  const queryClient = useQueryClient();
  const open = order !== null;
  const isOther = selected === OTHER_REASON;

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
      toast.success("Đã gửi yêu cầu hoàn tiền.");
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
      toast.error("Vui lòng chọn lý do hoàn tiền.");
      return;
    }
    const trimmedCustom = custom.trim();
    let finalReason: string;
    if (isOther) {
      if (!trimmedCustom) {
        toast.error("Vui lòng mô tả lý do hoàn tiền.");
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
          <DialogTitle>Yêu cầu hoàn tiền</DialogTitle>
          <DialogDescription>
            Yêu cầu hoàn tiền cho đơn{" "}
            <span className="font-mono font-semibold text-text">{order?.order_code}</span> sẽ được
            gửi tới admin. Nếu sau 1 giờ chưa được xử lý, bạn có thể tự chốt hoàn tiền.
          </DialogDescription>
        </DialogHeader>

        <div>
          <Label>
            Lý do hoàn tiền <span className="text-danger">*</span>
          </Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {SUGGESTED_REASONS.map((r) => {
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
                  Mô tả lý do <span className="text-danger">*</span>
                </>
              ) : (
                "Ghi chú thêm (không bắt buộc)"
              )}
            </Label>
            <textarea
              id="refund-note"
              rows={3}
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              placeholder={
                isOther
                  ? "Mô tả chi tiết lý do bạn muốn hoàn tiền..."
                  : "Bổ sung chi tiết nếu cần..."
              }
              maxLength={500}
              className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-subtle focus-visible:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
            />
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Đóng
          </Button>
          <Button variant="danger" disabled={!order || mutation.isPending} onClick={submit}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            {mutation.isPending ? "Đang gửi..." : "Gửi yêu cầu hoàn tiền"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
