// Dialog giao đơn cho CTV (admin): chọn 1 CTV từ danh sách đã duyệt rồi
// xác nhận -> assignOrder (paid -> in_progress).
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { assignOrder } from "@/lib/db/orders";
import { listCtvs } from "@/lib/db/profiles";
import type { OrderRow } from "@/types/db";
import { cn } from "@/lib/utils";

export interface AssignCtvDialogProps {
  /** Đơn cần giao — truyền null để đóng dialog. */
  order: Pick<OrderRow, "id" | "order_code"> | null;
  onClose: () => void;
  /** Gọi thêm sau khi giao thành công (cache đã được invalidate sẵn). */
  onAssigned?: (order: OrderRow) => void;
}

export function AssignCtvDialog({ order, onClose, onAssigned }: AssignCtvDialogProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const open = order !== null;

  const ctvsQuery = useQuery({
    queryKey: ["ctvs"],
    queryFn: listCtvs,
    enabled: open,
  });

  const assignMutation = useMutation({
    mutationFn: (input: { orderId: string; ctvId: string }) =>
      assignOrder(input.orderId, input.ctvId),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["order", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["order-events", updated.id] });
      toast.success(`Đã giao đơn ${updated.order_code} cho CTV.`);
      setSelected(null);
      onAssigned?.(updated);
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelected(null);
      onClose();
    }
  };

  const ctvs = ctvsQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Giao đơn cho CTV</DialogTitle>
          <DialogDescription>
            Chọn CTV thực hiện đơn{" "}
            <span className="font-mono font-semibold text-text">{order?.order_code}</span>. Đơn sẽ
            chuyển sang trạng thái “Đang thực hiện”.
          </DialogDescription>
        </DialogHeader>

        {ctvsQuery.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : ctvsQuery.isError ? (
          <div className="rounded-lg border border-border bg-surface-2 p-4 text-sm text-text-muted">
            <p>Không tải được danh sách CTV. {(ctvsQuery.error as Error).message}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => void ctvsQuery.refetch()}
            >
              Thử lại
            </Button>
          </div>
        ) : ctvs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border-strong bg-surface-2 p-4 text-sm text-text-muted">
            Chưa có CTV nào được duyệt. Duyệt đơn ứng tuyển trong mục CTV trước nhé.
          </p>
        ) : (
          <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1" role="radiogroup">
            {ctvs.map((ctv) => {
              const isSelected = selected === ctv.id;
              return (
                <label
                  key={ctv.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                    isSelected
                      ? "border-yellow bg-yellow-soft"
                      : "border-border bg-surface-2 hover:border-border-strong",
                  )}
                >
                  <input
                    type="radio"
                    name="assign-ctv"
                    value={ctv.id}
                    checked={isSelected}
                    onChange={() => setSelected(ctv.id)}
                    className="h-4 w-4 accent-[var(--color-yellow)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-text">
                      {ctv.display_name ?? ctv.username}
                    </span>
                    <span className="block truncate text-xs text-text-subtle">
                      @{ctv.username}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Đóng
          </Button>
          <Button
            variant="primary"
            disabled={!selected || !order || assignMutation.isPending}
            onClick={() => {
              if (order && selected) {
                assignMutation.mutate({ orderId: order.id, ctvId: selected });
              }
            }}
          >
            <UserCheck className="h-4 w-4" aria-hidden />
            {assignMutation.isPending ? "Đang giao..." : "Giao đơn"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
