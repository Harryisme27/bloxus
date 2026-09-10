import { Navigate, useLocation } from "react-router-dom";

/**
 * Trang cũ /order-success giờ chỉ chuyển hướng: đơn hàng v2 được theo dõi ở
 * /orders/:id. Nếu có orderId trong state thì đi thẳng tới đó, không thì về
 * danh sách đơn.
 */
export function OrderSuccess() {
  const location = useLocation();
  const orderId = (location.state as { orderId?: string } | null)?.orderId;
  return <Navigate to={orderId ? `/orders/${orderId}` : "/orders"} replace />;
}
