import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Copy,
  Landmark,
  ReceiptText,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/PageContainer";
import { RequireAuth } from "@/components/account/RequireAuth";
import { SetupNotice } from "@/components/SetupNotice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderChatPanel } from "@/components/chat/OrderChatPanel";
import { WorkOrderStatusBadge } from "@/components/work/orderStatusMeta";
import { getOrder, listOrderEvents, cancelOrder } from "@/lib/db/orders";
import { getSettings } from "@/lib/db/settings";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatPrice, relativeTime } from "@/lib/format";
import type { OrderEventType } from "@/types/db";

export function OrderDetail() {
  return (
    <RequireAuth>
      <OrderDetailContent />
    </RequireAuth>
  );
}

const EVENT_LABEL: Record<OrderEventType, string> = {
  created: "Đã tạo đơn",
  payment_confirmed: "Đã xác nhận thanh toán",
  assigned: "Đã giao cho người xử lý",
  status_changed: "Cập nhật trạng thái",
  note: "Ghi chú",
  cancelled: "Đã hủy đơn",
  refunded: "Đã hoàn tiền",
};

function OrderDetailContent() {
  const { id = "" } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

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

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => cancelOrder(id, reason),
    onSuccess: () => {
      toast.success("Đã hủy đơn hàng.");
      void queryClient.invalidateQueries({ queryKey: ["order", id] });
      void queryClient.invalidateQueries({ queryKey: ["order-events", id] });
      void queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Không hủy được đơn."),
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
        <h1 className="font-heading text-2xl font-bold text-text">Không tìm thấy đơn hàng</h1>
        <p className="mt-2 text-text-muted">Đơn này không tồn tại hoặc bạn không có quyền xem.</p>
        <Link to="/orders" className="mt-6 inline-block">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Về danh sách đơn
          </Button>
        </Link>
      </PageContainer>
    );
  }

  const settings = settingsQuery.data ?? {};
  const asText = (v: unknown) => (typeof v === "string" ? v : "");
  const isPending = order.status === "pending_payment";

  function copy(text: string, label: string) {
    void navigator.clipboard?.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  }

  return (
    <PageContainer className="py-10 sm:py-14">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-yellow"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Danh sách đơn hàng
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="tabular-nums-mono font-heading text-2xl font-extrabold text-text sm:text-3xl">
            {order.order_code}
          </h1>
          <WorkOrderStatusBadge status={order.status} />
        </div>
        <span className="tabular-nums-mono font-heading text-xl font-bold text-yellow">
          {formatPrice(order.total)}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* LEFT */}
        <div className="space-y-6">
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
                  Hướng dẫn thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-sm">
                <p className="text-text-muted">
                  Chuyển đúng số tiền và ghi <b className="text-text">mã đơn</b> vào nội dung. Shop sẽ
                  xác nhận và bắt đầu xử lý ngay khi nhận được tiền.
                </p>
                {order.payment_method === "momo" ? (
                  <>
                    <PayRow label="Số Momo" value={asText(settings.momo_number)} onCopy={copy} />
                    {asText(settings.momo_qr_url) ? (
                      <img
                        src={asText(settings.momo_qr_url)}
                        alt="QR Momo"
                        className="h-44 w-44 rounded-lg border border-border object-contain"
                      />
                    ) : null}
                  </>
                ) : (
                  <>
                    <PayRow label="Ngân hàng" value={asText(settings.bank_name)} onCopy={copy} />
                    <PayRow label="Số tài khoản" value={asText(settings.bank_account)} onCopy={copy} />
                    <PayRow label="Chủ tài khoản" value={asText(settings.bank_holder)} onCopy={copy} />
                  </>
                )}
                <PayRow label="Số tiền" value={formatPrice(order.total)} onCopy={copy} highlight />
                <PayRow
                  label="Nội dung chuyển khoản"
                  value={order.order_code}
                  onCopy={copy}
                  highlight
                />
                {!asText(settings.bank_account) && order.payment_method === "bank_transfer" ? (
                  <p className="text-xs text-warning">
                    Shop chưa cấu hình thông tin ngân hàng — vui lòng liên hệ qua khung chat bên phải.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Items */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptText className="h-4 w-4 text-yellow" aria-hidden /> Chi tiết đơn
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
                <span className="font-heading text-sm font-semibold text-text">Tổng cộng</span>
                <span className="tabular-nums-mono font-heading text-lg font-bold text-yellow">
                  {formatPrice(order.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base">Tiến trình đơn hàng</CardTitle>
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
                          {EVENT_LABEL[ev.event_type]}
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

          {isPending ? (
            <Button
              variant="secondary"
              onClick={() => {
                if (window.confirm("Hủy đơn hàng này?")) cancelMutation.mutate("Khách tự hủy");
              }}
              disabled={cancelMutation.isPending}
              className="text-danger hover:border-danger"
            >
              <XCircle className="h-4 w-4" aria-hidden /> Hủy đơn hàng
            </Button>
          ) : null}
        </div>

        {/* RIGHT: chat */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderChatPanel orderId={order.id} className="h-[32rem]" />
        </div>
      </div>
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
          aria-label={`Sao chép ${label}`}
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
