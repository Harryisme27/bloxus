// Quyền tuỳ chọn theo role (admin bật/tắt). Admin luôn full. Dùng để ẩn/hiện UI;
// server vẫn enforce qua role_can() nên đây chỉ là lớp hiển thị.
import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/lib/db/settings";
import { useAuthStore } from "@/store/authStore";

export const PERMISSIONS = [
  "manage_catalog",
  "manage_ctv",
  "assign_orders",
  "confirm_payment",
  "resolve_refund",
  "claim_orders",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Ma trận quyền: { manager: {perm:bool}, ctv: {...} }. */
export type RolePermissions = Record<string, Record<string, boolean>>;

export function usePermissions() {
  const role = useAuthStore((s) => s.user?.role);
  const { data } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const perms = (data?.role_permissions as RolePermissions | undefined) ?? {};

  function can(p: Permission): boolean {
    if (role === "admin") return true;
    if (!role) return false;
    return Boolean(perms[role]?.[p]);
  }
  return { can, role, perms };
}
