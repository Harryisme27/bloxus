import { Link } from "react-router-dom";
import { AlertTriangle, Gamepad2, ShieldCheck, ShoppingCart } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";

export function PaymentCancelled() {
  return (
    <PageContainer className="py-16 sm:py-20">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-warning bg-surface text-warning">
          <AlertTriangle className="h-10 w-10" aria-hidden="true" />
        </div>

        <h1 className="font-heading text-3xl font-bold text-text sm:text-4xl">Đơn đã huỷ</h1>
        <p className="mt-3 max-w-md text-text-muted">
          Bạn đã huỷ quá trình thanh toán.{" "}
          <span className="font-semibold text-text">Bạn chưa bị trừ tiền</span> và giỏ hàng của bạn
          vẫn còn nguyên — có thể quay lại hoàn tất bất cứ lúc nào.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-4 py-1.5 text-sm text-success">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Không có khoản phí nào được thực hiện
        </div>

        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link to="/cart" className="w-full sm:w-auto">
            <Button size="lg" className="w-full">
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              Quay lại giỏ hàng
            </Button>
          </Link>
          <Link to="/games" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full">
              <Gamepad2 className="h-4 w-4" aria-hidden="true" />
              Tiếp tục xem
            </Button>
          </Link>
        </div>

        <p className="mt-8 max-w-md text-xs text-text-subtle">
          Đây là cửa hàng demo — mọi giao dịch đều được mô phỏng, không có thanh toán thật.
        </p>
      </div>
    </PageContainer>
  );
}
