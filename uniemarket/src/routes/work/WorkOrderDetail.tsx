// /work/orders/:id — workview 2 cột:
// TRÁI: header + thẻ khách + dòng hàng + timeline + điều khiển theo vai trò
//   (admin: xác nhận tiền / giao CTV / hoàn thành / hoàn tiền / hủy;
//    CTV: hoàn thành đơn + gọi hỗ trợ vào kênh nội bộ).
// PHẢI: OrderChatPanel (Agent D) — chat đơn realtime.
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  BadgeDollarSign,
  Ban,
  LifeBuoy,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  StickyNote,
  Truck,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SetupNotice } from "@/components/SetupNotice";
import { OrderChatPanel } from "@/components/chat/OrderChatPanel";
import { AssignCtvDialog } from "@/components/work/AssignCtvDialog";
import { CancelOrderDialog } from "@/components/work/CancelOrderDialog";
import { CopyButton, ContactChip } from "@/components/work/CopyChip";
import { WorkOrderStatusBadge, WORK_STATUS_META } from "@/components/work/orderStatusMeta";
import { describeSelectedOptions, paymentMethodLabel } from "@/components/work/workData";
import { CancelRequestBanner } from "@/components/work-deliver/CancelRequestBanner";
import { DeliverDialog } from "@/components/work-deliver/DeliverDialog";
import { DeliveredPanel } from "@/components/work-deliver/DeliveredPanel";
import { RefundRequestBanner } from "@/components/work-refund/RefundRequestBanner";
import { useOrderRealtime } from "@/components/realtime/useOrderRealtime";
import { confirmPayment, getOrder, listOrderEvents, updateOrderStatus } from "@/lib/db/orders";
import { listMyThreads, postMessage } from "@/lib/db/chat";
import { formatPrice, relativeTime } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { orderDisplayStatus } from "@/types/db";
import type { DbOrderStatus, OrderDisplayStatus, OrderEventRow, OrderWithItems } from "@/types/db";
import { cn } from "@/lib/utils";
import { usePick, useT, useLangStore } from "@/i18n";
import { translateOrderNote } from "@/lib/orderEventNote";

