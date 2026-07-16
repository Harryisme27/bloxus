import { Link } from "react-router-dom";
import { Headset, RotateCcw, ShoppingCart, XCircle } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";

export function PaymentFailed() {
  return (
    <PageContainer className="py-16 sm:py-20">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-danger bg-danger-soft text-danger">
          <XCircle className="h-10 w-10" aria-hidden="true" />
        </div>

        <h1 className="font-heading text-3xl font-bold text-text sm:text-4xl">
          Thanh toán thất bại
        </h1>
        <p className="mt-3 max-w-md text-text-muted">
          Rất tiếc, giao dịch của bạn chưa được hoàn tất. Đừng lo — bạn chưa bị trừ tiền và giỏ hàng
          vẫn được giữ nguyên. Bạn có thể thử lại ngay hoặc dùng phương thức thanh toán khác.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link to="/checkout" className="w-full sm:w-auto">
            <Button size="lg" className="w-full">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Thử lại
            </Button>
          </Link>
          <Link to="/cart" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full">
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              Về giỏ hàng
            </Button>
          </Link>
        </div>

        <div className="mt-8 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-muted">
          <Headset className="h-4 w-4 text-green" aria-hidden="true" />
          <span>
            Vẫn gặp lỗi?{" "}
            <Link to="/messages" className="font-semibold text-yellow hover:underline">
              Liên hệ đội hỗ trợ
            </Link>
          </span>
        </div>

        <p className="mt-6 max-w-md text-xs text-text-subtle">
          Đây là cửa hàng demo — kết quả thanh toán được mô phỏng. Bạn có thể đổi kịch bản (thành công
          / thất bại / huỷ) tại trang{" "}
          <Link to="/admin" className="font-medium text-text-muted hover:text-yellow">
            /admin
          </Link>
          .
        </p>
      </div>
    </PageContainer>
  );
}
