import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChatWidget } from "@/components/ChatWidget";
import { RecentDeliveryToast } from "@/components/RecentDeliveryToast";
import { useCurrencyStore } from "@/store/currencyStore";
import { useLangStore } from "@/i18n";

/** Shared shell for every route: sticky navbar, page outlet, footer, and the
 * floating chat widget. sonner's <Toaster/> is mounted once in main.tsx
 * (app root) rather than here, to avoid rendering two <Toaster/> instances
 * at once — sonner would otherwise show every toast twice.
 *
 * Mọi trang có hiệu ứng vào mượt như trang chủ: bọc <Outlet/> trong .um-page và
 * key theo pathname để animation chạy lại mỗi lần chuyển route. */
export function RootLayout() {
  const { pathname } = useLocation();
  // Subscribe tiền tệ ở gốc: đổi USD/VND -> re-render toàn cây (kể cả dialog qua
  // portal vẫn nằm trong cây React) nên mọi formatPrice() cập nhật ngay.
  const currency = useCurrencyStore((s) => s.currency);

  const lang = useLangStore((s) => s.lang);
  useEffect(() => {
    if (currency !== "usd") useCurrencyStore.getState().setCurrency("usd");
    if (lang !== "en") useLangStore.getState().setLang("en");
  }, [currency, lang]);

  // Cho trình duyệt + trình đọc màn hình biết trang đang dùng ngôn ngữ nào.
  useEffect(() => {
    document.documentElement.lang = "en";
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <Navbar />
      <main className="flex-1">
        <div key={pathname} className="um-page">
          <Outlet />
        </div>
      </main>
      <Footer />
      <ChatWidget />
      <RecentDeliveryToast />
    </div>
  );
}
