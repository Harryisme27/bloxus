import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ShoppingCart, Search, Menu, X, User as UserIcon, Briefcase } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

export function Navbar() {
  const s = useT();
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartCount = useCartStore((state) => state.items.reduce((sum, line) => sum + line.quantity, 0));
  const user = useAuthStore((state) => state.user);
  const isStaff = user?.role === "admin" || user?.role === "ctv";

  const navLinks: { to: string; label: string }[] = [
    { to: "/games", label: s.nav.games },
    { to: "/proofs", label: s.nav.proofs },
    { to: "/faq", label: s.nav.faq },
  ];

  return (
    <header
      className="sticky top-0 z-40 border-b border-border backdrop-blur-md"
      style={{ backgroundColor: "rgba(26, 23, 16, 0.85)" }}
    >
      <PageContainer className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center" aria-label="Uniemarket - Trang chủ">
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

          {isStaff ? (
            <Link to="/work" className="hidden sm:block">
              <Button variant="gold" size="sm">
                <Briefcase className="h-4 w-4" aria-hidden="true" />
                {s.nav.work}
              </Button>
            </Link>
          ) : null}

          {user ? (
            <Link to="/profile" className="hidden items-center gap-2 sm:flex">
              <Button variant="secondary" size="sm">
                <UserIcon className="h-4 w-4" aria-hidden="true" />
                {user.display_name ?? user.username}
              </Button>
            </Link>
          ) : (
            <Link to="/login" className="hidden sm:block">
              <Button variant="primary" size="sm">
                {s.nav.login}
              </Button>
            </Link>
          )}

          <LanguageToggle className="hidden sm:inline-flex" />

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text lg:hidden"
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
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
                <Link to="/profile" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    <UserIcon className="h-4 w-4" aria-hidden="true" />
                    {user.display_name ?? user.username}
                  </Button>
                </Link>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    {s.nav.login}
                  </Button>
                </Link>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-text-muted">Ngôn ngữ / Language</span>
                <LanguageToggle />
              </div>
            </div>
          </PageContainer>
        </div>
      ) : null}
    </header>
  );
}
