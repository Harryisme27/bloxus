// Thanh menu kiểu bloxmart: logo | nhóm menu dạng viên thuốc (Select games ▾,
// Proofs LIVE, Tutorial, FAQ, Discord) | tìm sản phẩm, giỏ, Sign in, Sign up now.
// Đã đăng nhập thì thay Sign in/Sign up bằng chat, chuông, menu hồ sơ.
// Màn hình < xl: mục thiếu chỗ nằm trong menu hamburger.
import { isStaffRole } from "@/lib/roles";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Menu,
  X,
  Briefcase,
  MessageCircle,
  Bell,
  LogOut,
  Search,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Gamepad2,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { ChatIconLink } from "@/components/nav/ChatIconLink";
import { NavbarSearch } from "@/components/nav/NavbarSearch";
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
    languageLabel: "Ngôn ngữ",
    currencyLabel: "Tiền tệ",
    tutorial: "Hướng dẫn",
    discord: "Discord",
    live: "Live",
    signIn: "Đăng nhập",
    signUpNow: "Đăng ký ngay",
    searchItems: "Tìm sản phẩm",
    closeSearch: "Đóng tìm kiếm",
  },
  en: {
    homeAria: "Bloxus - Home",
    closeMenu: "Close menu",
    openMenu: "Open menu",
    notifications: "Notifications",
    languageLabel: "Language",
    currencyLabel: "Currency",
    tutorial: "Tutorial",
    discord: "Discord",
    live: "Live",
    signIn: "Sign in",
    signUpNow: "Sign up now",
    searchItems: "Search items",
    closeSearch: "Close search",
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
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const cartCount = useCartStore((state) => state.items.reduce((sum, line) => sum + line.quantity, 0));
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isStaff = isStaffRole(user?.role);
  const unread = useUnreadCount();

  // Keep last_seen fresh while the app is open (Agent D owns the hook impl).
  useHeartbeat();

  // Đổi trang -> đóng ô tìm + menu mobile.
  useEffect(() => {
    setSearchOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!searchOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!searchRef.current?.contains(e.target as Node)) setSearchOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchOpen]);

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
      <PageContainer className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <Link to="/" className="flex shrink-0 items-center" aria-label={t.homeAria}>
            <img src="/logo-bloxus.png?v=2" alt="Bloxus" className="h-10 w-auto" />
          </Link>

          {/* Nhóm menu dạng viên thuốc */}
          <nav className="hidden items-center gap-0.5 rounded-full border border-border bg-surface p-1 lg:flex">
            <GamesMenu />
            <NavLink to="/proofs" className={pillLink}>
              <ShieldCheck className="h-4 w-4 text-green" aria-hidden />
              {s.nav.proofs}
              <LiveBadge label={t.live} />
            </NavLink>
            <NavLink to="/tutorial" className={({ isActive }) => cn(pillLink({ isActive }), "hidden xl:inline-flex")}>
              <BookOpen className="h-4 w-4 text-lemon" aria-hidden />
              {t.tutorial}
            </NavLink>
            <NavLink to="/faq" className={({ isActive }) => cn(pillLink({ isActive }), "hidden xl:inline-flex")}>
              <HelpCircle className="h-4 w-4 text-text-muted" aria-hidden />
              {s.nav.faq}
            </NavLink>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className={navPillItemClass}>
              <DiscordIcon className="h-4 w-4" />
              {t.discord}
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          {isStaff ? (
            <Link to="/work" className="hidden xl:block">
              <Button variant="gold" size="sm">
                <Briefcase className="h-4 w-4" aria-hidden="true" />
                {s.nav.work}
              </Button>
            </Link>
          ) : null}

          {/* Tìm sản phẩm: nút kính lúp mở ô tìm ngay dưới thanh menu. */}
          <div ref={searchRef}>
            <button
              type="button"
              className={cn(iconBtn, searchOpen && "bg-surface-2 text-text")}
              aria-label={searchOpen ? t.closeSearch : t.searchItems}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
            {searchOpen ? (
              <div className="absolute right-4 top-full z-50 mt-2 w-[min(440px,calc(100%-32px))] rounded-2xl border border-border-strong bg-surface p-3 shadow-2xl shadow-black/60">
                <NavbarSearch autoFocus />
              </div>
            ) : null}
          </div>

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
                className="hidden whitespace-nowrap rounded-lg px-3 py-2 font-heading text-[13px] font-extrabold uppercase tracking-[0.08em] text-text transition-colors hover:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow sm:inline-flex"
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

          {/* Khách chỉ dùng EN + USD; nút chuyển ngôn ngữ/tiền tệ chỉ dành cho staff. */}
          {isStaff ? (
            <>
              <LanguageToggle className="hidden xl:inline-flex" />
              <CurrencyToggle className="hidden xl:inline-flex" />
            </>
          ) : null}

          <button
            type="button"
            className={cn(iconBtn, "xl:hidden")}
            aria-label={mobileOpen ? t.closeMenu : t.openMenu}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </PageContainer>

      {mobileOpen ? (
        <div className="border-t border-border bg-surface xl:hidden">
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
                <>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-medium text-text-muted">{t.languageLabel}</span>
                    <LanguageToggle />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-muted">{t.currencyLabel}</span>
                    <CurrencyToggle />
                  </div>
                </>
              ) : null}
            </div>
          </PageContainer>
        </div>
      ) : null}
    </header>
  );
}
