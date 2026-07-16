// Meta hiển thị trạng thái đơn hàng (DbOrderStatus) cho khu làm việc:
// nhãn tiếng Việt + biến thể Badge + icon — dùng chung cho dashboard,
// bảng đơn, chi tiết đơn và hàng đợi thanh toán.
import {
  BadgeCheck,
  Ban,
  CircleDollarSign,
  Clock,
  Loader,
  RotateCcw,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { DbOrderStatus, OrderDisplayStatus } from "@/types/db";
import { cn } from "@/lib/utils";

export interface WorkStatusMeta {
  label: string;
  variant: NonNullable<BadgeProps["variant"]>;
  icon: LucideIcon;
}

export const WORK_STATUS_META: Record<OrderDisplayStatus, WorkStatusMeta> = {
  pending_payment: { label: "Chờ thanh toán", variant: "gold", icon: Clock },
  paid: { label: "Đã thanh toán", variant: "green", icon: CircleDollarSign },
  in_progress: { label: "Đang thực hiện", variant: "outline", icon: Loader },
  delivered: { label: "Đã giao — chờ xác nhận", variant: "gold", icon: Truck },
  completed: { label: "Hoàn thành", variant: "success", icon: BadgeCheck },
  cancelled: { label: "Đã hủy", variant: "danger", icon: Ban },
  refunded: { label: "Đã hoàn tiền", variant: "default", icon: RotateCcw },
};

/** Thứ tự hiển thị các pill lọc trạng thái (theo DbOrderStatus thật). */
export const WORK_STATUS_ORDER: DbOrderStatus[] = [
  "pending_payment",
  "paid",
  "in_progress",
  "completed",
  "cancelled",
  "refunded",
];

export function WorkOrderStatusBadge({
  status,
  className,
}: {
  status: OrderDisplayStatus;
  className?: string;
}) {
  const meta = WORK_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className={cn("whitespace-nowrap", className)}>
      <Icon className="h-3 w-3" aria-hidden />
      {meta.label}
    </Badge>
  );
}
