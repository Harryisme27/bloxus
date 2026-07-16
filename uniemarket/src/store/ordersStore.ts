import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, OrderItem, OrderStatus, DeliveryStatus } from "@/types";

export interface PlaceOrderPayload {
  userId: string;
  items: OrderItem[];
  robloxUsername: string;
  subtotalUSD: number;
  discountUSD: number;
  totalUSD: number;
  paymentMethod: string;
  /** Defaults to "paid" — pass "failed"/"cancelled" to simulate other demo scenarios. */
  status?: OrderStatus;
  deliveryStatus?: DeliveryStatus;
}

interface OrdersState {
  orders: Order[];
  /** Counter used to generate the numeric suffix of order ids, e.g. UM-2026-1050. */
  nextOrderSeq: number;
  placeOrder: (payload: PlaceOrderPayload) => Order;
  getById: (id: string) => Order | undefined;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      // Seed proofs use UM-2026-1007..1042, so start new demo orders past that.
      nextOrderSeq: 1050,

      placeOrder: (payload) => {
        const now = new Date();
        const year = now.getFullYear();
        const seq = get().nextOrderSeq;
        const id = `UM-${year}-${seq}`;
        const nowIso = now.toISOString();

        const order: Order = {
          id,
          userId: payload.userId,
          items: payload.items,
          robloxUsername: payload.robloxUsername,
          subtotalUSD: payload.subtotalUSD,
          discountUSD: payload.discountUSD,
          totalUSD: payload.totalUSD,
          status: payload.status ?? "paid",
          paymentMethod: payload.paymentMethod,
          deliveryStatus: payload.deliveryStatus ?? "awaiting",
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        set((state) => ({
          orders: [order, ...state.orders],
          nextOrderSeq: state.nextOrderSeq + 1,
        }));

        return order;
      },

      getById: (id) => get().orders.find((order) => order.id === id),
    }),
    { name: "uniemarket-orders" },
  ),
);
