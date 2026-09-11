import { Link } from "react-router-dom";
import { Home, Store, Compass } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { buttonVariants } from "@/components/ui/button";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    title: "Lạc mất vật phẩm rồi!",
    body: "Trang bạn tìm không tồn tại hoặc đã được chuyển đi nơi khác. Đừng lo — kho vật phẩm của chúng tôi vẫn luôn mở cửa.",
    home: "Về trang chủ",
    store: "Xem cửa hàng",
    hint: "Hoặc thử tìm game yêu thích của bạn ở trang cửa hàng.",
  },
  en: {
    title: "This item got lost!",
    body: "The page you're looking for doesn't exist or has moved. Don't worry — our item store is always open.",
    home: "Back to home",
    store: "Browse the store",
    hint: "Or try finding your favorite game over in the store.",
  },
};

export function NotFound() {
  const t = usePick(STR);
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
            src="/logo-bloxus.png?v=2"
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
        {t.title}
      </h1>
      <p className="mt-3 max-w-md text-text-muted">
        {t.body}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/" className={buttonVariants({ variant: "primary", size: "lg" })}>
          <Home className="h-4 w-4" aria-hidden />
          {t.home}
        </Link>
        <Link to="/games" className={buttonVariants({ variant: "secondary", size: "lg" })}>
          <Store className="h-4 w-4" aria-hidden />
          {t.store}
        </Link>
      </div>

      <p className="mt-8 flex items-center gap-2 text-sm text-text-subtle">
        <Compass className="h-4 w-4" aria-hidden />
        {t.hint}
      </p>
    </PageContainer>
  );
}
