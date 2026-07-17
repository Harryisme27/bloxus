// Realtime hook — theo dõi 1 đơn hàng (orders.UPDATE) và làm mới cache liên quan.
//
// Khi bất kỳ trường nào của đơn thay đổi phía DB (giao hàng, hoàn tiền, huỷ,
// xác nhận nhận hàng...), hook tự invalidate các query để UI đồng bộ ngay lập
// tức mà không cần refetch thủ công. An toàn khi chưa cấu hình Supabase hoặc
// chưa có orderId — khi đó không subscribe gì cả.
import { useEffect, useId } from "react";
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
  // Tên kênh DUY NHẤT cho mỗi component. Nếu 2 chỗ (vd trang xử lý đơn + khung
  // chat) cùng nghe một đơn mà dùng chung tên kênh, Supabase báo lỗi "cannot add
  // postgres_changes after subscribe()" và làm hỏng trang. useId đảm bảo mỗi
  // instance một kênh riêng.
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !orderId) return;

    const client = supabase;
    const channel = client
      .channel(`order-${orderId}-${instanceId}`)
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
  }, [orderId, instanceId, queryClient]);
}
