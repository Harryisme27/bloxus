import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  Menu,
  X,
  Briefcase,
  MessageCircle,
  Bell,
  LogOut,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { ChatIconLink } from "@/components/nav/ChatIconLink";
import { NotificationBell } from "@/components/nav/NotificationBell";
import { ProfileMenu } from "@/components/nav/ProfileMenu";
import { useUnreadCount } from "@/components/nav/useUnreadCount";
import { useHeartbeat } from "@/components/realtime/useHeartbeat";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useT, usePick } from "@/i18n";
import { cn } from "@/lib/utils";

const STR = {
  vi: {
    homeAria: "Uniemarket - Trang chủ",
    closeMenu: "Đóng menu",
    openMenu: "Mở menu",
    notifications: "Thông báo",
    languageLabel: "Ngôn ngữ",
    currencyLabel: "Tiền tệ",
  },
  en: {
    homeAria: "Uniemarket - Home",
    closeMenu: "Close menu",
    openMenu: "Open menu",
    notifications: "Notifications",
    languageLabel: "Language",
    currencyLabel: "Currency",
  },
};

export function Navbar() {
  const s = useT();
  const t = usePick(STR);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartCount = useCartStore((state) => state.items.reduce((sum, line) => sum + line.quantity, 0));
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isStaff = user?.role === "admin" || user?.role === "ctv";
  const unread = useUnreadCount();

  // Keep last_seen fresh while the app is open (Agent D owns the hook impl).
  useHeartbeat();

  const navLinks: { to: string; label: string }[] = [
    { to: "/games", label: s.nav.games },
    { to: "/proofs", label: s.nav.proofs },
    { to: "/faq", label: s.nav.faq },
  ];

  async function handleMobileLogout() {
    setMobileOpen(false);
    await logout();
    navigate("/");
  }

  return (
    <header
      className="sticky top-0 z-40 border-b border-border backdrop-blur-md"
      style={{ backgroundColor: "rgba(26, 23, 16, 0.85)" }}
    >
      <PageContainer className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center" aria-label={t.homeAria}>
            <img src="/logo-unie.png" alt="Uniemarket" className="h-10 w-auto" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text",
                    isActive && "bg-surface-2 text-text",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden max-w-sm flex-1 items-center lg:flex">
          <div className="flex w-full items-center gap-2 rounded-full border border-border-strong bg-surface-2 px-3.5 py-2 text-sm text-text-subtle">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{s.nav.searchPlaceholder}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isStaff ? (
            <Link to="/work" className="hidden sm:block">
              <Button variant="gold" size="sm">
                <Briefcase className="h-4 w-4" aria-hidden="true" />
                {s.nav.work}
              </Button>
            </Link>
          ) : null}

          {/* Chrome for logged-in users: chat, bell, cart, profile. */}
          {user ? <ChatIconLink /> : null}
          {user ? <NotificationBell /> : null}

          <Link
            to="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            aria-label={s.nav.cart}
          >
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
            <Link to="/login" className="hidden sm:block">
              <Button variant="primary" size="sm">
                {s.nav.login}
              </Button>
            </Link>
          )}

          <LanguageToggle className="hidden sm:inline-flex" />
          <CurrencyToggle className="hidden sm:inline-flex" />

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text lg:hidden"
            aria-label={mobileOpen ? t.closeMenu : t.openMenu}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </PageContainer>

      {mobileOpen ? (
        <div className="border-t border-border bg-surface lg:hidden">
          <PageContainer className="flex flex-col gap-1 py-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text",
                    isActive && "bg-surface-2 text-text",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}

            {user ? (
              <>
                <NavLink
                  to="/messages"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text",
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
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
                >
                  <span className="flex items-center gap-2">
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
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    {s.nav.login}
                  </Button>
                </Link>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-text-muted">{t.languageLabel}</span>
                <LanguageToggle />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-muted">{t.currencyLabel}</span>
                <CurrencyToggle />
              </div>
            </div>
          </PageContainer>
        </div>
      ) : null}
    </header>
  );
}
