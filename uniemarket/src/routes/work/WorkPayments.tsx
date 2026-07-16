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

/** /work/payments (admin) — hàng đợi đối chiếu chuyển khoản theo mã đơn. */
export function WorkPayments() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold text-text">Xác nhận thanh toán</h1>
        <p className="mt-1 text-sm text-text-muted">
          Đối chiếu chuyển khoản theo mã đơn (nội dung CK) rồi bấm xác nhận — đơn cũ nhất lên đầu.
        </p>
      </header>

      {!isSupabaseConfigured ? (
        <SetupNotice />
      ) : user && user.role !== "admin" ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-text-subtle" aria-hidden />
          <p className="mt-3 font-heading text-lg font-semibold text-text">Chỉ admin</p>
          <p className="mt-1 text-sm text-text-muted">
            Trang xác nhận thanh toán chỉ dành cho quản trị viên.
          </p>
        </div>
      ) : user ? (
        <PaymentsQueue />
      ) : null}
    </div>
  );
}

function PaymentsQueue() {
  useOrdersRealtime();

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
          Không tải được hàng đợi. {(ordersQuery.error as Error).message}
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => void ordersQuery.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  // Cũ nhất lên đầu — khách chờ lâu nhất được xử lý trước.
  const queue = [...ordersQuery.data].sort((a, b) => a.created_at.localeCompare(b.created_at));

  if (queue.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-12 text-center">
        <p className="font-heading text-xl font-semibold text-text">
          Không có đơn nào chờ xác nhận 🎉
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Khi khách đặt đơn mới, thẻ đối chiếu sẽ hiện ở đây (realtime).
        </p>
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

  const confirmMutation = useMutation({
    mutationFn: () => confirmPayment(order.id, ref.trim() || undefined),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["order", updated.id] });
      void queryClient.invalidateQueries({ queryKey: ["order-events", updated.id] });
      toast.success(`Đã xác nhận thanh toán đơn ${updated.order_code}.`);
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
            Nội dung CK
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-3xl font-bold tracking-wide text-yellow">
              {order.order_code}
            </span>
            <CopyButton value={order.order_code} label="mã đơn" className="h-7 w-7" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <MethodIcon className="h-4 w-4 text-text-subtle" aria-hidden />
              {paymentMethodLabel(order.payment_method)}
            </span>
            <span>·</span>
            <span>Tạo {relativeTime(order.created_at)}</span>
            <ContactChip channel={order.contact_channel} value={order.contact_value} />
          </div>
        </div>

        {/* Số tiền cần khớp */}
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
            Số tiền cần khớp
          </p>
          <p className="tabular-nums-mono mt-1 text-3xl font-bold text-text">
            {formatPrice(order.total)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4">
        <div className="w-full max-w-sm flex-1">
          <Label htmlFor={`ref-${order.id}`}>Mã giao dịch / ghi chú (tùy chọn)</Label>
          <Input
            id={`ref-${order.id}`}
            value={ref}
            onChange={(event) => setRef(event.target.value)}
            placeholder="VD: FT2607xxxx"
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
            {confirmMutation.isPending ? "Đang xác nhận..." : "Xác nhận đã nhận tiền"}
          </Button>
          <Button variant="secondary" onClick={() => setCancelOpen(true)}>
            <Ban className="h-4 w-4" aria-hidden />
            Hủy đơn
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
