import { useParams } from "react-router-dom";
import { Receipt } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { RequireAuth } from "@/components/account/RequireAuth";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * /orders/:id — trang theo dõi đơn cho KHÁCH: timeline trạng thái từ
 * order_events, khối hướng dẫn chuyển khoản khi chờ thanh toán, chat với
 * CTV/admin ngay trong trang. Phase 2 (nhóm 2A) thay ruột bằng dữ liệu từ
 * src/lib/db/orders.ts (getOrder, listOrderEvents) + chat.ts.
 */
export function OrderDetail() {
  return (
    <RequireAuth>
      <OrderDetailContent />
    </RequireAuth>
  );
}

function OrderDetailContent() {
  const { id } = useParams<{ id: string }>();

  return (
    <PageContainer className="py-10 sm:py-14">
      <h1 className="font-heading text-3xl font-bold text-text">Theo dõi đơn hàng</h1>
      <p className="mt-2 text-sm text-text-muted">Mã đơn: {id}</p>
      <div className="mt-8 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-text-subtle">
          <Receipt className="h-6 w-6" aria-hidden />
        </div>
        <p className="mt-4 font-heading text-lg font-semibold text-text">Phase 2 đang xây dựng</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
          Timeline trạng thái, hướng dẫn thanh toán và chat với người xử lý đơn sẽ nằm ở đây.
        </p>
      </div>
      {!isSupabaseConfigured ? (
        <div className="mt-6">
          <SetupNotice />
        </div>
      ) : null}
    </PageContainer>
  );
}
