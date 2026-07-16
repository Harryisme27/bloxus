import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Receipt,
  ShieldCheck,
  LifeBuoy,
  Package,
  Wallet,
  Truck,
  ArrowRight,
  Gamepad2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/account/StatCard";
import { DeliveryTracker } from "@/components/account/DeliveryTracker";
import { OrdersTable } from "@/components/account/OrdersTable";
import { OrderDetailDialog } from "@/components/account/OrderDetailDialog";
import { RequireAuth } from "@/components/account/RequireAuth";
import { useReorder } from "@/components/account/useReorder";
import { useAuthStore } from "@/store/authStore";
import { useOrdersStore } from "@/store/ordersStore";
import type { Order } from "@/types";
import { formatPrice } from "@/lib/format";

const SUCCESSFUL: Order["status"][] = ["paid", "delivered"];

export function Dashboard() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const user = useAuthStore((state) => state.user)!;
  const orders = useOrdersStore((state) => state.orders);
  const reorder = useReorder();

  const [selected, setSelected] = useState<Order | null>(null);
  const [open, setOpen] = useState(false);

  // Đơn "guest" là đơn đặt trước khi đăng nhập trên cùng trình duyệt này —
  // trong bản demo local chúng vẫn thuộc về người dùng hiện tại.
  const myOrders = orders.filter(
    (order) => order.userId === user.id || order.userId === "guest",
  );
  const totalSpent = myOrders
    .filter((order) => SUCCESSFUL.includes(order.status))
    .reduce((sum, order) => sum + order.totalUSD, 0);
  const activeOrders = myOrders.filter(
    (order) => SUCCESSFUL.includes(order.status) && order.deliveryStatus !== "delivered",
  );
  const activeOrder = activeOrders[0];
  const recentOrders = myOrders.slice(0, 5);

  function handleSelect(order: Order) {
    setSelected(order);
    setOpen(true);
  }

  return (
    <PageContainer className="py-10 sm:py-14">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div
          aria-hidden
          style={{ backgroundColor: "rgba(245, 176, 30, 0.09)" }}
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-yellow">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Bảng điều khiển
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-text sm:text-4xl">
              Chào mừng, {user.display_name ?? user.username}!
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted">
              <Gamepad2 className="h-4 w-4 text-text-subtle" aria-hidden />
              Tên tài khoản:
              <span className="font-medium text-text">@{user.username}</span>
            </p>
          </div>
          <Link to="/games" className={buttonVariants({ variant: "primary", size: "lg" }) + " shrink-0"}>
            <ShoppingBag className="h-4 w-4" aria-hidden />
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Tổng số đơn"
          value={myOrders.length}
          icon={Package}
          tone="green"
          hint="Đơn đã đặt trên tài khoản"
        />
        <StatCard
          label="Tổng chi tiêu"
          value={formatPrice(totalSpent)}
          icon={Wallet}
          tone="gold"
          hint="Từ các đơn thành công (demo)"
        />
        <StatCard
          label="Đơn đang giao"
          value={activeOrders.length}
          icon={Truck}
          tone="neutral"
          hint="Đang chờ giao vào Roblox"
        />
      </div>

      {/* Active delivery tracker */}
      {activeOrder ? (
        <div className="mt-6">
          <DeliveryTracker order={activeOrder} />
        </div>
      ) : null}

      {/* Recent orders */}
      <div className="mt-10">
        <SectionHeading
          title="Đơn hàng gần đây"
          description="5 giao dịch mới nhất của bạn."
          action={
            myOrders.length > 0 ? (
              <Link
                to="/orders"
                className="inline-flex items-center gap-1 text-sm font-semibold text-yellow hover:text-yellow-hover"
              >
                Xem tất cả
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : undefined
          }
        />
        {recentOrders.length > 0 ? (
          <OrdersTable orders={recentOrders} onSelect={handleSelect} onReorder={reorder} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-text-subtle">
              <Package className="h-6 w-6" aria-hidden />
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold text-text">Chưa có đơn hàng nào</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
              Bắt đầu mua sắm để thấy đơn hàng và tiến trình giao vật phẩm tại đây.
            </p>
            <Link
              to="/games"
              className={buttonVariants({ variant: "primary", size: "md" }) + " mt-5"}
            >
              <ShoppingBag className="h-4 w-4" aria-hidden />
              Khám phá vật phẩm
            </Link>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-10">
        <SectionHeading title="Lối tắt" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink to="/games" icon={ShoppingBag} title="Mua sắm" description="Duyệt vật phẩm theo game" />
          <QuickLink to="/orders" icon={Receipt} title="Đơn hàng" description="Lịch sử & trạng thái giao" />
          <QuickLink to="/proofs" icon={ShieldCheck} title="Minh chứng" description="Bằng chứng giao dịch" />
          <QuickLink to="/contact" icon={LifeBuoy} title="Hỗ trợ" description="Liên hệ đội ngũ Uniemarket" />
        </div>
      </div>

      <OrderDetailDialog order={selected} open={open} onOpenChange={setOpen} onReorder={reorder} />
    </PageContainer>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-yellow hover:shadow-glow-amber"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-soft text-yellow transition-colors group-hover:bg-yellow group-hover:text-text-on-yellow">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <h3 className="font-heading text-base font-semibold text-text group-hover:text-yellow">{title}</h3>
        <p className="mt-0.5 text-xs text-text-muted">{description}</p>
      </div>
    </Link>
  );
}
