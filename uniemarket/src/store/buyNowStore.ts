// "Mua ngay": mua 1 món thẳng tới Checkout, KHÔNG đụng giỏ hàng.
// Không persist — chỉ sống trong phiên mua. Checkout ưu tiên dòng này nếu có.
import { create } from "zustand";
import type { CartLine } from "./cartStore";

interface BuyNowState {
  line: CartLine | null;
  setBuyNow: (line: CartLine) => void;
  clear: () => void;
}

export const useBuyNowStore = create<BuyNowState>((set) => ({
  line: null,
  setBuyNow: (line) => set({ line }),
  clear: () => set({ line: null }),
}));
