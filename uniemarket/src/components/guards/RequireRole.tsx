import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { SetupNotice } from "@/components/SetupNotice";
import { buttonVariants } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { usePick } from "@/i18n";
import type { UserRole } from "@/types/db";

const STR = {
  vi: {
    checkingLogin: "Đang kiểm tra đăng nhập…",
    loadingProfile: "Đang tải hồ sơ…",
    noAccessTitle: "Không có quyền truy cập",
    noAccessBody: (who: string) =>
      `Trang này chỉ dành cho ${who}. Nếu bạn muốn trở thành cộng tác viên, hãy ứng tuyển tại trang CTV.`,
    and: " và ",
    backHome: "Về trang chủ",
    applyCtv: "Ứng tuyển CTV",
    roleAdmin: "quản trị viên",
    roleCtv: "cộng tác viên",
    roleCustomer: "khách hàng",
  },
  en: {
    checkingLogin: "Checking your sign-in…",
    loadingProfile: "Loading your profile…",
    noAccessTitle: "You don't have access",
    noAccessBody: (who: string) =>
      `This page is only for ${who}. If you'd like to become a collaborator, apply on the CTV page.`,
    and: " and ",
    backHome: "Back to home",
    applyCtv: "Apply to be a CTV",
    roleAdmin: "administrators",
    roleCtv: "collaborators",
    roleCustomer: "customers",
  },
};

/**
 * Guard theo vai trò: <RequireRole roles={['admin','ctv']}>...</RequireRole>
 * - Chưa cấu hình Supabase → hiện SetupNotice (không thể đăng nhập được).
 * - Chưa đăng nhập → chuyển tới /login?next=<trang hiện tại>.
 * - Sai vai trò → trang "Không có quyền truy cập" thân thiện.
 */
export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[];
  children: ReactNode;
}) {
  const t = usePick(STR);
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const location = useLocation();

  const roleLabel = (role: UserRole) =>
    role === "admin" ? t.roleAdmin : role === "ctv" ? t.roleCtv : t.roleCustomer;

  if (!isSupabaseConfigured) {
    return (
      <PageContainer className="py-10 sm:py-14">
        <SetupNotice />
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="animate-pulse text-sm text-text-muted">{t.checkingLogin}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname)}`}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="animate-pulse text-sm text-text-muted">{t.loadingProfile}</p>
      </div>
    );
  }

  if (!roles.includes(user.role)) {
    return (
      <PageContainer className="py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
            <ShieldAlert className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="mt-4 font-heading text-2xl font-bold text-text">
            {t.noAccessTitle}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-text-muted">
            {t.noAccessBody(roles.map((role) => roleLabel(role)).join(t.and))}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/" className={buttonVariants({ variant: "primary", size: "md" })}>
              {t.backHome}
            </Link>
            <Link to="/ctv" className={buttonVariants({ variant: "secondary", size: "md" })}>
              {t.applyCtv}
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return <>{children}</>;
}
