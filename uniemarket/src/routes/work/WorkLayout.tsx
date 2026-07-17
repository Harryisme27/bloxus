import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  BadgeDollarSign,
  PackageSearch,
  Users,
  MessagesSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    workArea: "Khu làm việc",
    admin: "Admin",
    dashboard: "Bảng làm việc",
    orders: "Đơn hàng",
    payments: "Xác nhận thanh toán",
    catalog: "Danh mục & sản phẩm",
    ctv: "CTV",
    chat: "Chat nội bộ",
    settings: "Cài đặt",
  },
  en: {
    workArea: "Work area",
    admin: "Admin",
    dashboard: "Dashboard",
    orders: "Orders",
    payments: "Confirm payment",
    catalog: "Categories & products",
    ctv: "CTV",
    chat: "Team chat",
    settings: "Settings",
  },
};

type NavKey = "dashboard" | "orders" | "payments" | "catalog" | "ctv" | "chat" | "settings";

interface WorkNavItem {
  to: string;
  key: NavKey;
  icon: LucideIcon;
  /** true = chỉ admin thấy (CTV bị ẩn). */
  adminOnly: boolean;
  end?: boolean;
}

const NAV_ITEMS: WorkNavItem[] = [
  { to: "/work", key: "dashboard", icon: LayoutDashboard, adminOnly: false, end: true },
  { to: "/work/orders", key: "orders", icon: Receipt, adminOnly: false },
  { to: "/work/payments", key: "payments", icon: BadgeDollarSign, adminOnly: true },
  { to: "/work/catalog", key: "catalog", icon: PackageSearch, adminOnly: true },
  { to: "/work/ctv", key: "ctv", icon: Users, adminOnly: true },
  { to: "/work/chat", key: "chat", icon: MessagesSquare, adminOnly: false },
  { to: "/work/settings", key: "settings", icon: Settings, adminOnly: true },
];

/**
 * Khung khu làm việc /work (admin + CTV). Sidebar bên trái, nội dung bên phải.
 * Các mục admin-only được ẩn với CTV và gắn nhãn "Admin" cho admin.
 */
export function WorkLayout() {
  const user = useAuthStore((state) => state.user);
  const t = usePick(STR);
  const isAdmin = user?.role === "admin";
  const items = NAV_ITEMS.filter((item) => isAdmin || !item.adminOnly);

  return (
    <PageContainer className="py-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside>
          <div className="rounded-2xl border border-border bg-surface p-3 lg:sticky lg:top-24">
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-text-subtle">
              {t.workArea}
            </p>
            <nav className="flex flex-col gap-1">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text",
                        isActive && "bg-yellow-soft text-yellow",
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="flex-1">{t[item.key]}</span>
                    {item.adminOnly ? (
                      <Badge variant="gold" className="px-1.5 text-[10px]">
                        {t.admin}
                      </Badge>
                    ) : null}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </PageContainer>
  );
}
