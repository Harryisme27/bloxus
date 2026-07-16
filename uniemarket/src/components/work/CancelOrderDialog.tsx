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

export interface CancelOrderDialogProps {
  /** Đơn cần hủy — truyền null để đóng dialog. */
  order: Pick<OrderRow, "id" | "order_code"> | null;
  onClose: () => void;
}

export function CancelOrderDialog({ order, onClose }: CancelOrderDialogProps) {
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const open = order !== null;

  const cancelMutation = useMutation({
    mutationFn: (input: { orderId: string; reason?: string }) =>
      cancelOrder(input.orderId, input.reason),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["order", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["order-events", updated.id] });
      toast.success(`Đã hủy đơn ${updated.order_code}.`);
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
          <DialogTitle>Hủy đơn hàng</DialogTitle>
          <DialogDescription>
            Đơn <span className="font-mono font-semibold text-text">{order?.order_code}</span> sẽ
            chuyển sang “Đã hủy” và hoàn lại tồn kho (nếu có). Thao tác này không đảo ngược được.
          </DialogDescription>
        </DialogHeader>

        <div>
          <Label htmlFor="cancel-reason">Lý do hủy (tùy chọn)</Label>
          <Input
            id="cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="VD: khách không chuyển khoản sau 24h"
            maxLength={300}
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Đóng
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
            {cancelMutation.isPending ? "Đang hủy..." : "Hủy đơn"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
