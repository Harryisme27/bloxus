// Thanh menu kiểu bloxmart: logo + chữ BLOXUS | nhóm menu dạng viên thuốc (Select
// games ▾, Proofs LIVE, FAQ, Discord) | ngôn ngữ, giỏ, Sign in, Sign up now.
// Đã đăng nhập thì thay Sign in/Sign up bằng chat, chuông, menu hồ sơ.
// Theo độ rộng (đo thực tế cả tiếng Anh + tiếng Việt, cả khi đã đăng nhập):
//   lg  (>=1024): Select games, Proofs, Sign up now + menu ba gạch
//   xl  (>=1280): + Discord, Sign in
//   >=1440     : + Hỏi đáp, tên cạnh avatar; ẩn menu ba gạch
// Nút Work area + đổi tiền tệ của staff nằm trong menu hồ sơ cho gọn.
import { useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  ShoppingCart,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { ChatIconLink } from "@/components/nav/ChatIconLink";
import { NotificationBell } from "@/components/nav/NotificationBell";
import { ProfileMenu } from "@/components/nav/ProfileMenu";
import { GamesMenu, navPillItemClass } from "@/components/nav/GamesMenu";
import { useHeartbeat } from "@/components/realtime/useHeartbeat";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useT, usePick } from "@/i18n";
import { cn } from "@/lib/utils";

const STR = {
  vi: {
    homeAria: "Bloxus - Trang chủ",
    closeMenu: "Đóng menu",
    openMenu: "Mở menu",
    notifications: "Thông báo",
    currencyLabel: "Tiền tệ",
    faqShort: "Hỏi đáp",
    discord: "Discord",
    live: "Live",
    signIn: "Đăng nhập",
    signUpNow: "Đăng ký ngay",
  },
  en: {
    homeAria: "Bloxus - Home",
    closeMenu: "Close menu",
    openMenu: "Open menu",
    notifications: "Notifications",
    currencyLabel: "Currency",
    faqShort: "FAQ",
    discord: "Discord",
    live: "Live",
    signIn: "Sign in",
    signUpNow: "Sign up now",
  },
};

const iconBtn =
  "relative flex h-11 w-11 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow";

function LiveBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border-strong bg-green-soft px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-green">
      <span className="h-1 w-1 animate-pulse rounded-full bg-green" aria-hidden />
      {label}
    </span>
  );
}

