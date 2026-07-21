import { isStaffRole } from "@/lib/roles";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChatWidget } from "@/components/ChatWidget";
import { useCurrencyStore } from "@/store/currencyStore";
import { useLangStore } from "@/i18n";
import { useAuthStore } from "@/store/authStore";

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

  // Khách (guest/customer) chỉ dùng EN + USD — VI/VND là đặc quyền của staff.
  // Chờ auth load xong mới ép, để không ghi đè lựa chọn của admin/Seller lúc refresh.
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const lang = useLangStore((s) => s.lang);
  const isStaff = isStaffRole(user?.role);
  useEffect(() => {
    if (authLoading || isStaff) return;
    if (lang !== "en") useLangStore.getState().setLang("en");
    if (currency !== "usd") useCurrencyStore.getState().setCurrency("usd");
  }, [authLoading, isStaff, lang, currency]);

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
    </div>
  );
}
