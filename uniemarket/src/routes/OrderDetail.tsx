import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCircle2,
  Copy,
  Landmark,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/PageContainer";
import { RequireAuth } from "@/components/account/RequireAuth";
import { SetupNotice } from "@/components/SetupNotice";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderChatPanel } from "@/components/chat/OrderChatPanel";
import { WorkOrderStatusBadge } from "@/components/work/orderStatusMeta";
import { CancelRequestDialog } from "@/components/order/CancelRequestDialog";
import { DeliveryProofGallery } from "@/components/order/DeliveryProofGallery";
import { OrderActions } from "@/components/order/OrderActions";
import { finalizeCancel, getOrder, listOrderEvents } from "@/lib/db/orders";
import { getSettings } from "@/lib/db/settings";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatPrice, relativeTime } from "@/lib/format";
import { orderDisplayStatus } from "@/types/db";
import type { OrderEventType } from "@/types/db";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    eventLabel: {
      created: "Đã tạo đơn",
      payment_confirmed: "Đã xác nhận thanh toán",
      assigned: "Đã giao cho người xử lý",
      status_changed: "Cập nhật trạng thái",
      note: "Ghi chú",
      cancelled: "Đã hủy đơn",
      refunded: "Đã hoàn tiền",
    } as Record<OrderEventType, string>,
    orderCancelled: "Đã hủy đơn hàng.",
    cancelFailed: "Không hủy được đơn.",
    copied: (label: string) => `Đã sao chép ${label}`,
    copyAria: (label: string) => `Sao chép ${label}`,
    notFoundTitle: "Không tìm thấy đơn hàng",
    notFoundBody: "Đơn này không tồn tại hoặc bạn không có quyền xem.",
    backToOrders: "Về danh sách đơn",
    ordersList: "Danh sách đơn hàng",
    cancelPendingTitle:
      "Bạn đã yêu cầu hủy đơn — đang chờ người bán/admin xử lý (tự động hủy sau 24h)",
    reason: "Lý do:",
    confirmCancelNow: "Xác nhận hủy đơn ngay bây giờ?",
    cancelling: "Đang hủy...",
    confirmCancelNowBtn: "Xác nhận hủy ngay",
    cancelFinalizeHint:
      "Sau 24h kể từ lúc gửi yêu cầu, bạn có thể tự xác nhận hủy nếu chưa được xử lý.",
    deliveredTitle: "Người bán đã giao hàng",
    deliveredBody: "Vui lòng kiểm tra và xác nhận bạn đã nhận đúng hàng để hoàn tất đơn.",
    completedTitle: "Đơn hàng đã hoàn thành",
    completedBody: "Cảm ơn bạn! Đơn đã được ghi vào Minh chứng.",
    viewProofs: "Xem Minh chứng",
    payInstrTitle: "Hướng dẫn thanh toán",
    payInstrPrefix: "Chuyển đúng số tiền và ghi ",
    payInstrBold: "mã đơn",
    payInstrSuffix:
      " vào nội dung. Shop sẽ xác nhận và bắt đầu xử lý ngay khi nhận được tiền.",
    momoNumber: "Số Momo",
    momoQrAlt: "QR Momo",
    bank: "Ngân hàng",
    accountNumber: "Số tài khoản",
    accountHolder: "Chủ tài khoản",
    amount: "Số tiền",
    transferNote: "Nội dung chuyển khoản",
    bankNotConfigured:
      "Shop chưa cấu hình thông tin ngân hàng — vui lòng liên hệ qua khung chat bên phải.",
    orderDetailsTitle: "Chi tiết đơn",
    total: "Tổng cộng",
    timelineTitle: "Tiến trình đơn hàng",
    cancelOrder: "Hủy đơn",
    requestCancel: "Yêu cầu hủy đơn",
    requestCancelHint:
      "Yêu cầu hủy sẽ báo cho người bán và cần admin duyệt, hoặc bạn tự xác nhận hủy sau 24h nếu chưa được xử lý.",
  },
  en: {
    eventLabel: {
      created: "Order created",
      payment_confirmed: "Payment confirmed",
      assigned: "Assigned to a handler",
      status_changed: "Status updated",
      note: "Note",
      cancelled: "Order cancelled",
      refunded: "Refunded",
    } as Record<OrderEventType, string>,
    orderCancelled: "Order cancelled.",
    cancelFailed: "Couldn't cancel the order.",
    copied: (label: string) => `Copied ${label}`,
    copyAria: (label: string) => `Copy ${label}`,
    notFoundTitle: "Order not found",
    notFoundBody: "This order doesn't exist or you don't have permission to view it.",
    backToOrders: "Back to orders",
    ordersList: "Orders",
    cancelPendingTitle:
      "You've requested to cancel this order — awaiting seller/admin handling (auto-cancels after 24h)",
    reason: "Reason:",
    confirmCancelNow: "Confirm cancelling the order right now?",
    cancelling: "Cancelling...",
    confirmCancelNowBtn: "Confirm cancellation now",
    cancelFinalizeHint:
      "24 hours after your request, you can confirm the cancellation yourself if it hasn't been handled.",
    deliveredTitle: "The seller has delivered",
    deliveredBody: "Please check and confirm you received the correct items to complete the order.",
    completedTitle: "Order completed",
    completedBody: "Thank you! This order has been added to Proofs.",
    viewProofs: "View Proofs",
    payInstrTitle: "Payment instructions",
    payInstrPrefix: "Transfer the exact amount and put the ",
    payInstrBold: "order code",
    payInstrSuffix:
      " in the transfer note. The shop will confirm and start processing as soon as the money arrives.",
    momoNumber: "Momo number",
    momoQrAlt: "Momo QR",
    bank: "Bank",
    accountNumber: "Account number",
    accountHolder: "Account holder",
    amount: "Amount",
    transferNote: "Transfer note",
    bankNotConfigured:
      "The shop hasn't configured bank details yet — please contact us via the chat on the right.",
    orderDetailsTitle: "Order details",
    total: "Total",
    timelineTitle: "Order timeline",
    cancelOrder: "Cancel order",
    requestCancel: "Request cancellation",
    requestCancelHint:
      "A cancellation request notifies the seller and needs admin approval, or you can confirm the cancellation yourself after 24h if it isn't handled.",
  },
};

