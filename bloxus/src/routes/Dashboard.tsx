import { isStaffRole } from "@/lib/roles";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
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
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAuth } from "@/components/account/RequireAuth";
import { WorkOrderStatusBadge } from "@/components/work/orderStatusMeta";
import { useAuthStore } from "@/store/authStore";
import { listMyOrders } from "@/lib/db/orders";
import {
  listMyCreditTransactions,
  requestTopup,
  requestWithdrawal,
  setPayoutInfo,
  listMyTopupRequests,
  listMyWithdrawalRequests,
  cancelTopupRequest,
  cancelWithdrawalRequest,
} from "@/lib/db/credit";
import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/components/ui/confirm";
import { getSettings, getPublicGateways } from "@/lib/db/settings";
import { enabledGateways } from "@/lib/paymentGateways";
import { PaymentMethodSelector } from "@/components/commerce/PaymentMethodSelector";
import { useCurrencyStore, USD_VND_RATE } from "@/store/currencyStore";
import {
  enabledPayoutMethods,
  parsePayoutMethods,
  payoutFee,
  type PayoutMethodMeta,
} from "@/lib/payoutMethods";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatPrice, relativeTime } from "@/lib/format";
import { useLangStore } from "@/i18n";
import { orderDisplayStatus } from "@/types/db";
import type { TopupRequestRow, WithdrawalRequestRow } from "@/types/db";
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
    txWithdraw: "Rút tiền",
    txEarning: "Hoa hồng đơn",
    txPage: "Trang",
    topupBtn: "Nạp tiền",
    withdrawBtn: "Rút tiền",
    topupPrompt: "Số tiền muốn nạp (VNĐ)",
    withdrawPrompt: "Số tiền muốn rút (VNĐ)",
    invalidAmount: "Số tiền không hợp lệ.",
    topupRequested: "Đã gửi yêu cầu nạp — chờ admin duyệt.",
    withdrawRequested: "Đã gửi yêu cầu rút — chờ admin duyệt.",
    reviewPending: "Chờ duyệt",
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
    txWithdraw: "Withdrawal",
    txEarning: "Order commission",
    txPage: "Page",
    topupBtn: "Top up",
    withdrawBtn: "Withdraw",
    topupPrompt: "Amount to top up (VND)",
    withdrawPrompt: "Amount to withdraw (VND)",
    invalidAmount: "Invalid amount.",
    topupRequested: "Top-up requested — awaiting admin approval.",
    withdrawRequested: "Withdrawal requested — awaiting admin approval.",
    reviewPending: "Pending",
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
          style={{ backgroundColor: "rgba(124, 195, 90, 0.09)" }}
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

      {/* Ví/số dư — mọi người dùng đã đăng nhập */}
      <WalletSection t={t} balance={user.credit_balance ?? 0} isStaff={isStaff} />

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
  isStaff,
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
    txWithdraw: string;
    txEarning: string;
    txPage: string;
    topupBtn: string;
    withdrawBtn: string;
    topupPrompt: string;
    withdrawPrompt: string;
    invalidAmount: string;
    topupRequested: string;
    withdrawRequested: string;
    reviewPending: string;
  };
  balance: number;
  isStaff: boolean;
}) {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);
  const [txPage, setTxPage] = useState(0);
  const TX_PER_PAGE = 5;
  const txQuery = useQuery({
    queryKey: ["my-credit-tx"],
    queryFn: () => listMyCreditTransactions(40),
    enabled: isSupabaseConfigured,
  });
  const allTxs = txQuery.data ?? [];
  const txPages = Math.max(1, Math.ceil(allTxs.length / TX_PER_PAGE));
  const txs = allTxs.slice(txPage * TX_PER_PAGE, txPage * TX_PER_PAGE + TX_PER_PAGE);
  const typeLabel: Record<string, string> = {
    topup: t.txTopup,
    spend: t.txSpend,
    adjust: t.txAdjust,
    refund: t.txRefund,
    withdraw: t.txWithdraw,
    earning: t.txEarning,
  };

  return (
    <>
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
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setTopupOpen(true)}>
            {t.topupBtn}
          </Button>
          {isStaff ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={balance <= 0}
              onClick={() => setWithdrawOpen(true)}
            >
              {t.withdrawBtn}
            </Button>
          ) : null}
        </div>
      </div>

      <TopupDialog open={topupOpen} onClose={() => setTopupOpen(false)} />
      {isStaff ? (
        <WithdrawDialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)} balance={balance} />
      ) : null}

      <div className="flex flex-col rounded-2xl border border-border bg-surface p-4">
        {allTxs.length === 0 ? (
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
        {txPages > 1 ? (
          <div className="mt-auto flex items-center justify-center gap-3 pt-3 text-sm text-text-muted">
            <Button size="sm" variant="secondary" disabled={txPage <= 0} onClick={() => setTxPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <span>{t.txPage} {txPage + 1}/{txPages}</span>
            <Button size="sm" variant="secondary" disabled={txPage >= txPages - 1} onClick={() => setTxPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
    <MyWalletRequests isStaff={isStaff} />
    </>
  );
}

/** Yêu cầu nạp/rút CỦA TÔI: trạng thái + nút hủy khi đang chờ. */
function MyWalletRequests({ isStaff }: { isStaff: boolean }) {
  const en = useLangStore((s) => s.lang) === "en";
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const topupQ = useQuery({
    queryKey: ["my-topup-reqs"],
    queryFn: () => listMyTopupRequests(5),
    enabled: isSupabaseConfigured,
  });
  const withdrawQ = useQuery({
    queryKey: ["my-withdraw-reqs"],
    queryFn: () => listMyWithdrawalRequests(5),
    enabled: isSupabaseConfigured && isStaff,
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["my-topup-reqs"] });
    void queryClient.invalidateQueries({ queryKey: ["my-withdraw-reqs"] });
    void queryClient.invalidateQueries({ queryKey: ["my-credit-tx"] });
    void refreshProfile();
  };
  const cancelTopupMut = useMutation({
    mutationFn: cancelTopupRequest,
    onSuccess: () => { toast.success(en ? "Top-up request cancelled." : "Đã hủy yêu cầu nạp."); invalidateAll(); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });
  const cancelWithdrawMut = useMutation({
    mutationFn: cancelWithdrawalRequest,
    onSuccess: () => { toast.success(en ? "Withdrawal cancelled — funds returned." : "Đã hủy yêu cầu rút — tiền đã hoàn về ví."); invalidateAll(); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  type Req = (TopupRequestRow | WithdrawalRequestRow) & { kind: "topup" | "withdraw" };
  const rows: Req[] = [
    ...(topupQ.data ?? []).map((r) => ({ ...r, kind: "topup" as const })),
    ...(withdrawQ.data ?? []).map((r) => ({ ...r, kind: "withdraw" as const })),
  ]
    .filter((r) => r.status !== "cancelled")
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6);

  if (rows.length === 0) return null;

  const statusBadge = (s: string) =>
    s === "approved" ? (
      <Badge variant="success">{en ? "Approved" : "Đã duyệt"}</Badge>
    ) : s === "rejected" ? (
      <Badge variant="danger">{en ? "Rejected" : "Bị từ chối"}</Badge>
    ) : (
      <Badge variant="gold">{en ? "Pending" : "Chờ duyệt"}</Badge>
    );

  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-text">
        {en ? "My top-up / withdrawal requests" : "Yêu cầu nạp / rút của tôi"}
      </h3>
      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li key={r.kind + r.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-text">
                  {r.kind === "topup" ? (en ? "Top-up" : "Nạp tiền") : (en ? "Withdrawal" : "Rút tiền")}
                  <span className="font-mono font-bold"> {formatPrice(r.amount)}</span>
                </p>
                {r.code ? <Badge variant="outline" className="font-mono text-[11px]">{r.code}</Badge> : null}
              </div>
              <p className="text-xs text-text-subtle">{relativeTime(r.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              {statusBadge(r.status)}
              {r.status === "pending" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={cancelTopupMut.isPending || cancelWithdrawMut.isPending}
                  onClick={() => {
                    void confirm({
                      title: en ? "Cancel this request?" : "Hủy yêu cầu này?",
                      message:
                        r.kind === "withdraw"
                          ? (en ? "Held funds will be returned to your wallet." : "Tiền đang giữ sẽ được hoàn về ví.")
                          : (en ? "You can create a new request afterwards." : "Bạn có thể tạo yêu cầu mới sau đó."),
                      confirmText: en ? "Cancel request" : "Hủy yêu cầu",
                    }).then((okc) => {
                      if (!okc) return;
                      if (r.kind === "topup") cancelTopupMut.mutate();
                      else cancelWithdrawMut.mutate();
                    });
                  }}
                >
                  {en ? "Cancel" : "Hủy"}
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Dialog nạp tiền: chọn cổng thanh toán + số tiền (theo tiền tệ hiển thị). */
function TopupDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const en = useLangStore((s) => s.lang) === "en";
  const currency = useCurrencyStore((s) => s.currency);
  const queryClient = useQueryClient();

  const gwQuery = useQuery({ queryKey: ["public-gateways"], queryFn: getPublicGateways, enabled: isSupabaseConfigured && open });
  const settingsQuery = useQuery({ queryKey: ["settings-topup"], queryFn: getSettings, enabled: isSupabaseConfigured && open });
  const methods = enabledGateways(gwQuery.data ?? {});
  const settings = settingsQuery.data ?? {};

  const [gatewayId, setGatewayId] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (open && !gatewayId && methods.length > 0) setGatewayId(methods[0].id);
  }, [open, gatewayId, methods]);

  // Số tiền nhập theo tiền tệ hiển thị -> quy đổi VND để lưu.
  const displayAmt = Number(String(amount).replace(/[^\d.]/g, "")) || 0;
  const vnd = currency === "usd" ? Math.round(displayAmt * USD_VND_RATE) : Math.round(displayAmt);
  const gwCfg = (gwQuery.data ?? {})[gatewayId] ?? {};
  const asText = (v: unknown) => (typeof v === "string" ? v : "");

  const mutation = useMutation({
    mutationFn: () => requestTopup(vnd, gatewayId),
    onSuccess: () => {
      toast.success(en ? "Top-up requested — pay then wait for approval." : "Đã gửi yêu cầu nạp — chuyển khoản rồi chờ admin duyệt.");
      void queryClient.invalidateQueries({ queryKey: ["my-credit-tx"] });
      void queryClient.invalidateQueries({ queryKey: ["my-topup-reqs"] });
      setAmount("");
      onClose();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{en ? "Top up wallet" : "Nạp tiền vào ví"}</DialogTitle>
          <DialogDescription>
            {en ? "Choose a method and amount." : "Chọn phương thức và số tiền."}
          </DialogDescription>
        </DialogHeader>

        {methods.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">
            {en ? "No payment methods enabled." : "Chưa có phương thức thanh toán nào được bật."}
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>{en ? "Amount" : "Số tiền"}</Label>
              <Input
                inputMode="decimal"
                value={amount}
                placeholder={currency === "usd" ? "$10" : "250000"}
                onChange={(e) => setAmount(e.target.value)}
              />
              {vnd > 0 ? (
                <p className="mt-1.5 text-xs text-text-subtle">
                  {en ? "You top up: " : "Số tiền nạp: "}
                  <span className="font-semibold text-yellow">{formatPrice(vnd)}</span>
                </p>
              ) : null}
              {(() => {
                const min = Number(settings.topup_min) || 0;
                const max = Number(settings.topup_max) || 0;
                if (!min && !max) return null;
                return (
                  <p className="mt-1 text-xs text-text-subtle">
                    {en ? "Limit: " : "Giới hạn: "}
                    {min ? `${en ? "min" : "tối thiểu"} ${formatPrice(min)}` : ""}
                    {min && max ? " · " : ""}
                    {max ? `${en ? "max" : "tối đa"} ${formatPrice(max)}` : ""}
                  </p>
                );
              })()}
            </div>

            <div>
              <Label>{en ? "Payment method" : "Phương thức"}</Label>
              <PaymentMethodSelector gateways={methods} value={gatewayId} onChange={setGatewayId} className="mt-1.5" />
            </div>

            {/* Hướng dẫn thanh toán theo phương thức */}
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-2 p-3.5 text-sm text-text-muted">
              {gatewayId === "bank_transfer" ? (
                <>
                  <p><span className="text-text-subtle">Bank:</span> {asText(settings.bank_name) || "—"}</p>
                  <p><span className="text-text-subtle">{en ? "Account" : "Số TK"}:</span> {asText(settings.bank_account) || "—"}</p>
                  <p><span className="text-text-subtle">{en ? "Holder" : "Chủ TK"}:</span> {asText(settings.bank_holder) || "—"}</p>
                </>
              ) : gatewayId === "momo" ? (
                <p><span className="text-text-subtle">Momo:</span> {asText(settings.momo_number) || "—"}</p>
              ) : asText(gwCfg.wallet_address) ? (
                <p><span className="text-text-subtle">{en ? "Wallet" : "Ví"} ({asText(gwCfg.network)}):</span> {asText(gwCfg.wallet_address)}</p>
              ) : asText(gwCfg.link) ? (
                <a href={asText(gwCfg.link)} target="_blank" rel="noreferrer" className="text-yellow underline">
                  {asText(gwCfg.link)}
                </a>
              ) : (
                <p>{en ? "Pay to the shop, then an admin approves your balance." : "Chuyển khoản cho shop, admin sẽ duyệt cộng số dư."}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
                {en ? "Cancel" : "Hủy"}
              </Button>
              <Button onClick={() => mutation.mutate()} disabled={vnd <= 0 || !gatewayId || mutation.isPending}>
                {en ? "Request top-up" : "Gửi yêu cầu nạp"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Dialog rút tiền: chọn phương thức, số tiền, phí theo method, tài khoản nhận. */
function WithdrawDialog({
  open,
  onClose,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  balance: number;
}) {
  const en = useLangStore((s) => s.lang) === "en";
  const queryClient = useQueryClient();
  const payoutInfo = useAuthStore((s) => s.user?.payout_info ?? {});
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const settingsQuery = useQuery({
    queryKey: ["public-payout"],
    queryFn: getSettings,
    enabled: isSupabaseConfigured && open,
  });
  const methodsCfg = parsePayoutMethods(settingsQuery.data);
  const methods = enabledPayoutMethods(methodsCfg);

  const [methodId, setMethodId] = useState("");
  const [amount, setAmount] = useState("");
  const [dest, setDest] = useState("");

  const activeMeta: PayoutMethodMeta | undefined =
    methods.find((m) => m.id === methodId) ?? methods[0];
  const cfg = activeMeta ? methodsCfg[activeMeta.id] : undefined;

  // Chọn phương thức đầu tiên + prefill tài khoản đã lưu khi mở/đổi method.
  useEffect(() => {
    if (open && !methodId && methods.length > 0) setMethodId(methods[0].id);
  }, [open, methodId, methods]);
  useEffect(() => {
    if (activeMeta) setDest(String(payoutInfo[activeMeta.id] ?? ""));
  }, [activeMeta, payoutInfo]);

  const amt = Number(String(amount).replace(/[^\d]/g, "")) || 0;
  const fee = payoutFee(cfg, amt);
  const net = amt - fee;
  const min = cfg?.min ?? 0;

  const mutation = useMutation({
    mutationFn: async () => {
      await requestWithdrawal(amt, activeMeta!.id, dest.trim());
      // Nhớ tài khoản nhận cho lần sau.
      await setPayoutInfo({ ...payoutInfo, [activeMeta!.id]: dest.trim() });
      await refreshProfile();
    },
    onSuccess: () => {
      toast.success(en ? "Withdrawal requested — awaiting approval." : "Đã gửi yêu cầu rút — chờ duyệt.");
      void queryClient.invalidateQueries({ queryKey: ["my-credit-tx"] });
      void queryClient.invalidateQueries({ queryKey: ["my-withdraw-reqs"] });
      setAmount("");
      onClose();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const canSubmit = amt > 0 && amt <= balance && amt >= min && net > 0 && !!activeMeta && dest.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{en ? "Withdraw" : "Rút tiền"}</DialogTitle>
          <DialogDescription>
            {(en ? "Available balance: " : "Số dư khả dụng: ") + formatPrice(balance)}
          </DialogDescription>
        </DialogHeader>

        {methods.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">
            {en ? "No payout methods enabled yet." : "Chưa có phương thức rút nào được bật."}
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>{en ? "Payout method" : "Phương thức"}</Label>
              <Select value={activeMeta?.id ?? ""} onChange={(e) => setMethodId(e.target.value)}>
                {methods.map((m) => {
                  const c = methodsCfg[m.id];
                  const feeStr =
                    (c?.percent ? `${c.percent}%` : "") +
                    (c?.percent && c?.flat ? " + " : "") +
                    (c?.flat ? formatPrice(c.flat) : "");
                  return (
                    <option key={m.id} value={m.id}>
                      {(en ? m.en : m.vi) + (feeStr ? ` (${feeStr})` : "")}
                    </option>
                  );
                })}
              </Select>
            </div>

            <div>
              <Label htmlFor="wd-amount">{en ? "Withdrawal amount" : "Số tiền rút"}</Label>
              <Input
                id="wd-amount"
                inputMode="numeric"
                value={amount}
                placeholder={min > 0 ? `${en ? "min " : "tối thiểu "}${formatPrice(min)}` : "0"}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="wd-dest">{en ? activeMeta?.destEn : activeMeta?.destVi}</Label>
              <Input
                id="wd-dest"
                value={dest}
                placeholder={activeMeta?.destPlaceholder}
                onChange={(e) => setDest(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 rounded-xl border border-border bg-surface-2 p-3.5 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>{en ? "Original amount" : "Số tiền rút"}</span>
                <span className="tabular-nums-mono">{formatPrice(amt)}</span>
              </div>
              <div className="flex justify-between text-danger">
                <span>{en ? "Payout fee" : "Phí rút"}</span>
                <span className="tabular-nums-mono">-{formatPrice(fee)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 text-base font-bold text-green">
                <span>{en ? "You receive" : "Bạn nhận được"}</span>
                <span className="tabular-nums-mono">{formatPrice(Math.max(0, net))}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
                {en ? "Cancel" : "Hủy"}
              </Button>
              <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
                {en ? "Request payout" : "Gửi yêu cầu rút"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
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
