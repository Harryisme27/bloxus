// Data layer — Đơn hàng. MỌI thao tác ghi đi qua RPC SECURITY DEFINER
// (server tự tính giá + kiểm tra quyền); client không bao giờ ghi thẳng.
import { requireSupabase } from "@/lib/supabase";
import type {
  DbOrderStatus,
  OrderEventRow,
  OrderRow,
  OrderWithItems,
  PlaceOrderPayload,
} from "@/types/db";

/** Đặt hàng (yêu cầu đăng nhập). Server đọc lại giá từ DB — giá client chỉ để hiển thị. */
export async function placeOrder(payload: PlaceOrderPayload): Promise<OrderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("place_order", {
    p_items: payload.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      selected_options: item.selectedOptions ?? null,
    })),
    p_payment_method: payload.paymentMethod,
    p_game_username: payload.gameUsername,
    p_contact_channel: payload.contactChannel,
    p_contact_value: payload.contactValue,
    p_note: payload.note ?? null,
  });
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

/** Đơn hàng của chính tôi (khách). */
export async function listMyOrders(): Promise<OrderRow[]> {
  const sb = requireSupabase();
  const { data: sessionData } = await sb.auth.getSession();
  const uid = sessionData.session?.user.id;
  if (!uid) return [];
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderRow[];
}

/** Chi tiết 1 đơn kèm dòng hàng (RLS: chủ đơn / CTV được giao / admin). */
export async function getOrder(id: string): Promise<OrderWithItems | null> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const { order_items, ...order } = data as OrderRow & { order_items: OrderWithItems["items"] };
  return { ...order, items: order_items ?? [] };
}

/** Hàng đợi khu làm việc: admin thấy tất cả, CTV chỉ thấy đơn được giao (RLS lo). */
export async function listWorkOrders(opts?: {
  status?: DbOrderStatus;
  assignedTo?: string;
}): Promise<OrderRow[]> {
  const sb = requireSupabase();
  let query = sb.from("orders").select("*").order("created_at", { ascending: false });
  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.assignedTo) query = query.eq("assigned_ctv", opts.assignedTo);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderRow[];
}

/** Admin xác nhận đã nhận tiền: pending_payment → paid. */
export async function confirmPayment(orderId: string, ref?: string): Promise<OrderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("confirm_payment", {
    p_order_id: orderId,
    p_ref: ref ?? null,
  });
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

/** Admin giao đơn cho CTV: paid → in_progress. */
export async function assignOrder(orderId: string, ctvId: string): Promise<OrderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("assign_order", {
    p_order_id: orderId,
    p_ctv: ctvId,
  });
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

/** Admin: mọi bước hợp lệ; CTV: chỉ in_progress → completed trên đơn của mình. */
export async function updateOrderStatus(
  orderId: string,
  status: DbOrderStatus,
  note?: string,
): Promise<OrderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("update_order_status", {
    p_order_id: orderId,
    p_status: status,
    p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

/** Khách hủy đơn pending của mình; admin hủy trước khi hoàn thành. Hoàn kho item. */
export async function cancelOrder(orderId: string, reason?: string): Promise<OrderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("cancel_order", {
    p_order_id: orderId,
    p_reason: reason ?? null,
  });
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

/** Nhật ký đơn hàng (nuôi timeline trạng thái). */
export async function listOrderEvents(orderId: string): Promise<OrderEventRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("order_events")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderEventRow[];
}
