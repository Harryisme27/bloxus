// Profile dropdown (replaces the plain profile <Link>).
//
// Trigger = avatar + name + chevron. Panel: header (avatar, display name, role
// chip) + grouped menu items that link ONLY to real routes, ending in logout.
// Closes on outside-click, Escape, or route change. Dark citrus theme.
//
// No @radix-ui/react-dropdown-menu dependency exists, so this is a small
// click-outside implementation.
import { isStaffRole } from "@/lib/roles";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  MessageCircle,
  User,
  Briefcase,
  HelpCircle,
  Mail,
  LogOut,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { usePick } from "@/i18n";
import type { UserRole } from "@/types/db";

const STR = {
  vi: {
    dashboard: "Bảng điều khiển",
    myOrders: "Đơn hàng của tôi",
    messages: "Tin nhắn",
    profile: "Hồ sơ",
    help: "Trợ giúp",
    contact: "Liên hệ",
    workArea: "Khu làm việc",
    logout: "Đăng xuất",
    roleAdmin: "Admin",
    roleManager: "Quản lý",
    roleCtv: "CTV",
    roleCustomer: "Khách",
  },
  en: {
    dashboard: "Dashboard",
    myOrders: "My orders",
    messages: "Messages",
    profile: "Profile",
    help: "Help",
    contact: "Contact",
    workArea: "Work area",
    logout: "Log out",
    roleAdmin: "Admin",
    roleManager: "Manager",
    roleCtv: "CTV",
    roleCustomer: "Customer",
  },
};

interface MenuLink {
  to: string;
  label: string;
  icon: LucideIcon;
}

const ROLE_CHIP_CLASS: Record<UserRole, string> = {
  admin: "bg-yellow text-text-on-yellow",
  manager: "bg-yellow-soft text-yellow",
  ctv: "bg-green text-text-on-green",
  customer: "bg-surface-3 text-text-muted",
};

/** Up to two initials from a display name / username. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileMenu() {
  const t = usePick(STR);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const primaryLinks: MenuLink[] = [
    { to: "/dashboard", label: t.dashboard, icon: LayoutDashboard },
    { to: "/orders", label: t.myOrders, icon: Package },
    { to: "/messages", label: t.messages, icon: MessageCircle },
    { to: "/profile", label: t.profile, icon: User },
  ];

  const helpLinks: MenuLink[] = [
    { to: "/faq", label: t.help, icon: HelpCircle },
    { to: "/contact", label: t.contact, icon: Mail },
  ];

  const roleLabel: Record<UserRole, string> = {
    admin: t.roleAdmin,
    manager: t.roleManager,
    ctv: t.roleCtv,
    customer: t.roleCustomer,
  };

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const name = user.display_name ?? user.username;
  const chipClassName = ROLE_CHIP_CLASS[user.role];
  const chipLabel = roleLabel[user.role];
  const isStaff = isStaffRole(user.role);

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate("/");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex h-10 items-center gap-2 rounded-lg border border-border-strong bg-transparent px-2 pr-2.5 text-text transition-colors hover:bg-surface-2 active:bg-surface-3",
          open && "bg-surface-2",
        )}
      >
        <Avatar name={name} avatarUrl={user.avatar_url} />
        <span className="hidden max-w-[10rem] truncate text-sm font-semibold md:block">{name}</span>
        <ChevronDown
          className={cn("h-4 w-4 text-text-muted transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl"
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Avatar name={name} avatarUrl={user.avatar_url} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text">{name}</p>
              <span
                className={cn(
                  "mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  chipClassName,
                )}
              >
                {chipLabel}
              </span>
            </div>
          </div>

          <MenuSection>
            {primaryLinks.map((item) => (
              <MenuItem key={item.to} {...item} onSelect={() => setOpen(false)} />
            ))}
            {isStaff ? (
              <MenuItem to="/work" label={t.workArea} icon={Briefcase} onSelect={() => setOpen(false)} />
            ) : null}
          </MenuSection>

          <MenuSection>
            {helpLinks.map((item) => (
              <MenuItem key={item.to} {...item} onSelect={() => setOpen(false)} />
            ))}
          </MenuSection>

          <div className="border-t border-border py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-danger transition-colors hover:bg-surface-3"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t.logout}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuSection({ children }: { children: ReactNode }) {
  return <div className="border-t border-border py-1 first:border-t-0">{children}</div>;
}

function MenuItem({
  to,
  label,
  icon: Icon,
  onSelect,
}: MenuLink & { onSelect: () => void }) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onSelect}
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-3 hover:text-text"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}

function Avatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl: string | null;
  size?: "md" | "lg";
}) {
  const dim = size === "lg" ? "h-10 w-10 text-sm" : "h-7 w-7 text-xs";
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn("shrink-0 rounded-full object-cover", dim)}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-surface-3 font-heading font-bold text-text",
        dim,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