const STR = {
  vi: {
    detailTitle: "Chi tiết đơn hàng",
    paymentConfirmed: (code: string) => `Đã xác nhận thanh toán đơn ${code}.`,
    completed: (code: string) => `Đã hoàn thành đơn ${code}.`,
    refunded: (code: string) => `Đã hoàn tiền đơn ${code}.`,
    noStaffThread: "Không tìm thấy kênh chat nội bộ. Hãy nhờ admin mở kênh staff.",
    helpMessage: (code: string, link: string) => `Cần hỗ trợ đơn ${code}: ${link}`,
    helpSent: "Đã gửi yêu cầu hỗ trợ vào kênh nội bộ.",
    loadError: (msg: string) => `Không tải được đơn hàng. ${msg}`,
    retry: "Thử lại",
    notFoundTitle: "Không tìm thấy đơn hàng",
    notFoundBody: "Đơn không tồn tại hoặc bạn không có quyền xem.",
    backToList: "Về danh sách đơn",
    orderList: "Danh sách đơn",
    copyOrderCode: "mã đơn",
    createdPrefix: (time: string) => `Tạo ${time}`,
    paymentLabel: "Thanh toán:",
    refPrefix: (ref: string) => ` · Ref: ${ref}`,
    customer: "Khách hàng",
    inGameName: "Tên in-game",
    copyInGameName: "tên in-game",
    contact: "Liên hệ",
    note: "Ghi chú",
    cancelReason: "Lý do hủy",
    productsTitle: (n: number) => `Sản phẩm (${n})`,
    subtotal: "Tạm tính",
    discount: "Giảm giá",
    total: "Tổng",
    logTitle: "Nhật ký đơn",
    logError: (msg: string) => `Không tải được nhật ký. ${msg}`,
    noEvents: "Chưa có sự kiện nào.",
    actions: "Thao tác",
    paymentRefLabel: "Mã giao dịch / ghi chú (tùy chọn)",
    paymentRefPlaceholder: "VD: FT2607xxxx từ app ngân hàng",
    confirming: "Đang xác nhận...",
    confirmReceived: "Xác nhận đã nhận tiền",
    assignToCtv: "Giao đơn cho CTV",
    markDelivered: "Đã giao hàng",
    sending: "Đang gửi...",
    needHelp: "Cần hỗ trợ",
    refund: "Hoàn tiền",
    cancelOrder: "Hủy đơn...",
    completeTitle: "Hoàn thành đơn",
    refundTitle: "Hoàn tiền đơn",
    completeDescPre: "Xác nhận đơn",
    completeDescPost: "đã giao xong cho khách?",
    refundDescPre: "Đơn",
    refundDescPost: "sẽ chuyển sang “Đã hoàn tiền”. Nhớ chuyển tiền lại cho khách trước nhé.",
    statusNoteLabel: "Ghi chú (tùy chọn)",
    completeNotePlaceholder: "VD: đã giao đủ item, khách xác nhận OK",
    refundNotePlaceholder: "VD: hoàn 100% qua MoMo",
    close: "Đóng",
    processing: "Đang xử lý...",
    complete: "Hoàn thành",
    event: {
      created: "Tạo đơn",
      payment_confirmed: "Xác nhận đã nhận tiền",
      assigned: "Giao đơn cho CTV",
      status_changed: "Đổi trạng thái",
      note: "Ghi chú",
      cancelled: "Hủy đơn",
      refunded: "Hoàn tiền",
    },
  },
  en: {
    detailTitle: "Order details",
    paymentConfirmed: (code: string) => `Payment for order ${code} confirmed.`,
    completed: (code: string) => `Order ${code} completed.`,
    refunded: (code: string) => `Order ${code} refunded.`,
    noStaffThread: "Couldn't find the team chat channel. Ask an admin to open a staff channel.",
    helpMessage: (code: string, link: string) => `Need help with order ${code}: ${link}`,
    helpSent: "Help request sent to the team channel.",
    loadError: (msg: string) => `Couldn't load the order. ${msg}`,
    retry: "Try again",
    notFoundTitle: "Order not found",
    notFoundBody: "The order doesn't exist or you don't have permission to view it.",
    backToList: "Back to orders",
    orderList: "Orders",
    copyOrderCode: "order code",
    createdPrefix: (time: string) => `Created ${time}`,
    paymentLabel: "Payment:",
    refPrefix: (ref: string) => ` · Ref: ${ref}`,
    customer: "Customer",
    inGameName: "In-game name",
    copyInGameName: "in-game name",
    contact: "Contact",
    note: "Note",
    cancelReason: "Cancellation reason",
    productsTitle: (n: number) => `Products (${n})`,
    subtotal: "Subtotal",
    discount: "Discount",
    total: "Total",
    logTitle: "Order log",
    logError: (msg: string) => `Couldn't load the log. ${msg}`,
    noEvents: "No events yet.",
    actions: "Actions",
    paymentRefLabel: "Transaction ID / note (optional)",
    paymentRefPlaceholder: "e.g. FT2607xxxx from the bank app",
    confirming: "Confirming...",
    confirmReceived: "Confirm payment received",
    assignToCtv: "Assign to a collaborator",
    markDelivered: "Mark delivered",
    sending: "Sending...",
    needHelp: "Need help",
    refund: "Refund",
    cancelOrder: "Cancel order...",
    completeTitle: "Complete order",
    refundTitle: "Refund order",
    completeDescPre: "Confirm that order",
    completeDescPost: "has been fully delivered to the customer?",
    refundDescPre: "Order",
    refundDescPost:
      "will move to “Refunded”. Remember to transfer the money back to the customer first.",
    statusNoteLabel: "Note (optional)",
    completeNotePlaceholder: "e.g. delivered all items, customer confirmed OK",
    refundNotePlaceholder: "e.g. refunded 100% via MoMo",
    close: "Close",
    processing: "Processing...",
    complete: "Complete",
    event: {
      created: "Order created",
      payment_confirmed: "Payment confirmed",
      assigned: "Assigned to a collaborator",
      status_changed: "Status changed",
      note: "Note",
      cancelled: "Order cancelled",
      refunded: "Refunded",
    },
  },
};

