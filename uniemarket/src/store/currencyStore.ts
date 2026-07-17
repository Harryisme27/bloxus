// Tiền tệ HIỂN THỊ (zustand + persist). Tiền thật luôn tính bằng VND ở server;
// đây chỉ quy đổi để hiển thị cho khách quốc tế. Mặc định USD.
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Currency = "usd" | "vnd";

/** Tỉ giá quy đổi hiển thị: 1 USD = bao nhiêu VND. Chỉ ảnh hưởng hiển thị.
 * Muốn đổi tỉ giá thì sửa đúng 1 chỗ này. */
export const USD_VND_RATE = 25000;

interface CurrencyState {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  toggle: () => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: "usd",
      setCurrency: (currency) => set({ currency }),
      toggle: () => set({ currency: get().currency === "usd" ? "vnd" : "usd" }),
    }),
    { name: "uniemarket-currency" },
  ),
);
