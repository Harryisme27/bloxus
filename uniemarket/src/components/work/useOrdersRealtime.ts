// Realtime hàng đợi khu làm việc: lắng nghe INSERT/UPDATE trên public.orders
// (admin: mọi đơn; CTV: chỉ đơn được giao cho mình), rồi invalidate cache
// ['work-orders'] + toast thông báo. Dùng ở dashboard + danh sách đơn.
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useLangStore } from "@/i18n";
import { useAuthStore } from "@/store/authStore";
import type { OrderRow } from "@/types/db";

// Toast realtime được sinh trong callback sự kiện — đọc ngôn ngữ hiện tại qua
// useLangStore.getState() tại thời điểm phát toast để luôn đúng ngôn ngữ.
const STR = {
  vi: {
    newOrder: (code: string) => `Đơn mới ${code}`,
    orderUpdated: (code: string) => `Đơn ${code} được cập nhật`,
  },
  en: {
    newOrder: (code: string) => `New order ${code}`,
    orderUpdated: (code: string) => `Order ${code} updated`,
  },
};

/**
 * Subscribe kênh 'work-orders' (Supabase Realtime). Chỉ chạy khi đã cấu hình
 * Supabase + đã đăng nhập với role admin/ctv. Tự hủy kênh khi unmount.
 */
export function useOrdersRealtime(): void {
  const sessionUserId = useAuthStore((state) => state.session?.user.id);
  const role = useAuthStore((state) => state.user?.role);
  const uid = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !sessionUserId || !uid) return;
    if (role !== "admin" && role !== "manager" && role !== "ctv") return;

    const sb = supabase;
    // Admin/manager nghe toàn bộ; CTV chỉ nghe đơn được giao cho mình.
    const filter = role === "admin" || role === "manager" ? undefined : `assigned_ctv=eq.${uid}`;

    const invalidate = (orderId?: string) => {
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      if (orderId) {
        void queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        void queryClient.invalidateQueries({ queryKey: ["order-events", orderId] });
      }
    };

    const channel = sb
      .channel("work-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", ...(filter ? { filter } : {}) },
        (payload) => {
          const row = payload.new as OrderRow;
          invalidate(row.id);
          toast.info(STR[useLangStore.getState().lang].newOrder(row.order_code));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", ...(filter ? { filter } : {}) },
        (payload) => {
          const row = payload.new as OrderRow;
          invalidate(row.id);
          toast.message(STR[useLangStore.getState().lang].orderUpdated(row.order_code));
        },
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [sessionUserId, role, uid, queryClient]);
}
