// /work/payments (admin) — hàng đợi đơn pending_payment, cũ nhất lên đầu.
// Card to, tối ưu cho việc đối chiếu app ngân hàng: mã đơn LỚN (nội dung
// chuyển khoản) + tổng tiền LỚN + liên hệ khách + nút xác nhận / hủy.
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeDollarSign, Ban, Landmark, ShieldAlert, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SetupNotice } from "@/components/SetupNotice";
import { CancelOrderDialog } from "@/components/work/CancelOrderDialog";
import { CopyButton, ContactChip } from "@/components/work/CopyChip";
import { useOrdersRealtime } from "@/components/work/useOrdersRealtime";
import { paymentMethodLabel } from "@/components/work/workData";
import { confirmPayment, listWorkOrders } from "@/lib/db/orders";
import { formatPrice, relativeTime } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { OrderRow } from "@/types/db";
import { usePick, useLangStore } from "@/i18n";

const STR = {
  vi: {
    title: "Xác nhận thanh toán",
    subtitle:
      "Đối chiếu chuyển khoản theo mã đơn (nội dung CK) rồi bấm xác nhận — đơn cũ nhất lên đầu.",
    adminOnly: "Chỉ admin",
    adminOnlyBody: "Trang xác nhận thanh toán chỉ dành cho quản trị viên.",
    loadError: (msg: string) => `Không tải được hàng đợi. ${msg}`,
    retry: "Thử lại",
    emptyTitle: "Không có đơn nào chờ xác nhận 🎉",
    emptyBody: "Khi khách đặt đơn mới, thẻ đối chiếu sẽ hiện ở đây (realtime).",
    confirmed: (code: string) => `Đã xác nhận thanh toán đơn ${code}.`,
    copyOrderCode: "mã đơn",
    transferContent: "Nội dung CK",
    createdPrefix: (time: string) => `Tạo ${time}`,
    amountToMatch: "Số tiền cần khớp",
    refLabel: "Mã giao dịch / ghi chú (tùy chọn)",
    refPlaceholder: "VD: FT2607xxxx",
    confirming: "Đang xác nhận...",
    confirmReceived: "Xác nhận đã nhận tiền",
    cancelOrder: "Hủy đơn",
  },
  en: {
    title: "Confirm payment",
    subtitle:
      "Match transfers by order code (the transfer memo), then confirm — oldest orders first.",
    adminOnly: "Admins only",
    adminOnlyBody: "The payment confirmation page is for administrators only.",
    loadError: (msg: string) => `Couldn't load the queue. ${msg}`,
    retry: "Try again",
    emptyTitle: "No orders awaiting confirmation 🎉",
    emptyBody:
      "When a customer places a new order, its reconciliation card will appear here (realtime).",
    confirmed: (code: string) => `Payment for order ${code} confirmed.`,
    copyOrderCode: "order code",
    transferContent: "Transfer memo",
    createdPrefix: (time: string) => `Created ${time}`,
    amountToMatch: "Amount to match",
    refLabel: "Transaction ID / note (optional)",
    refPlaceholder: "e.g. FT2607xxxx",
    confirming: "Confirming...",
    confirmReceived: "Confirm payment received",
    cancelOrder: "Cancel order",
  },
};

/** /work/payments (admin) — hàng đợi đối chiếu chuyển khoản theo mã đơn. */
export function WorkPayments() {
  const user = useAuthStore((state) => state.user);
  const t = usePick(STR);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold text-text">{t.title}</h1>
        <p className="mt-1 text-sm text-text-muted">{t.subtitle}</p>
      </header>

      {!isSupabaseConfigured ? (
        <SetupNotice />
      ) : user && user.role !== "admin" ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-text-subtle" aria-hidden />
          <p className="mt-3 font-heading text-lg font-semibold text-text">{t.adminOnly}</p>
          <p className="mt-1 text-sm text-text-muted">{t.adminOnlyBody}</p>
        </div>
      ) : user ? (
        <PaymentsQueue />
      ) : null}
    </div>
  );
}

function PaymentsQueue() {
  useOrdersRealtime();
  const t = usePick(STR);

  const ordersQuery = useQuery({
    queryKey: ["work-orders", { status: "pending_payment" }],
    queryFn: () => listWorkOrders({ status: "pending_payment" }),
  });

  if (ordersQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
    );
  }

  if (ordersQuery.isError) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-text-muted">
          {t.loadError((ordersQuery.error as Error).message)}
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => void ordersQuery.refetch()}>
          {t.retry}
        </Button>
      </div>
    );
  }

  // Cũ nhất lên đầu — khách chờ lâu nhất được xử lý trước.
  const queue = [...ordersQuery.data].sort((a, b) => a.created_at.localeCompare(b.created_at));

  if (queue.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-12 text-center">
        <p className="font-heading text-xl font-semibold text-text">{t.emptyTitle}</p>
        <p className="mt-1 text-sm text-text-muted">{t.emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {queue.map((order) => (
        <PaymentCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function PaymentCard({ order }: { order: OrderRow }) {
  const [ref, setRef] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const lang = useLangStore((state) => state.lang);

  const confirmMutation = useMutation({
    mutationFn: () => confirmPayment(order.id, ref.trim() || undefined),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["order", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["order-events", updated.id] });
      toast.success(t.confirmed(updated.order_code));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const MethodIcon = order.payment_method === "momo" ? Smartphone : Landmark;

  return (
    <article className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Mã đơn — nội dung chuyển khoản */}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
            {t.transferContent}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-3xl font-bold tracking-wide text-yellow">
              {order.order_code}
            </span>
            <CopyButton value={order.order_code} label={t.copyOrderCode} className="h-7 w-7" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <MethodIcon className="h-4 w-4 text-text-subtle" aria-hidden />
              {paymentMethodLabel(order.payment_gateway ?? order.payment_method, lang)}
            </span>
            <span>·</span>
            <span>{t.createdPrefix(relativeTime(order.created_at))}</span>
            <ContactChip channel={order.contact_channel} value={order.contact_value} />
          </div>
        </div>

        {/* Số tiền cần khớp */}
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
            {t.amountToMatch}
          </p>
          <p className="tabular-nums-mono mt-1 text-3xl font-bold text-text">
            {formatPrice(order.total)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4">
        <div className="w-full max-w-sm flex-1">
          <Label htmlFor={`ref-${order.id}`}>{t.refLabel}</Label>
          <Input
            id={`ref-${order.id}`}
            value={ref}
            onChange={(event) => setRef(event.target.value)}
            placeholder={t.refPlaceholder}
            maxLength={200}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => confirmMutation.mutate()}
            disabled={confirmMutation.isPending}
          >
            <BadgeDollarSign className="h-4 w-4" aria-hidden />
            {confirmMutation.isPending ? t.confirming : t.confirmReceived}
          </Button>
          <Button variant="secondary" onClick={() => setCancelOpen(true)}>
            <Ban className="h-4 w-4" aria-hidden />
            {t.cancelOrder}
          </Button>
        </div>
      </div>

      <CancelOrderDialog
        order={cancelOpen ? { id: order.id, order_code: order.order_code } : null}
        onClose={() => setCancelOpen(false)}
      />
    </article>
  );
}
