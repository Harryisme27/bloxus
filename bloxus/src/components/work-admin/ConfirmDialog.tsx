import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePick } from "@/i18n";

const STR = {
  vi: { cancel: "Hủy", confirm: "Xác nhận", processing: "Đang xử lý…" },
  en: { cancel: "Cancel", confirm: "Confirm", processing: "Processing…" },
};

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** true = nút xác nhận màu đỏ (hành động ẩn/từ chối). */
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  /** Nội dung thêm (vd: ô ghi chú) giữa mô tả và hàng nút. */
  children?: ReactNode;
}

/** Hộp thoại xác nhận dùng chung cho khu quản trị. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger,
  loading,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const t = usePick(STR);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel ?? t.cancel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={loading}>
            {loading ? t.processing : (confirmLabel ?? t.confirm)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
