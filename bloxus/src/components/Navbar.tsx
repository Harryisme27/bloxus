// Thanh menu kiểu bloxmart: logo + chữ BLOXUS | nhóm menu dạng viên thuốc (Select
// games ▾, Proofs LIVE, Tutorial, FAQ, Discord) | ngôn ngữ, giỏ, Sign in, Sign up now.
// Đã đăng nhập thì thay Sign in/Sign up bằng chat, chuông, menu hồ sơ.
// Theo độ rộng (đo thực tế cả tiếng Anh + tiếng Việt, cả khi đã đăng nhập):
//   lg  (>=1024): Select games, Proofs, Sign up now + menu ba gạch
//   xl  (>=1280): + Discord, Sign in
//   >=1440     : + Tutorial, Hỏi đáp, tên cạnh avatar; ẩn menu ba gạch
// Nút Work area + đổi tiền tệ của staff nằm trong menu hồ sơ cho gọn.
import { isStaffRole } from "@/lib/roles";
import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Menu,
  X,
  Briefcase,
  MessageCircle,
  Bell,
  LogOut,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Gamepad2,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { ChatIconLink } from "@/components/nav/ChatIconLink";
import { LanguageMenu } from "@/components/nav/LanguageMenu";
import { NotificationBell } from "@/components/nav/NotificationBell";
import { ProfileMenu } from "@/components/nav/ProfileMenu";
import { GamesMenu, navPillItemClass } from "@/components/nav/GamesMenu";
import { DiscordIcon } from "@/components/account/SocialLoginButtons";
import { useUnreadCount } from "@/components/nav/useUnreadCount";
import { useHeartbeat } from "@/components/realtime/useHeartbeat";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { DISCORD_URL } from "@/lib/constants";
import { useT, usePick } from "@/i18n";
import { cn } from "@/lib/utils";

const STR = {
  vi: {
    homeAria: "Bloxus - Trang chủ",
    closeMenu: "Đóng menu",
    openMenu: "Mở menu",
    notifications: "Thông báo",
    currencyLabel: "Tiền tệ",
    tutorial: "Hướng dẫn",
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
    tutorial: "Tutorial",
    faqShort: "FAQ",
    discord: "Discord",
    live: "Live",
    signIn: "Sign in",
    signUpNow: "Sign up now",
  },
};

const iconBtn =
  "relative flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow";

function LiveBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border-strong bg-green-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green" aria-hidden />
      {label}
    </span>
  );
}

