// Helper phân quyền theo vai trò — MỘT nơi duy nhất định nghĩa "ai được gì".
// Đồng bộ với 14b-manager-perms.sql:
//   admin   : toàn quyền
//   manager : danh mục/sản phẩm, CTV, giao đơn, nhận đơn, xem mọi đơn, hỗ trợ khách
//   ctv     : nhận/xử lý đơn được phân
import type { UserRole } from "@/types/db";

type MaybeRole = UserRole | null | undefined;

/** Vào được khu làm việc / thấy chrome staff (nút Work, VI/VND toggle...). */
export function isStaffRole(role: MaybeRole): boolean {
  return role === "admin" || role === "manager" || role === "ctv";
}

/** Quản lý danh mục & sản phẩm + quản lý CTV + giao đơn + xem mọi đơn. */
export function isAdminOrManager(role: MaybeRole): boolean {
  return role === "admin" || role === "manager";
}

/** Quyền tiền bạc: xác nhận thanh toán, duyệt hoàn tiền/hủy, settings. */
export function isAdminRole(role: MaybeRole): boolean {
  return role === "admin";
}

/** Được tự nhận đơn từ hàng đợi. */
export function canClaimOrders(role: MaybeRole): boolean {
  return role === "ctv" || role === "manager" || role === "admin";
}
