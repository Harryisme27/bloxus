import {
  Clock,
  CreditCard,
  BadgeCheck,
  XCircle,
  Ban,
  RotateCcw,
  PackageCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { OrderStatus, DeliveryStatus } from "@/types";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusMeta {
  label: string;
  variant: NonNullable<BadgeProps["variant"]>;
  icon: LucideIcon;
}

/** Order payment status → Vietnamese label + badge style + icon. Kept here so
 * the Dashboard, OrderHistory table and the detail dialog all render statuses
 * identically. */
export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending: { label: "Chờ xử lý", variant: "gold", icon: Clock },
  paid: { label: "Đã thanh toán", variant: "green", icon: CreditCard },
  delivered: { label: "Đã giao", variant: "success", icon: BadgeCheck },
  failed: { label: "Thất bại", variant: "danger", icon: XCircle },
  cancelled: { label: "Đã huỷ", variant: "default", icon: Ban },
  refunded: { label: "Đã hoàn tiền", variant: "outline", icon: RotateCcw },
};

/** Delivery progress → Vietnamese label + badge style + icon. */
export const DELIVERY_STATUS_META: Record<DeliveryStatus, StatusMeta> = {
  awaiting: { label: "Chờ giao", variant: "gold", icon: Clock },
  in_progress: { label: "Đang giao", variant: "green", icon: Truck },
  delivered: { label: "Đã giao", variant: "success", icon: PackageCheck },
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const meta = ORDER_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className={cn("whitespace-nowrap", className)}>
      <Icon className="h-3 w-3" aria-hidden />
      {meta.label}
    </Badge>
  );
}

export function DeliveryStatusBadge({
  status,
  className,
}: {
  status: DeliveryStatus;
  className?: string;
}) {
  const meta = DELIVERY_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className={cn("whitespace-nowrap", className)}>
      <Icon className="h-3 w-3" aria-hidden />
      {meta.label}
    </Badge>
  );
}
