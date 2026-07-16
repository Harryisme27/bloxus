import { useCallback } from "react";
import { toast } from "sonner";
import type { Order } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { getItemById } from "@/lib/api";

/** Returns a callback that re-adds every still-purchasable line of an order back
 * into the cart (looking each item up by id) and reports the result via a toast.
 * Shared by the Dashboard recent-orders table and the full order history. */
export function useReorder() {
  const addItem = useCartStore((state) => state.addItem);

  return useCallback(
    (order: Order) => {
      let added = 0;
      let missing = 0;

      for (const line of order.items) {
        const item = getItemById(line.itemId);
        if (item) {
          addItem(item, line.quantity);
          added += 1;
        } else {
          missing += 1;
        }
      }

      if (added === 0) {
        toast.error("Không thể mua lại", {
          description: "Các vật phẩm trong đơn này hiện không còn được bán.",
        });
        return;
      }

      toast.success("Đã thêm vào giỏ hàng", {
        description:
          missing > 0
            ? `Đã thêm lại ${added} vật phẩm · ${missing} vật phẩm không còn bán.`
            : `Đã thêm lại ${added} vật phẩm từ đơn ${order.id}.`,
      });
    },
    [addItem],
  );
}
