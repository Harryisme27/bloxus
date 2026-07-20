import { isStaffRole } from "@/lib/roles";
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
import { listMyCreditTransactions } from "@/lib/db/credit";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatPrice, relativeTime } from "@/lib/format";
import { orderDisplayStatus } from "@/types/db";
import { SetupNotice } from "@/components/SetupNotice";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    dashboard: "Bảng điều khiển",
    welcome: (name: string) => `Chào mừng, ${name}!`,
    workArea: "Khu vực làm việc",
    shop: "Mua sắm",
    totalOrders: "Tổng số đơn",
    totalSpent: "Tổng chi tiêu",
    walletTitle: "Số dư ví",
    walletDesc: "Số dư nạp trước — dùng để thanh toán đơn nhanh.",
    walletEmpty: "Chưa có giao dịch nào.",
    topupHint: "Nạp tiền: liên hệ admin để cộng số dư.",
    txTopup: "Nạp tiền",
    txSpend: "Thanh toán đơn",
    txAdjust: "Điều chỉnh",
    txRefund: "Hoàn tiền",
    activeOrders: "Đơn đang xử lý",
    recentOrders: "Đơn hàng gần đây",
    recentOrdersDesc: "5 giao dịch mới nhất của bạn.",
    viewAll: "Xem tất cả",
    noOrders: "Chưa có đơn hàng nào",
    noOrdersDesc: "Bắt đầu mua sắm để thấy đơn hàng và tiến trình xử lý tại đây.",
    exploreStore: "Khám phá cửa hàng",
    shortcuts: "Lối tắt",
    shopDesc: "Duyệt danh mục",
    ordersTitle: "Đơn hàng",
    ordersDesc: "Lịch sử & trạng thái",
    proofsTitle: "Minh chứng",
    proofsDesc: "Bằng chứng giao dịch",
    supportTitle: "Hỗ trợ",
    supportDesc: "Liên hệ đội ngũ",
  },
  en: {
    dashboard: "Dashboard",
    welcome: (name: string) => `Welcome, ${name}!`,
    workArea: "Work area",
    shop: "Shop",
    totalOrders: "Total orders",
    totalSpent: "Total spent",
    walletTitle: "Wallet balance",
    walletDesc: "Prepaid balance — use it to pay orders instantly.",
    walletEmpty: "No transactions yet.",
    topupHint: "Top up: contact an admin to add balance.",
    txTopup: "Top-up",
    txSpend: "Order payment",
    txAdjust: "Adjustment",
    txRefund: "Refund",
    activeOrders: "Orders in progress",
    recentOrders: "Recent orders",
    recentOrdersDesc: "Your 5 most recent transactions.",
    viewAll: "View all",
    noOrders: "No orders yet",
    noOrdersDesc: "Start shopping to see your orders and their progress here.",
    exploreStore: "Explore the store",
    shortcuts: "Shortcuts",
    shopDesc: "Browse categories",
    ordersTitle: "Orders",
    ordersDesc: "History & status",
    proofsTitle: "Proofs",
    proofsDesc: "Transaction proofs",
    supportTitle: "Support",
    supportDesc: "Contact the team",
  },
};

export function Dashboard() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const t = usePick(STR);
  const user = useAuthStore((state) => state.user)!;
  const isStaff = isStaffRole(user.role);

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
              {t.dashboard}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-text sm:text-4xl">
              {t.welcome(user.display_name || user.username)}
            </h1>
          </div>
          <div className="flex shrink-0 gap-2">
            {isStaff ? (
              <Link to="/work" className={buttonVariants({ variant: "gold", size: "lg" })}>
                <Briefcase className="h-4 w-4" aria-hidden />
                {t.workArea}
              </Link>
            ) : null}
            <Link to="/games" className={buttonVariants({ variant: "primary", size: "lg" })}>
              <ShoppingBag className="h-4 w-4" aria-hidden />
              {t.shop}
            </Link>
          </div>
        </div>
      </div>

      {!isSupabaseConfigured ? (
        <div className="mt-6">
          <SetupNotice />
        </div>
      ) : null}

      {/* Ví/số dư */}
      {!isStaff ? <WalletSection t={t} balance={user.credit_balance ?? 0} /> : null}

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t.totalOrders} value={String(orders.length)} icon={Package} tone="green" />
        <StatCard label={t.totalSpent} value={formatPrice(totalSpent)} icon={Wallet} tone="gold" />
        <StatCard label={t.activeOrders} value={String(activeCount)} icon={Loader} tone="neutral" />
      </div>

      {/* Recent orders */}
      <div className="mt-10">
        <SectionHeading
          title={t.recentOrders}
          description={t.recentOrdersDesc}
          action={
            orders.length > 0 ? (
              <Link
                to="/orders"
                className="inline-flex items-center gap-1 text-sm font-semibold text-yellow hover:text-yellow-hover"
              >
                {t.viewAll}
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
            <h3 className="mt-4 font-heading text-lg font-semibold text-text">{t.noOrders}</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">{t.noOrdersDesc}</p>
            <Link to="/games" className={buttonVariants({ variant: "primary", size: "md" }) + " mt-5"}>
              <ShoppingBag className="h-4 w-4" aria-hidden />
              {t.exploreStore}
            </Link>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-10">
        <SectionHeading title={t.shortcuts} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink to="/games" icon={ShoppingBag} title={t.shop} description={t.shopDesc} />
          <QuickLink to="/orders" icon={Receipt} title={t.ordersTitle} description={t.ordersDesc} />
          <QuickLink to="/proofs" icon={ShieldCheck} title={t.proofsTitle} description={t.proofsDesc} />
          <QuickLink to="/contact" icon={LifeBuoy} title={t.supportTitle} description={t.supportDesc} />
        </div>
      </div>
    </PageContainer>
  );
}

function WalletSection({
  t,
  balance,
}: {
  t: {
    walletTitle: string;
    walletDesc: string;
    walletEmpty: string;
    topupHint: string;
    txTopup: string;
    txSpend: string;
    txAdjust: string;
    txRefund: string;
  };
  balance: number;
}) {
  const txQuery = useQuery({
    queryKey: ["my-credit-tx"],
    queryFn: () => listMyCreditTransactions(8),
    enabled: isSupabaseConfigured,
  });
  const txs = txQuery.data ?? [];
  const typeLabel: Record<string, string> = {
    topup: t.txTopup,
    spend: t.txSpend,
    adjust: t.txAdjust,
    refund: t.txRefund,
  };

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="relative overflow-hidden rounded-2xl border border-yellow bg-yellow-soft p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-yellow">
          <Wallet className="h-4 w-4" aria-hidden />
          {t.walletTitle}
        </div>
        <p className="mt-3 font-heading text-3xl font-extrabold text-text tabular-nums-mono">
          {formatPrice(balance)}
        </p>
        <p className="mt-2 text-xs text-text-muted">{t.walletDesc}</p>
        <p className="mt-1 text-xs text-text-subtle">{t.topupHint}</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        {txs.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-subtle">{t.walletEmpty}</p>
        ) : (
          <ul className="divide-y divide-border">
            {txs.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">
                    {typeLabel[tx.type] ?? tx.type}
                    {tx.note ? <span className="text-text-subtle"> · {tx.note}</span> : null}
                  </p>
                  <p className="text-xs text-text-subtle">{relativeTime(tx.created_at)}</p>
                </div>
                <span
                  className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${
                    tx.amount >= 0 ? "text-green" : "text-danger"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : "−"}
                  {formatPrice(Math.abs(tx.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
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
