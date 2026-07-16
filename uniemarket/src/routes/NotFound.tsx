import { Link } from "react-router-dom";
import { Home, Store, Compass } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { buttonVariants } from "@/components/ui/button";

export function NotFound() {
  return (
    <PageContainer className="flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <div className="relative">
        <div
          aria-hidden
          style={{ backgroundColor: "rgba(245, 176, 30, 0.14)" }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        />
        <div className="relative">
          <img
            src="/logo-unie.png"
            alt=""
            aria-hidden="true"
            className="h-32 w-auto drop-shadow-[0_12px_40px_rgba(245,176,30,0.25)]"
          />
        </div>
      </div>

      <p className="tabular-nums-mono mt-8 text-6xl font-extrabold tracking-tight text-yellow sm:text-7xl">
        404
      </p>
      <h1 className="mt-3 font-heading text-3xl font-bold text-text sm:text-4xl">
        Lạc mất vật phẩm rồi!
      </h1>
      <p className="mt-3 max-w-md text-text-muted">
        Trang bạn tìm không tồn tại hoặc đã được chuyển đi nơi khác. Đừng lo — kho vật phẩm của
        chúng tôi vẫn luôn mở cửa.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/" className={buttonVariants({ variant: "primary", size: "lg" })}>
          <Home className="h-4 w-4" aria-hidden />
          Về trang chủ
        </Link>
        <Link to="/games" className={buttonVariants({ variant: "secondary", size: "lg" })}>
          <Store className="h-4 w-4" aria-hidden />
          Xem cửa hàng
        </Link>
      </div>

      <p className="mt-8 flex items-center gap-2 text-sm text-text-subtle">
        <Compass className="h-4 w-4" aria-hidden />
        Hoặc thử tìm game yêu thích của bạn ở trang cửa hàng.
      </p>
    </PageContainer>
  );
}
