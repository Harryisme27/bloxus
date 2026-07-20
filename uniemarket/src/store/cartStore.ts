// Giỏ hàng client-side (zustand + persist). Giá trên từng dòng CHỈ để hiển thị
// — server luôn tính lại giá thật trong RPC place_order.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductKind, ProductRow, SelectedServiceOptions } from "@/types/db";

/** Một dòng trong giỏ hàng. */
export interface CartLine {
  /** productId + optionKey — 2 lựa chọn khác nhau của cùng 1 dịch vụ là 2 dòng. */
  id: string;
  productId: string;
  kind: ProductKind;
  name: string;
  imageUrl: string | null;
  /** VND, đã gồm giá tuỳ chọn (tier / kéo rank) — chỉ để hiển thị. */
  unitPrice: number;
  /** Dịch vụ luôn khoá ở 1. */
  quantity: number;
  /** Mô tả ngắn lựa chọn, ví dụ "Gói Cày Tốc" hoặc "Vàng IV → Bạch Kim II". */
  optionSummary?: string;
  /** Gửi nguyên vẹn lên place_order. */
  selectedOptions?: SelectedServiceOptions | null;
}

export interface AddItemOptions {
  selectedOptions?: SelectedServiceOptions | null;
  optionSummary?: string;
}

/**
 * Tính đơn giá hiển thị từ service_options của sản phẩm + lựa chọn của khách.
 * (Server tính lại giá thật — hàm này chỉ phục vụ UI.)
 */
export function computeUnitPrice(
  product: ProductRow,
  selected?: SelectedServiceOptions | null,
): number {
  const opts = product.service_options;
  if (!opts || !selected) return product.price;

  if (opts.type === "tiers" && "tier_id" in selected) {
    const tier = opts.tiers.find((t) => t.id === selected.tier_id);
    return tier ? tier.price : product.price;
  }

  if (opts.type === "rank_range" && "from" in selected) {
    const fromIdx = opts.ranks.findIndex((r) => r.id === selected.from);
    const toIdx = opts.ranks.findIndex((r) => r.id === selected.to);
    if (fromIdx < 0 || toIdx < 0 || toIdx <= fromIdx) return product.price;
    return opts.step_price * (toIdx - fromIdx);
  }

  return product.price;
}

function optionKeyOf(selected?: SelectedServiceOptions | null): string {
  if (!selected) return "";
  if ("tier_id" in selected) return `tier:${selected.tier_id}`;
  return `range:${selected.from}>${selected.to}`;
}

/** Dựng 1 dòng giỏ từ sản phẩm + lựa chọn (dùng chung cho giỏ hàng và Mua ngay). */
export function buildCartLine(
  product: ProductRow,
  qty = 1,
  options?: AddItemOptions,
): CartLine {
  const selected = options?.selectedOptions ?? null;
  const isService = product.kind === "service";
  return {
    id: `${product.id}${selected ? `::${optionKeyOf(selected)}` : ""}`,
    productId: product.id,
    kind: product.kind,
    name: product.name,
    imageUrl: product.images[0] ?? null,
    unitPrice: computeUnitPrice(product, selected),
    quantity: isService ? 1 : qty,
    optionSummary: options?.optionSummary,
    selectedOptions: selected,
  };
}

interface CartState {
  items: CartLine[];
  /** Thêm sản phẩm vào giỏ. Dịch vụ luôn 1 dòng/lựa chọn với quantity = 1. */
  addItem: (product: ProductRow, qty?: number, options?: AddItemOptions) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  /** Tổng tạm tính (VND) của mọi dòng. */
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, qty = 1, options) => {
        if (qty <= 0) return;
        const newLine = buildCartLine(product, qty, options);
        const isService = product.kind === "service";

        set((state) => {
          const existing = state.items.find((line) => line.id === newLine.id);
          if (existing) {
            // Dịch vụ khoá số lượng ở 1 — thêm lại cùng lựa chọn không đổi gì.
            const quantity = isService ? 1 : existing.quantity + qty;
            return {
              items: state.items.map((line) =>
                line.id === newLine.id ? { ...line, quantity, unitPrice: newLine.unitPrice } : line,
              ),
            };
          }
          return { items: [...state.items, newLine] };
        });
      },

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((line) => line.id !== id) }));
      },

      setQty: (id, qty) => {
        if (qty <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((line) =>
            line.id === id
              ? { ...line, quantity: line.kind === "service" ? 1 : qty }
              : line,
          ),
        }));
      },

      clear: () => set({ items: [] }),

      subtotal: () => get().items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    }),
    // Đổi key so với v1 (uniemarket-cart) — dữ liệu giỏ cũ (USD, id seed) không
    // tương thích với dòng hàng mới nên để nó tự hết hạn.
    { name: "uniemarket-cart-v2" },
  ),
);
