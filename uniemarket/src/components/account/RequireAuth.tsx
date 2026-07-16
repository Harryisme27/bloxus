import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

/** Wraps auth-only buyer pages. Chờ authStore xác định xong phiên đăng nhập
 * (loading), sau đó: chưa đăng nhập → chuyển tới /login (kèm `from` để quay
 * lại sau khi đăng nhập); đã đăng nhập → chờ profile tải xong rồi render.
 * Routing itself is untouched — the guard lives inside the page component per
 * the app's convention. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const location = useLocation();

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

  // Có phiên nhưng profile chưa tải xong — chờ để children dùng được user!.
  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="animate-pulse text-sm text-text-muted">Đang tải hồ sơ…</p>
      </div>
    );
  }

  return <>{children}</>;
}
