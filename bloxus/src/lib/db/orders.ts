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

/**
 * Đặt hàng (yêu cầu đăng nhập). MỖI MÓN trong giỏ được tách thành 1 ĐƠN riêng
 * để các Seller khác nhau có thể nhận từng món → trả về MẢNG đơn đã tạo.
 * Server đọc lại giá từ DB — giá client chỉ để hiển thị.
 */
export async function placeOrder(payload: PlaceOrderPayload): Promise<OrderRow[]> {
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
    p_gateway: payload.gateway ?? null,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderRow[];
}

/** Seller/Admin tự nhận 1 đơn trong hàng đợi (paid → in_progress). */
export async function claimOrder(orderId: string): Promise<OrderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("claim_order", { p_order_id: orderId });
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

/** Hàng đợi đơn Seller có thể nhận (đã thanh toán, chưa ai nhận, đúng danh mục được phân). */
export async function listClaimableOrders(): Promise<OrderRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("list_claimable_orders");
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderRow[];
}

/** Trả các đơn quá hạn xử lý về hàng đợi. Trả về số đơn được thu hồi. */
export async function reclaimStaleOrders(): Promise<number> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("reclaim_stale_orders");
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
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

/** Chi tiết 1 đơn kèm dòng hàng (RLS: chủ đơn / Seller được giao / admin). */
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

/** Hàng đợi khu làm việc: admin thấy tất cả, Seller chỉ thấy đơn được giao (RLS lo). */
export async function listWorkOrders(opts?: {
  status?: DbOrderStatus;
  assignedTo?: string;
}): Promise<OrderRow[]> {
  const sb = requireSupabase();
  let query = sb.from("orders").select("*").order("created_at", { ascending: false });
  // Đơn Stripe chưa trả tiền = chưa "tồn tại" với khu làm việc (webhook xác
  // nhận xong mới hiện). Giữ lại mọi đơn khác (kể cả pending CK tay).
  query = query.or(
    "status.neq.pending_payment,payment_gateway.neq.stripe,payment_gateway.is.null",
  );
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

/** Khách báo "Tôi đã chuyển khoản" — thông báo admin vào kiểm tra. */
export async function markPaymentSent(orderId: string): Promise<OrderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("mark_payment_sent", { p_order_id: orderId });
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

/** Admin giao đơn cho Seller: paid → in_progress. */
export async function assignOrder(orderId: string, ctvId: string): Promise<OrderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("assign_order", {
    p_order_id: orderId,
    p_ctv: ctvId,
  });
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

/** Admin: mọi bước hợp lệ; Seller: chỉ in_progress → completed trên đơn của mình. */
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

/** Khách yêu cầu hủy đơn (kèm lý do). pending_payment → hủy ngay; paid/in_progress → tạo yêu cầu. */
export async function requestCancel(orderId: string, reason: string): Promise<OrderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("request_cancel", { p_order_id: orderId, p_reason: reason });
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

/** Admin duyệt/từ chối yêu cầu hủy. */
export async function resolveCancel(orderId: string, approve: boolean, note?: string): Promise<OrderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("resolve_cancel", {
    p_order_id: orderId, p_approve: approve, p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

/** Khách tự chốt hủy sau 24h nếu admin chưa xử lý. */
export async function finalizeCancel(orderId: string): Promise<OrderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("finalize_cancel", { p_order_id: orderId });
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

/** Seller/Admin đánh dấu đã giao kèm ảnh proof (paths trong bucket proof-images). */
export async function markDelivered(orderId: string, proofImages: string[], note?: string): Promise<OrderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("mark_delivered", {
    p_order_id: orderId, p_proof_images: proofImages, p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

/** Khách xác nhận đã nhận hàng → hoàn thành + tự lên Minh chứng. */
export async function confirmReceived(orderId: string): Promise<OrderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("confirm_received", { p_order_id: orderId });
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

/** Khách yêu cầu hoàn tiền (kèm lý do). Tự động sau 1h hoặc admin duyệt. */
export async function requestRefund(orderId: string, reason: string): Promise<OrderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("request_refund", { p_order_id: orderId, p_reason: reason });
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

/** Admin duyệt/từ chối yêu cầu hoàn tiền. */
export async function resolveRefund(orderId: string, approve: boolean, note?: string): Promise<OrderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("resolve_refund", {
    p_order_id: orderId, p_approve: approve, p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

/** Khách tự chốt hoàn tiền sau 1h nếu admin chưa xử lý. */
export async function finalizeRefund(orderId: string): Promise<OrderRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("finalize_refund", { p_order_id: orderId });
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

/** Upload 1 ảnh bằng chứng giao hàng vào bucket proof-images. Trả về public URL. */
export async function uploadDeliveryProof(orderId: string, file: File): Promise<string> {
  const sb = requireSupabase();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${orderId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from("proof-images").upload(path, file, {
    cacheControl: "3600", upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = sb.storage.from("proof-images").getPublicUrl(path);
  return data.publicUrl;
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

/** Admin xóa các đơn theo id (RPC admin-only, cascade items/events/threads). */
export async function deleteOrders(ids: string[]): Promise<number> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("admin_delete_orders", { p_ids: ids });
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}

/** Admin xóa TẤT CẢ đơn hàng (RPC admin-only). Trả về số đơn đã xóa. */
export async function deleteAllOrders(): Promise<number> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("admin_delete_all_orders");
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}
