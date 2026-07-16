import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { SetupNotice } from "@/components/SetupNotice";
import { buttonVariants } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types/db";

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
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const location = useLocation();

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
        <p className="animate-pulse text-sm text-text-muted">Đang kiểm tra đăng nhập…</p>
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
        <p className="animate-pulse text-sm text-text-muted">Đang tải hồ sơ…</p>
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
            Không có quyền truy cập
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-text-muted">
            Trang này chỉ dành cho {roles.map((role) => roleLabel(role)).join(" và ")}. Nếu bạn
            muốn trở thành cộng tác viên, hãy ứng tuyển tại trang CTV.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/" className={buttonVariants({ variant: "primary", size: "md" })}>
              Về trang chủ
            </Link>
            <Link to="/ctv" className={buttonVariants({ variant: "secondary", size: "md" })}>
              Ứng tuyển CTV
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return <>{children}</>;
}

function roleLabel(role: UserRole): string {
  switch (role) {
    case "admin":
      return "quản trị viên";
    case "ctv":
      return "cộng tác viên";
    default:
      return "khách hàng";
  }
}
