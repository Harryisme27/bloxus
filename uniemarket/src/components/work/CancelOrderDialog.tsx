// Dialog hủy đơn (admin): nhập lý do (tùy chọn) -> cancelOrder.
// Dùng ở chi tiết đơn + hàng đợi xác nhận thanh toán.
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cancelOrder } from "@/lib/db/orders";
import type { OrderRow } from "@/types/db";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    cancelled: (code: string) => `Đã hủy đơn ${code}.`,
    title: "Hủy đơn hàng",
    descPrefix: "Đơn",
    descSuffix:
      "sẽ chuyển sang “Đã hủy” và hoàn lại tồn kho (nếu có). Thao tác này không đảo ngược được.",
    reasonLabel: "Lý do hủy (tùy chọn)",
    reasonPlaceholder: "VD: khách không chuyển khoản sau 24h",
    close: "Đóng",
    cancelling: "Đang hủy...",
    cancel: "Hủy đơn",
  },
  en: {
    cancelled: (code: string) => `Order ${code} cancelled.`,
    title: "Cancel order",
    descPrefix: "Order",
    descSuffix:
      "will move to “Cancelled” and any stock will be restored. This action cannot be undone.",
    reasonLabel: "Cancellation reason (optional)",
    reasonPlaceholder: "e.g. customer hasn't paid after 24h",
    close: "Close",
    cancelling: "Cancelling...",
    cancel: "Cancel order",
  },
};

export interface CancelOrderDialogProps {
  /** Đơn cần hủy — truyền null để đóng dialog. */
  order: Pick<OrderRow, "id" | "order_code"> | null;
  onClose: () => void;
}

export function CancelOrderDialog({ order, onClose }: CancelOrderDialogProps) {
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const open = order !== null;

  const cancelMutation = useMutation({
    mutationFn: (input: { orderId: string; reason?: string }) =>
      cancelOrder(input.orderId, input.reason),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["order", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["order-events", updated.id] });
      toast.success(t.cancelled(updated.order_code));
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>
            {t.descPrefix}{" "}
            <span className="font-mono font-semibold text-text">{order?.order_code}</span>{" "}
            {t.descSuffix}
          </DialogDescription>
        </DialogHeader>

        <div>
          <Label htmlFor="cancel-reason">{t.reasonLabel}</Label>
          <Input
            id="cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t.reasonPlaceholder}
            maxLength={300}
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            {t.close}
          </Button>
          <Button
            variant="danger"
            disabled={!order || cancelMutation.isPending}
            onClick={() => {
              if (order) {
                cancelMutation.mutate({
                  orderId: order.id,
                  reason: reason.trim() || undefined,
                });
              }
            }}
          >
            <Ban className="h-4 w-4" aria-hidden />
            {cancelMutation.isPending ? t.cancelling : t.cancel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
