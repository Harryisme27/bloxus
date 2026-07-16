import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  Receipt,
  ShieldCheck,
  LifeBuoy,
  Package,
  Wallet,
  Loader,
  ArrowRight,
  Sparkles,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAuth } from "@/components/account/RequireAuth";
import { WorkOrderStatusBadge } from "@/components/work/orderStatusMeta";
import { useAuthStore } from "@/store/authStore";
import { listMyOrders } from "@/lib/db/orders";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatPrice, relativeTime } from "@/lib/format";
import { orderDisplayStatus } from "@/types/db";
import { SetupNotice } from "@/components/SetupNotice";

export function Dashboard() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const user = useAuthStore((state) => state.user)!;
  const isStaff = user.role === "admin" || user.role === "ctv";

  const ordersQuery = useQuery({
    queryKey: ["my-orders"],
    queryFn: listMyOrders,
    enabled: isSupabaseConfigured,
  });
  const orders = ordersQuery.data ?? [];

  const totalSpent = orders
    .filter((o) => o.status === "completed" || o.status === "in_progress" || o.status === "paid")
    .reduce((sum, o) => sum + o.total, 0);
  const activeCount = orders.filter(
    (o) => o.status === "paid" || o.status === "in_progress",
  ).length;
  const recent = orders.slice(0, 5);

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
              Chào mừng, {user.display_name || user.username}!
            </h1>
          </div>
          <div className="flex shrink-0 gap-2">
            {isStaff ? (
              <Link to="/work" className={buttonVariants({ variant: "gold", size: "lg" })}>
                <Briefcase className="h-4 w-4" aria-hidden />
                Khu vực làm việc
              </Link>
            ) : null}
            <Link to="/games" className={buttonVariants({ variant: "primary", size: "lg" })}>
              <ShoppingBag className="h-4 w-4" aria-hidden />
              Mua sắm
            </Link>
          </div>
        </div>
      </div>

      {!isSupabaseConfigured ? (
        <div className="mt-6">
          <SetupNotice />
        </div>
      ) : null}

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng số đơn" value={String(orders.length)} icon={Package} tone="green" />
        <StatCard label="Tổng chi tiêu" value={formatPrice(totalSpent)} icon={Wallet} tone="gold" />
        <StatCard label="Đơn đang xử lý" value={String(activeCount)} icon={Loader} tone="neutral" />
      </div>

      {/* Recent orders */}
      <div className="mt-10">
        <SectionHeading
          title="Đơn hàng gần đây"
          description="5 giao dịch mới nhất của bạn."
          action={
            orders.length > 0 ? (
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
        {ordersQuery.isPending ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : recent.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border">
            {recent.map((o) => (
              <Link
                key={o.id}
                to={`/orders/${o.id}`}
                className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <span className="tabular-nums-mono font-semibold text-text">{o.order_code}</span>
                  <span className="ml-2 text-xs text-text-subtle">{relativeTime(o.created_at)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums-mono text-sm font-medium text-yellow">
                    {formatPrice(o.total)}
                  </span>
                  <WorkOrderStatusBadge status={orderDisplayStatus(o)} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-text-subtle">
              <Package className="h-6 w-6" aria-hidden />
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold text-text">Chưa có đơn hàng nào</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
              Bắt đầu mua sắm để thấy đơn hàng và tiến trình xử lý tại đây.
            </p>
            <Link to="/games" className={buttonVariants({ variant: "primary", size: "md" }) + " mt-5"}>
              <ShoppingBag className="h-4 w-4" aria-hidden />
              Khám phá cửa hàng
            </Link>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-10">
        <SectionHeading title="Lối tắt" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink to="/games" icon={ShoppingBag} title="Mua sắm" description="Duyệt danh mục" />
          <QuickLink to="/orders" icon={Receipt} title="Đơn hàng" description="Lịch sử & trạng thái" />
          <QuickLink to="/proofs" icon={ShieldCheck} title="Minh chứng" description="Bằng chứng giao dịch" />
          <QuickLink to="/contact" icon={LifeBuoy} title="Hỗ trợ" description="Liên hệ đội ngũ" />
        </div>
      </div>
    </PageContainer>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: "green" | "gold" | "neutral";
}) {
  const toneClass =
    tone === "gold"
      ? "bg-yellow-soft text-yellow"
      : tone === "green"
        ? "bg-green-soft text-green"
        : "bg-surface-2 text-text-muted";
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5">
      <span className={"flex h-11 w-11 items-center justify-center rounded-xl " + toneClass}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="tabular-nums-mono font-heading text-xl font-bold text-text">{value}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </div>
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
        <p className="font-heading font-semibold text-text">{title}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
    </Link>
  );
}
