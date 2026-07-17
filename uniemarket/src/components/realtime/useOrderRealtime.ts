// Realtime hook — theo dõi 1 đơn hàng (orders.UPDATE) và làm mới cache liên quan.
//
// Khi bất kỳ trường nào của đơn thay đổi phía DB (giao hàng, hoàn tiền, huỷ,
// xác nhận nhận hàng...), hook tự invalidate các query để UI đồng bộ ngay lập
// tức mà không cần refetch thủ công. An toàn khi chưa cấu hình Supabase hoặc
// chưa có orderId — khi đó không subscribe gì cả.
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Đăng ký lắng nghe realtime cho một đơn hàng.
 * Khi đơn đổi, invalidate: ['order', orderId], ['my-orders'], ['work-orders'].
 *
 * @param orderId id đơn hàng — `undefined` thì không subscribe.
 */
export function useOrderRealtime(orderId: string | undefined): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !orderId) return;

    const client = supabase;
    const channel = client
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["order", orderId] });
          void queryClient.invalidateQueries({ queryKey: ["my-orders"] });
          void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [orderId, queryClient]);
}