export function OrderDetail() {
  return (
    <RequireAuth>
      <OrderDetailContent />
    </RequireAuth>
  );
}

function OrderDetailContent() {
  const t = usePick(STR);
  const confirm = useConfirm();
  const { id = "" } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);

  const orderQuery = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
    enabled: isSupabaseConfigured && Boolean(id),
  });
  const eventsQuery = useQuery({
    queryKey: ["order-events", id],
    queryFn: () => listOrderEvents(id),
    enabled: isSupabaseConfigured && Boolean(id),
  });
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    enabled: isSupabaseConfigured,
  });

  const invalidateOrder = () => {
    void queryClient.invalidateQueries({ queryKey: ["order", id] });
    void queryClient.invalidateQueries({ queryKey: ["order-events", id] });
    void queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
  };

  const finalizeCancelMutation = useMutation({
    mutationFn: () => finalizeCancel(id),
    onSuccess: () => {
      toast.success(t.orderCancelled);
      invalidateOrder();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.cancelFailed),
  });

  if (!isSupabaseConfigured) {
    return (
      <PageContainer className="py-10 sm:py-14">
        <SetupNotice />
      </PageContainer>
    );
  }

  if (orderQuery.isPending) {
    return (
      <PageContainer className="py-10 sm:py-14">
        <Skeleton className="h-8 w-56" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  const order = orderQuery.data;
  if (orderQuery.isError || !order) {
    return (
      <PageContainer className="py-16 text-center">
        <h1 className="font-heading text-2xl font-bold text-text">{t.notFoundTitle}</h1>
        <p className="mt-2 text-text-muted">{t.notFoundBody}</p>
        <Link to="/orders" className="mt-6 inline-block">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.backToOrders}
          </Button>
        </Link>
      </PageContainer>
    );
  }

  const settings = settingsQuery.data ?? {};
  const asText = (v: unknown) => (typeof v === "string" ? v : "");
  const displayStatus = orderDisplayStatus(order);
  const isPending = displayStatus === "pending_payment";

  // Yêu cầu hủy đang chờ xử lý (đơn paid/in_progress — không tính đã hủy/hoàn thành).
  const cancelPending =
    order.cancel_requested_at != null &&
    order.status !== "cancelled" &&
    order.status !== "completed";
  const hoursSinceCancel = order.cancel_requested_at
    ? (Date.now() - new Date(order.cancel_requested_at).getTime()) / 3_600_000
    : 0;
  const canFinalizeCancel = cancelPending && hoursSinceCancel >= 24;

  // Nút yêu cầu hủy chỉ hiện khi chưa có yêu cầu nào và đơn còn ở giai đoạn hủy được.
  const showRequestCancel =
    !cancelPending &&
    (displayStatus === "pending_payment" ||
      displayStatus === "paid" ||
      displayStatus === "in_progress");

  function copy(text: string, label: string) {
    void navigator.clipboard?.writeText(text);
    toast.success(t.copied(label));
  }

  return (
    <PageContainer className="py-10 sm:py-14">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-yellow"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> {t.ordersList}
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="tabular-nums-mono font-heading text-2xl font-extrabold text-text sm:text-3xl">
            {order.order_code}
          </h1>
          <WorkOrderStatusBadge status={displayStatus} />
        </div>
        <span className="tabular-nums-mono font-heading text-xl font-bold text-yellow">
          {formatPrice(order.total)}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* LEFT */}
        <div className="space-y-6">
          {/* Cancel request pending banner */}
          {cancelPending ? (
            <div className="rounded-2xl border border-yellow bg-yellow-soft p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-base font-semibold text-text">
                    {t.cancelPendingTitle}
                  </p>
                  {order.cancel_request_reason ? (
                    <p className="mt-1 text-sm text-text-muted">
                      {t.reason} <span className="text-text">{order.cancel_request_reason}</span>
                    </p>
                  ) : null}
                  {canFinalizeCancel ? (
                    <Button
                      variant="danger"
                      className="mt-4"
                      disabled={finalizeCancelMutation.isPending}
                      onClick={async () => {
                        const r = await confirm({ title: t.confirmCancelNowBtn, message: t.confirmCancelNow, tone: "danger" });
                        if (r.ok) finalizeCancelMutation.mutate();
                      }}
                    >
                      <XCircle className="h-4 w-4" aria-hidden />
                      {finalizeCancelMutation.isPending ? t.cancelling : t.confirmCancelNowBtn}
                    </Button>
                  ) : (
                    <p className="mt-3 text-xs text-text-subtle">{t.cancelFinalizeHint}</p>
                  )}
                </div>
              </div>
            </div>
          ) : displayStatus === "delivered" ? (
            <div className="rounded-2xl border border-green bg-green-soft p-5">
              <div className="flex items-start gap-3">
                <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-green" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-base font-semibold text-text">
                    {t.deliveredTitle}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">{t.deliveredBody}</p>
                  {order.delivery_note ? (
                    <p className="mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text">
                      {order.delivery_note}
                    </p>
                  ) : null}
                  {order.delivery_proof_images.length > 0 ? (
                    <DeliveryProofGallery
                      images={order.delivery_proof_images}
                      className="mt-3"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ) : displayStatus === "completed" ? (
            <div className="rounded-2xl border border-green bg-green-soft p-5">
              <div className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-green" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-base font-semibold text-text">
                    {t.completedTitle}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">{t.completedBody}</p>
                  <Link
                    to="/proofs"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-green transition-colors hover:underline"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden /> {t.viewProofs}
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          {/* Buyer actions: Hoàn tất đơn (Complete Order) + Yêu cầu hoàn tiền */}
          <OrderActions order={order} />

          {/* Payment instructions while pending */}
          {isPending ? (
            <Card className="border-yellow/40" style={{ borderColor: "rgba(245,176,30,0.4)" }}>
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  {order.payment_method === "momo" ? (
                    <Wallet className="h-4 w-4 text-yellow" aria-hidden />
                  ) : (
                    <Landmark className="h-4 w-4 text-yellow" aria-hidden />
                  )}
                  {t.payInstrTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-sm">
                <p className="text-text-muted">
                  {t.payInstrPrefix}
                  <b className="text-text">{t.payInstrBold}</b>
                  {t.payInstrSuffix}
                </p>
                {order.payment_method === "momo" ? (
                  <>
                    <PayRow label={t.momoNumber} value={asText(settings.momo_number)} onCopy={copy} />
                    {asText(settings.momo_qr_url) ? (
                      <img
                        src={asText(settings.momo_qr_url)}
                        alt={t.momoQrAlt}
                        className="h-44 w-44 rounded-lg border border-border object-contain"
                      />
                    ) : null}
                  </>
                ) : (
                  <>
                    <PayRow label={t.bank} value={asText(settings.bank_name)} onCopy={copy} />
                    <PayRow label={t.accountNumber} value={asText(settings.bank_account)} onCopy={copy} />
                    <PayRow label={t.accountHolder} value={asText(settings.bank_holder)} onCopy={copy} />
                  </>
                )}
                <PayRow label={t.amount} value={formatPrice(order.total)} onCopy={copy} highlight />
                <PayRow
                  label={t.transferNote}
                  value={order.order_code}
                  onCopy={copy}
                  highlight
                />
                {!asText(settings.bank_account) && order.payment_method === "bank_transfer" ? (
                  <p className="text-xs text-warning">{t.bankNotConfigured}</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Items */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptText className="h-4 w-4 text-yellow" aria-hidden /> {t.orderDetailsTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {order.items.map((it) => (
                  <li key={it.id} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="line-clamp-1 font-medium text-text">{it.name}</span>
                      {it.category_name ? (
                        <span className="text-xs text-text-subtle">{it.category_name}</span>
                      ) : null}
                      <span className="tabular-nums-mono block text-xs text-text-subtle">
                        {formatPrice(it.unit_price)} × {it.quantity}
                      </span>
                    </span>
                    <span className="tabular-nums-mono shrink-0 font-medium text-text">
                      {formatPrice(it.line_total)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="font-heading text-sm font-semibold text-text">{t.total}</span>
                <span className="tabular-nums-mono font-heading text-lg font-bold text-yellow">
                  {formatPrice(order.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base">{t.timelineTitle}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {eventsQuery.isPending ? (
                <Skeleton className="h-24" />
              ) : (
                <ol className="space-y-4">
                  {(eventsQuery.data ?? []).map((ev) => (
                    <li key={ev.id} className="flex gap-3">
                      <span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full bg-yellow" />
                      <div>
                        <p className="text-sm font-medium text-text">
                          {t.eventLabel[ev.event_type]}
                        </p>
                        {ev.note ? <p className="text-xs text-text-muted">{ev.note}</p> : null}
                        <p className="tabular-nums-mono text-xs text-text-subtle">
                          {relativeTime(ev.created_at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Request-cancel action */}
          {showRequestCancel ? (
            <div>
              <Button
                variant="secondary"
                onClick={() => setCancelOpen(true)}
                className="text-danger hover:border-danger"
              >
                {isPending ? (
                  <>
                    <XCircle className="h-4 w-4" aria-hidden /> {t.cancelOrder}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" aria-hidden /> {t.requestCancel}
                  </>
                )}
              </Button>
              {!isPending ? (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-text-subtle">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  {t.requestCancelHint}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* RIGHT: chat */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderChatPanel orderId={order.id} className="h-[32rem]" />
        </div>
      </div>

      <CancelRequestDialog
        order={cancelOpen ? { id: order.id, order_code: order.order_code } : null}
        immediate={isPending}
        onClose={() => setCancelOpen(false)}
      />
    </PageContainer>
  );
}

function PayRow({
  label,
  value,
  onCopy,
  highlight,
}: {
  label: string;
  value: string;
  onCopy: (v: string, label: string) => void;
  highlight?: boolean;
}) {
  const t = usePick(STR);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-text-subtle">{label}</p>
        <p
          className={
            "tabular-nums-mono truncate font-semibold " + (highlight ? "text-yellow" : "text-text")
          }
        >
          {value || "—"}
        </p>
      </div>
      {value ? (
        <button
          type="button"
          onClick={() => onCopy(value, label)}
          aria-label={t.copyAria(label)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:border-yellow hover:text-yellow"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : (
        <Check className="h-3.5 w-3.5 text-text-disabled" aria-hidden />
      )}
    </div>
  );
}