export function Navbar() {
  const s = useT();
  const t = usePick(STR);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartCount = useCartStore((state) => state.items.reduce((sum, line) => sum + line.quantity, 0));
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isStaff = isStaffRole(user?.role);
  const unread = useUnreadCount();

  // Keep last_seen fresh while the app is open (Agent D owns the hook impl).
  useHeartbeat();

  // Đổi trang -> đóng menu mobile.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const mobileLinks: { to: string; label: string; icon: ReactNode; live?: boolean }[] = [
    { to: "/games", label: s.nav.games, icon: <Gamepad2 className="h-4 w-4 text-yellow" aria-hidden /> },
    { to: "/proofs", label: s.nav.proofs, icon: <ShieldCheck className="h-4 w-4 text-green" aria-hidden />, live: true },
    { to: "/tutorial", label: t.tutorial, icon: <BookOpen className="h-4 w-4 text-lemon" aria-hidden /> },
    { to: "/faq", label: s.nav.faq, icon: <HelpCircle className="h-4 w-4 text-text-muted" aria-hidden /> },
  ];

  const pillLink = ({ isActive }: { isActive: boolean }) => cn(navPillItemClass, isActive && "text-text");

  async function handleMobileLogout() {
    setMobileOpen(false);
    await logout();
    navigate("/");
  }

  return (
    <header
      className="sticky top-0 z-40 border-b border-border backdrop-blur-md"
      style={{ backgroundColor: "rgba(10, 17, 11, 0.85)" }}
    >
      <PageContainer className="flex h-16 max-w-[1600px] items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label={t.homeAria}>
            <img src="/logo-bloxus.png?v=2" alt="" className="h-10 w-10" />
            {/* Chữ giống logo: BLOX trắng, US vàng chanh. */}
            <span aria-hidden className="font-heading text-xl font-extrabold uppercase leading-none tracking-tight text-text">
              Blox<span className="text-lemon">us</span>
            </span>
          </Link>

          {/* Nhóm menu dạng viên thuốc */}
          <nav className="hidden items-center gap-0.5 rounded-full border border-border bg-surface p-1 lg:flex">
            <GamesMenu />
            <NavLink to="/proofs" className={pillLink}>
              <ShieldCheck className="h-4 w-4 text-green" aria-hidden />
              {s.nav.proofs}
              <LiveBadge label={t.live} />
            </NavLink>
            <NavLink to="/tutorial" className={({ isActive }) => cn(pillLink({ isActive }), "hidden min-[1440px]:inline-flex")}>
              <BookOpen className="h-4 w-4 text-lemon" aria-hidden />
              {t.tutorial}
            </NavLink>
            <NavLink to="/faq" className={({ isActive }) => cn(pillLink({ isActive }), "hidden min-[1440px]:inline-flex")}>
              <HelpCircle className="h-4 w-4 text-text-muted" aria-hidden />
              {t.faqShort}
            </NavLink>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className={cn(navPillItemClass, "hidden xl:inline-flex")}>
              <DiscordIcon className="h-4 w-4" />
              {t.discord}
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Chọn ngôn ngữ (mọi người đều dùng được). */}
          <LanguageMenu />

          {/* Chrome for logged-in users: chat, bell, cart, profile. */}
          {user ? <ChatIconLink /> : null}
          {user ? <NotificationBell /> : null}

          <Link to="/cart" className={iconBtn} aria-label={s.nav.cart}>
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
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


          <button
            type="button"
            className={cn(iconBtn, "min-[1440px]:hidden")}
            aria-label={mobileOpen ? t.closeMenu : t.openMenu}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </PageContainer>

      {mobileOpen ? (
        <div className="border-t border-border bg-surface min-[1440px]:hidden">
          <PageContainer className="flex flex-col gap-1 py-3">
            {mobileLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-2 hover:text-text",
                    isActive && "bg-surface-2 text-text",
                  )
                }
              >
                {link.icon}
                {link.label}
                {link.live ? <LiveBadge label={t.live} /> : null}
              </NavLink>
            ))}
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <DiscordIcon className="h-4 w-4" />
              {t.discord}
            </a>

            {user ? (
              <>
                <NavLink
                  to="/messages"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-2 hover:text-text",
                      isActive && "bg-surface-2 text-text",
                    )
                  }
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {s.nav.messages}
                </NavLink>

                {/* Compact notifications entry — jumps to the order chat surface. */}
                <Link
                  to="/messages"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
                >
                  <span className="flex items-center gap-2.5">
                    <Bell className="h-4 w-4" aria-hidden="true" />
                    {t.notifications}
                  </span>
                  {unread > 0 ? (
                    <span className="tabular-nums-mono flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow px-1 text-[11px] font-bold text-text-on-yellow">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  ) : null}
                </Link>
              </>
            ) : null}

            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {isStaff ? (
                <Link to="/work" onClick={() => setMobileOpen(false)}>
                  <Button variant="gold" size="sm" className="w-full">
                    <Briefcase className="h-4 w-4" aria-hidden="true" />
                    {s.nav.work}
                  </Button>
                </Link>
              ) : null}
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">
                      {user.display_name ?? user.username}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-danger"
                    onClick={handleMobileLogout}
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    {s.nav.logout}
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-11 items-center justify-center rounded-xl border border-border-strong font-heading text-[13px] font-extrabold uppercase tracking-[0.08em] text-text transition-colors hover:bg-surface-2"
                  >
                    {t.signIn}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-11 items-center justify-center rounded-xl bg-text font-heading text-[13px] font-extrabold uppercase tracking-[0.08em] text-bg transition-colors hover:bg-white"
                  >
                    {t.signUpNow}
                  </Link>
                </div>
              )}
              {isStaff ? (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-medium text-text-muted">{t.currencyLabel}</span>
                  <CurrencyToggle />
                </div>
              ) : null}
            </div>
          </PageContainer>
        </div>
      ) : null}
    </header>
  );
}
