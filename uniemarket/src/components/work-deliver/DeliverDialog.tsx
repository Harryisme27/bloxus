// Dialog "Đã giao hàng" (Seller được giao / admin): chọn nhiều ảnh minh chứng,
// upload lên bucket proof-images rồi gọi mark_delivered. Bắt buộc ≥ 1 ảnh.
import { useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Loader2, Truck, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { markDelivered, uploadDeliveryProof } from "@/lib/db/orders";
import type { OrderRow } from "@/types/db";
import { cn } from "@/lib/utils";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    marked: (code: string) => `Đã đánh dấu giao hàng đơn ${code}.`,
    title: "Đã giao hàng",
    descPrefix: "Tải lên ảnh minh chứng đã giao cho đơn",
    descSuffix: "Khách sẽ bấm xác nhận đã nhận sau khi bạn giao.",
    proofLabel: "Ảnh minh chứng giao hàng (bắt buộc ≥ 1, dán ảnh Ctrl+V được)",
    removeImage: "Xóa ảnh",
    addImage: "Thêm ảnh",
    selectedCount: (n: number) => `Đã chọn ${n} ảnh.`,
    noteLabel: "Ghi chú giao hàng (tùy chọn)",
    notePlaceholder: "VD: đã trao item trong game, khách nhận đủ số lượng.",
    close: "Đóng",
    uploading: "Đang tải ảnh...",
    confirm: "Xác nhận đã giao",
  },
  en: {
    marked: (code: string) => `Order ${code} marked as delivered.`,
    title: "Mark delivered",
    descPrefix: "Upload delivery proof images for order",
    descSuffix: "The customer will confirm receipt after you deliver.",
    proofLabel: "Delivery proof images (at least 1 — paste with Ctrl+V works)",
    removeImage: "Remove image",
    addImage: "Add image",
    selectedCount: (n: number) => `${n} image${n === 1 ? "" : "s"} selected.`,
    noteLabel: "Delivery note (optional)",
    notePlaceholder: "e.g. handed over the item in-game, customer received the full amount.",
    close: "Close",
    uploading: "Uploading images...",
    confirm: "Confirm delivery",
  },
};

interface PickedImage {
  id: string;
  file: File;
  previewUrl: string;
}

export interface DeliverDialogProps {
  /** Đơn cần giao — truyền null để đóng dialog. */
  order: Pick<OrderRow, "id" | "order_code"> | null;
  onClose: () => void;
}

/** Xác nhận đã giao hàng kèm ảnh minh chứng + ghi chú tùy chọn. */
export function DeliverDialog({ order, onClose }: DeliverDialogProps) {
  const [images, setImages] = useState<PickedImage[]>([]);
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const open = order !== null;

  const reset = () => {
    setImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      return [];
    });
    setNote("");
  };

  const deliverMutation = useMutation({
    mutationFn: async (input: { orderId: string; files: File[]; note?: string }) => {
      // Upload lần lượt từng ảnh, gom URL rồi mark_delivered.
      const urls: string[] = [];
      for (const file of input.files) {
        urls.push(await uploadDeliveryProof(input.orderId, file));
      }
      return markDelivered(input.orderId, urls, input.note);
    },
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["order", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["order-events", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success(t.marked(updated.order_code));
      reset();
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pending = deliverMutation.isPending;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !pending) {
      reset();
      onClose();
    }
  };

  const addFiles = (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (imgs.length === 0) return;
    setImages((prev) => [
      ...prev,
      ...imgs.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  };

  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    // Cho phép chọn lại cùng một file sau khi xóa.
    event.target.value = "";
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    // Dán ảnh trực tiếp (Ctrl+V) từ clipboard.
    const files = Array.from(event.clipboardData.items)
      .filter((it) => it.kind === "file" && it.type.startsWith("image/"))
      .map((it) => it.getAsFile())
      .filter((f): f is File => f !== null);
    if (files.length) {
      event.preventDefault();
      addFiles(files);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const canConfirm = images.length > 0 && !pending && order !== null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>
            {t.descPrefix}{" "}
            <span className="font-mono font-semibold text-text">{order?.order_code}</span>.{" "}
            {t.descSuffix}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4" onPaste={handlePaste}>
          <div>
            <Label>{t.proofLabel}</Label>
            <div className="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border-strong bg-surface-2"
                >
                  <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                  {!pending ? (
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute right-1 top-1 rounded-md bg-black/70 p-1 text-white opacity-0 transition-opacity hover:bg-black/90 focus-visible:opacity-100 group-hover:opacity-100"
                      aria-label={t.removeImage}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  ) : null}
                </div>
              ))}

              <label
                className={cn(
                  "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-strong bg-surface-2 text-text-subtle transition-colors hover:border-yellow hover:text-yellow",
                  pending && "pointer-events-none opacity-50",
                )}
              >
                <ImagePlus className="h-5 w-5" aria-hidden />
                <span className="text-[11px] font-medium">{t.addImage}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handlePick}
                  disabled={pending}
                />
              </label>
            </div>
            {images.length > 0 ? (
              <p className="mt-1.5 text-xs text-text-subtle">{t.selectedCount(images.length)}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="delivery-note">{t.noteLabel}</Label>
            <textarea
              id="delivery-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t.notePlaceholder}
              maxLength={500}
              rows={3}
              disabled={pending}
              className="flex w-full rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-subtle transition-colors focus-visible:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={pending}>
            {t.close}
          </Button>
          <Button
            variant="primary"
            disabled={!canConfirm}
            onClick={() => {
              if (order) {
                deliverMutation.mutate({
                  orderId: order.id,
                  files: images.map((img) => img.file),
                  note: note.trim() || undefined,
                });
              }
            }}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Truck className="h-4 w-4" aria-hidden />
            )}
            {pending ? t.uploading : t.confirm}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