export function Navbar() {
  const s = useT();
  const t = usePick(STR);
  const [showSecondaryNav, setShowSecondaryNav] = useState(false);
  const navRowRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const searchSlotRef = useRef<HTMLDivElement>(null);
  const cartCount = useCartStore((state) => state.items.reduce((sum, line) => sum + line.quantity, 0));
  const user = useAuthStore((state) => state.user);

  // Keep last_seen fresh while the app is open (Agent D owns the hook impl).
  useHeartbeat();

  // Browser zoom changes the CSS viewport width. Measure the real gap instead
  // of guessing with a fixed breakpoint, so the secondary links only disappear
  // when they would get too close to the centred search field.
  useLayoutEffect(() => {
    const updateSecondaryNav = () => {
      const logoRect = logoRef.current?.getBoundingClientRect();
      const searchRect = searchSlotRef.current?.getBoundingClientRect();
      if (!logoRect || !searchRect || searchRect.width === 0) {
        setShowSecondaryNav(false);
        return;
      }

      setShowSecondaryNav(searchRect.left - logoRect.right >= 240);
    };

    updateSecondaryNav();
    const observer = new ResizeObserver(updateSecondaryNav);
    if (navRowRef.current) observer.observe(navRowRef.current);
    if (logoRef.current) observer.observe(logoRef.current);
    if (searchSlotRef.current) observer.observe(searchSlotRef.current);
    window.addEventListener("resize", updateSecondaryNav);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSecondaryNav);
    };
  }, []);

  const pillLink = ({ isActive }: { isActive: boolean }) => cn(navPillItemClass, isActive && "text-text");

  return (
    <header
      ref={navRowRef}
      className="sticky top-0 z-40 border-b border-border backdrop-blur-md"
      style={{ backgroundColor: "rgba(10, 17, 11, 0.85)" }}
    >
      <PageContainer className="relative grid h-[72px] max-w-none grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-2 min-[430px]:px-4 sm:px-5 lg:px-6 2xl:px-8">
        <div className="flex min-w-0 items-center gap-5 justify-self-start 2xl:gap-6">
          <Link ref={logoRef} to="/" className="group flex shrink-0 items-center gap-3" aria-label={t.homeAria}>
            <img src="/logo-bloxus.png?v=2" alt="" className="h-10 w-10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105 min-[430px]:h-12 min-[430px]:w-12" />
            {/* Chữ giống logo: BLOX trắng, US vàng chanh. */}
            <span aria-hidden className="hidden font-heading text-[28px] font-extrabold uppercase leading-none tracking-[0.025em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] min-[430px]:block">
              <span className="inline-block bg-gradient-to-b from-white via-[#f4f7ea] to-[#b8d6a6] bg-clip-text text-transparent transition-transform duration-300 group-hover:-translate-y-0.5">
                Blox
              </span>
              <span className="relative ml-0.5 inline-block -rotate-2 text-lemon drop-shadow-[0_2px_8px_rgba(250,214,86,0.22)] transition-transform duration-300 group-hover:rotate-2 group-hover:scale-110">
                us
                <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-green shadow-[0_0_8px_rgba(124,195,90,0.85)]" />
              </span>
            </span>
          </Link>

          {/* Các liên kết phụ giữ gọn bên logo; ô tìm game nằm chính giữa navbar. */}
          <nav className={cn("h-9 items-center gap-0.5 rounded-full border border-border bg-surface px-1", showSecondaryNav ? "flex" : "hidden")}>
            <NavLink to="/proofs" className={pillLink}>
              <ShieldCheck className="h-3.5 w-3.5 text-green" aria-hidden />
              {s.nav.proofs}
              <LiveBadge label={t.live} />
            </NavLink>
            <NavLink to="/faq" className={({ isActive }) => cn(pillLink({ isActive }), "hidden min-[1440px]:inline-flex")}>
              <HelpCircle className="h-3.5 w-3.5 text-text-muted" aria-hidden />
              {t.faqShort}
            </NavLink>
          </nav>
        </div>

        <div ref={searchSlotRef} className="hidden justify-self-center min-[1100px]:block">
          <GamesMenu />
        </div>

        <div className="flex min-w-0 items-center gap-1 justify-self-end min-[430px]:gap-2">
          {/* Chrome for logged-in users: chat, bell, cart, profile. */}
          {user ? <ChatIconLink /> : null}
          {user ? <NotificationBell /> : null}

          <Link to="/cart" className={iconBtn} aria-label={s.nav.cart}>
            <ShoppingCart className="h-[22px] w-[22px]" aria-hidden="true" />
            {cartCount > 0 ? (
              <span className="tabular-nums-mono absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow px-1 text-[11px] font-bold text-text-on-yellow">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>

          {user ? (
            <div className="hidden sm:block">
              <ProfileMenu />
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden whitespace-nowrap rounded-lg px-3 py-2 font-heading text-[13px] font-extrabold uppercase tracking-[0.08em] text-text transition-colors hover:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow xl:inline-flex"
              >
                {t.signIn}
              </Link>
              <Link
                to="/register"
                className="hidden h-11 items-center whitespace-nowrap rounded-xl bg-text px-5 font-heading text-[13px] font-extrabold uppercase tracking-[0.08em] text-bg transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:inline-flex"
              >
                {t.signUpNow}
              </Link>
            </>
          )}
        </div>
      </PageContainer>
    </header>
  );
}