/** /work/orders/:id — workview 2 cột: chi tiết đơn + điều khiển | chat đơn. */
export function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const t = usePick(STR);

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-3xl font-bold text-text">{t.detailTitle}</h1>
        <SetupNotice />
      </div>
    );
  }

  if (!id || !user) return null;

  return <OrderDetailView orderId={id} role={user.role} userId={user.id} />;
}

function OrderDetailView({
  orderId,
  role,
  userId,
}: {
  orderId: string;
  role: string;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const lang = useLangStore((state) => state.lang);
  const isAdmin = role === "admin";

  const [paymentRef, setPaymentRef] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"complete" | "refund" | null>(null);

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
  });

  const eventsQuery = useQuery({
    queryKey: ["order-events", orderId],
    queryFn: () => listOrderEvents(orderId),
  });

  // Realtime (Agent D): tự cập nhật khi khách yêu cầu hoàn tiền/hủy hoặc xác nhận nhận hàng.
  useOrderRealtime(orderQuery.data?.id);

  const invalidateOrder = () => {
    void queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    void queryClient.invalidateQueries({ queryKey: ["order-events", orderId] });
    void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
  };

  const confirmPaymentMutation = useMutation({
    mutationFn: () => confirmPayment(orderId, paymentRef.trim() || undefined),
    onSuccess: (updated) => {
      invalidateOrder();
      setPaymentRef("");
      toast.success(t.paymentConfirmed(updated.order_code));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: (input: { status: DbOrderStatus; note?: string }) =>
      updateOrderStatus(orderId, input.status, input.note),
    onSuccess: (updated, variables) => {
      invalidateOrder();
      setConfirmAction(null);
      toast.success(
        variables.status === "completed"
          ? t.completed(updated.order_code)
          : t.refunded(updated.order_code),
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const helpMutation = useMutation({
    mutationFn: async (order: OrderWithItems) => {
      const threads = await listMyThreads();
      const staffThread = threads.find((thread) => thread.kind === "staff");
      if (!staffThread) {
        throw new Error(t.noStaffThread);
      }
      const link = `${window.location.origin}/work/orders/${order.id}`;
      return postMessage(staffThread.id, t.helpMessage(order.order_code, link));
    },
    onSuccess: () => toast.success(t.helpSent),
    onError: (err: Error) => toast.error(err.message),
  });

  if (orderQuery.isPending) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
        <Skeleton className="h-[480px] rounded-2xl" />
      </div>
    );
  }

  if (orderQuery.isError) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-text-muted">
          {t.loadError((orderQuery.error as Error).message)}
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => void orderQuery.refetch()}>
          {t.retry}
        </Button>
      </div>
    );
  }

  const order = orderQuery.data;
  if (!order) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
        <p className="font-heading text-lg font-semibold text-text">{t.notFoundTitle}</p>
        <p className="mt-1 text-sm text-text-muted">{t.notFoundBody}</p>
        <Link to="/work/orders" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-yellow hover:text-yellow-hover">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t.backToList}
        </Link>
      </div>
    );
  }

  const isMyCtvOrder = role === "ctv" && order.assigned_ctv === userId;
  const displayStatus = orderDisplayStatus(order);
  const hasPendingCancel =
    order.cancel_requested_at != null &&
    order.status !== "cancelled" &&
    order.status !== "completed";

  return (
    <div className="space-y-6">
      <Link
        to="/work/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.orderList}
      </Link>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* ------------------------------ CỘT TRÁI ------------------------------ */}
        <div className="min-w-0 space-y-5">
          {/* Cảnh báo khách yêu cầu hủy — tạm dừng giao hàng */}
          {hasPendingCancel ? (
            <CancelRequestBanner order={order} isAdmin={isAdmin} />
          ) : null}

          {/* Cảnh báo khách yêu cầu hoàn tiền (tự ẩn nếu không có yêu cầu) */}
          <RefundRequestBanner order={order} />

          {/* Header đơn */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-2xl font-bold text-text">{order.order_code}</h1>
                <CopyButton value={order.order_code} label={t.copyOrderCode} />
                <WorkOrderStatusBadge status={displayStatus} />
              </div>
              <p className="mt-1 text-xs text-text-subtle">
                {t.createdPrefix(relativeTime(order.created_at))} · {t.paymentLabel}{" "}
                {paymentMethodLabel(order.payment_gateway ?? order.payment_method, lang)}
                {order.payment_ref ? t.refPrefix(order.payment_ref) : ""}
              </p>
            </div>
            <p className="tabular-nums-mono text-2xl font-bold text-text">
              {formatPrice(order.total)}
            </p>
          </div>

          {/* Điều khiển theo vai trò/trạng thái */}
          <OrderControls
            order={order}
            displayStatus={displayStatus}
            hasPendingCancel={hasPendingCancel}
            isAdmin={isAdmin}
            isMyCtvOrder={isMyCtvOrder}
            paymentRef={paymentRef}
            onPaymentRefChange={setPaymentRef}
            onConfirmPayment={() => confirmPaymentMutation.mutate()}
            confirmPaymentPending={confirmPaymentMutation.isPending}
            onOpenAssign={() => setAssignOpen(true)}
            onOpenCancel={() => setCancelOpen(true)}
            onOpenDeliver={() => setDeliverOpen(true)}
            onOpenRefund={() => setConfirmAction("refund")}
            onHelp={() => helpMutation.mutate(order)}
            helpPending={helpMutation.isPending}
          />

          {/* Đã giao — chờ khách xác nhận (gallery minh chứng, không có thao tác NV) */}
          {displayStatus === "delivered" ? (
            <DeliveredPanel
              proofImages={order.delivery_proof_images}
              note={order.delivery_note}
              deliveredAt={order.delivered_at}
            />
          ) : null}

          {/* Thẻ khách hàng */}
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-heading text-lg font-semibold text-text">{t.customer}</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <dt className="w-28 shrink-0 text-text-subtle">{t.inGameName}</dt>
                <dd className="flex items-center gap-1 font-medium text-text">
                  {order.game_username ?? "—"}
                  {order.game_username ? (
                    <CopyButton value={order.game_username} label={t.copyInGameName} />
                  ) : null}
                </dd>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <dt className="w-28 shrink-0 text-text-subtle">{t.contact}</dt>
                <dd>
                  <ContactChip channel={order.contact_channel} value={order.contact_value} />
                </dd>
              </div>
              {order.customer_note ? (
                <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                  <dt className="w-28 shrink-0 text-text-subtle">{t.note}</dt>
                  <dd className="min-w-0 flex-1 text-text-muted">{order.customer_note}</dd>
                </div>
              ) : null}
              {order.cancel_reason ? (
                <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                  <dt className="w-28 shrink-0 text-text-subtle">{t.cancelReason}</dt>
                  <dd className="min-w-0 flex-1 text-danger">{order.cancel_reason}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          {/* Dòng hàng */}
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-heading text-lg font-semibold text-text">
              {t.productsTitle(order.items.length)}
            </h2>
            <ul className="mt-3 divide-y divide-border">
              {order.items.map((item) => {
                const optionText = describeSelectedOptions(item.selected_options, lang);
                return (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text">{item.name}</p>
                      <p className="truncate text-xs text-text-subtle">
                        {[item.category_name, optionText].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular-nums-mono text-sm font-semibold text-text">
                        {formatPrice(item.line_total)}
                      </p>
                      <p className="tabular-nums-mono text-xs text-text-subtle">
                        {item.quantity} × {formatPrice(item.unit_price)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>{t.subtotal}</span>
                <span className="tabular-nums-mono">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between text-success">
                  <span>{t.discount}</span>
                  <span className="tabular-nums-mono">-{formatPrice(order.discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-bold text-text">
                <span>{t.total}</span>
                <span className="tabular-nums-mono">{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-heading text-lg font-semibold text-text">{t.logTitle}</h2>
            {eventsQuery.isPending ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : eventsQuery.isError ? (
              <p className="mt-3 text-sm text-text-muted">
                {t.logError((eventsQuery.error as Error).message)}
              </p>
            ) : (eventsQuery.data?.length ?? 0) === 0 ? (
              <p className="mt-3 text-sm text-text-muted">{t.noEvents}</p>
            ) : (
              <ol className="mt-4 space-y-4">
                {eventsQuery.data!.map((event) => (
                  <TimelineItem key={event.id} event={event} />
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* ------------------------------ CỘT PHẢI ------------------------------ */}
        <OrderChatPanel orderId={orderId} className="xl:sticky xl:top-24" />
      </div>

      {/* Dialogs */}
      <AssignCtvDialog
        order={assignOpen ? { id: order.id, order_code: order.order_code } : null}
        onClose={() => setAssignOpen(false)}
      />
      <CancelOrderDialog
        order={cancelOpen ? { id: order.id, order_code: order.order_code } : null}
        onClose={() => setCancelOpen(false)}
      />
      <DeliverDialog
        order={deliverOpen ? { id: order.id, order_code: order.order_code } : null}
        onClose={() => setDeliverOpen(false)}
      />
      <ConfirmStatusDialog
        key={confirmAction ?? "closed"}
        open={confirmAction !== null}
        mode={confirmAction ?? "complete"}
        orderCode={order.order_code}
        pending={statusMutation.isPending}
        onClose={() => setConfirmAction(null)}
        onConfirm={(note) =>
          statusMutation.mutate({
            status: confirmAction === "refund" ? "refunded" : "completed",
            note,
          })
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Điều khiển theo vai trò/trạng thái
// ---------------------------------------------------------------------------

function OrderControls({
  order,
  displayStatus,
  hasPendingCancel,
  isAdmin,
  isMyCtvOrder,
  paymentRef,
  onPaymentRefChange,
  onConfirmPayment,
  confirmPaymentPending,
  onOpenAssign,
  onOpenCancel,
  onOpenDeliver,
  onOpenRefund,
  onHelp,
  helpPending,
}: {
  order: OrderWithItems;
  displayStatus: OrderDisplayStatus;
  hasPendingCancel: boolean;
  isAdmin: boolean;
  isMyCtvOrder: boolean;
  paymentRef: string;
  onPaymentRefChange: (value: string) => void;
  onConfirmPayment: () => void;
  confirmPaymentPending: boolean;
  onOpenAssign: () => void;
  onOpenCancel: () => void;
  onOpenDeliver: () => void;
  onOpenRefund: () => void;
  onHelp: () => void;
  helpPending: boolean;
}) {
  const t = usePick(STR);
  const status = order.status;

  // Giao hàng: chỉ khi đang thực hiện (chưa giao) và KHÔNG có yêu cầu hủy treo.
  const canDeliver =
    displayStatus === "in_progress" && !hasPendingCancel && (isAdmin || isMyCtvOrder);
  const adminConfirmPay = isAdmin && status === "pending_payment";
  const adminAssign = isAdmin && status === "paid";
  const adminRefund = isAdmin && status === "completed";
  const adminCanCancel =
    isAdmin && (status === "pending_payment" || status === "paid" || status === "in_progress");
  // CTV luôn thấy nút hỗ trợ khi đơn đang thực hiện (kể cả lúc đang chờ giao/duyệt hủy).
  const ctvHelp = isMyCtvOrder && status === "in_progress";

  const showSection =
    adminConfirmPay || adminAssign || adminRefund || adminCanCancel || canDeliver || ctvHelp;
  if (!showSection) return null;

  return (
    <section className="rounded-2xl border border-yellow bg-surface p-5 shadow-glow-amber">
      <h2 className="font-heading text-lg font-semibold text-text">{t.actions}</h2>

      {adminConfirmPay ? (
        <div className="mt-3 space-y-3">
          <div>
            <Label htmlFor="payment-ref">{t.paymentRefLabel}</Label>
            <Input
              id="payment-ref"
              value={paymentRef}
              onChange={(event) => onPaymentRefChange(event.target.value)}
              placeholder={t.paymentRefPlaceholder}
              maxLength={200}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={onConfirmPayment} disabled={confirmPaymentPending}>
              <BadgeDollarSign className="h-4 w-4" aria-hidden />
              {confirmPaymentPending ? t.confirming : t.confirmReceived}
            </Button>
          </div>
        </div>
      ) : null}

      {adminAssign ? (
        <div className="mt-3">
          <Button variant="primary" onClick={onOpenAssign}>
            <UserPlus className="h-4 w-4" aria-hidden />
            {t.assignToCtv}
          </Button>
        </div>
      ) : null}

      {/* Đã giao hàng — CTV được giao hoặc admin, khi chưa có yêu cầu hủy */}
      {canDeliver || ctvHelp ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {canDeliver ? (
            <Button variant="primary" onClick={onOpenDeliver}>
              <Truck className="h-4 w-4" aria-hidden />
              {t.markDelivered}
            </Button>
          ) : null}
          {ctvHelp ? (
            <Button variant="secondary" onClick={onHelp} disabled={helpPending}>
              <LifeBuoy className="h-4 w-4" aria-hidden />
              {helpPending ? t.sending : t.needHelp}
            </Button>
          ) : null}
        </div>
      ) : null}

      {adminRefund ? (
        <div className="mt-3">
          <Button variant="secondary" onClick={onOpenRefund}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            {t.refund}
          </Button>
        </div>
      ) : null}

      {adminCanCancel ? (
        <div className="mt-4 border-t border-border pt-3">
          <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={onOpenCancel}>
            <Ban className="h-4 w-4" aria-hidden />
            {t.cancelOrder}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Dialog xác nhận đổi trạng thái (hoàn thành / hoàn tiền) kèm ghi chú tùy chọn
// ---------------------------------------------------------------------------

function ConfirmStatusDialog({
  open,
  mode,
  orderCode,
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  mode: "complete" | "refund";
  orderCode: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: (note?: string) => void;
}) {
  const t = usePick(STR);
  const [note, setNote] = useState("");
  const isComplete = mode === "complete";

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setNote("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isComplete ? t.completeTitle : t.refundTitle}</DialogTitle>
          <DialogDescription>
            {isComplete ? (
              <>
                {t.completeDescPre}{" "}
                <span className="font-mono font-semibold text-text">{orderCode}</span>{" "}
                {t.completeDescPost}
              </>
            ) : (
              <>
                {t.refundDescPre} <span className="font-mono font-semibold text-text">{orderCode}</span>{" "}
                {t.refundDescPost}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div>
          <Label htmlFor="status-note">{t.statusNoteLabel}</Label>
          <Input
            id="status-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={isComplete ? t.completeNotePlaceholder : t.refundNotePlaceholder}
            maxLength={300}
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            {t.close}
          </Button>
          <Button
            variant={isComplete ? "gold" : "primary"}
            disabled={pending}
            onClick={() => onConfirm(note.trim() || undefined)}
          >
            {isComplete ? (
              <BadgeCheck className="h-4 w-4" aria-hidden />
            ) : (
              <RotateCcw className="h-4 w-4" aria-hidden />
            )}
            {pending ? t.processing : isComplete ? t.complete : t.refund}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

const EVENT_ICON: Record<OrderEventRow["event_type"], LucideIcon> = {
  created: PlusCircle,
  payment_confirmed: BadgeDollarSign,
  assigned: UserCheck,
  status_changed: RefreshCw,
  note: StickyNote,
  cancelled: Ban,
  refunded: RotateCcw,
};

function TimelineItem({ event }: { event: OrderEventRow }) {
  const t = usePick(STR);
  const s = useT();
  const lang = useLangStore((st) => st.lang);
  const Icon = EVENT_ICON[event.event_type];
  const note = translateOrderNote(event.note, lang);

  // Nếu meta.to là trạng thái hợp lệ, hiện nhãn của trạng thái đích (theo ngôn ngữ).
  const toStatus =
    event.meta && typeof event.meta.to === "string" && event.meta.to in WORK_STATUS_META
      ? s.status[event.meta.to as DbOrderStatus]
      : null;

  return (
    <li className="flex gap-3">
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          event.event_type === "cancelled"
            ? "bg-danger-soft text-danger"
            : "bg-yellow-soft text-yellow",
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">
          {t.event[event.event_type]}
          {toStatus ? <span className="font-normal text-text-muted"> → {toStatus}</span> : null}
        </p>
        {note ? <p className="mt-0.5 text-sm text-text-muted">{note}</p> : null}
        <p className="mt-0.5 text-xs text-text-subtle">{relativeTime(event.created_at)}</p>
      </div>
    </li>
  );
}
