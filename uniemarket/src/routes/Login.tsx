import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles, AlertCircle } from "lucide-react";
import { AuthCard } from "@/components/account/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";

export function Login() {
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Where to send the user after a successful sign-in (set by RequireAuth as
  // state.from, or by RequireRole as the ?next= query param).
  const from =
    (location.state as { from?: string } | null)?.from ??
    searchParams.get("next") ??
    "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in → skip the form.
  if (user) return <Navigate to={from} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await login(email, password);
    if (result.success) {
      toast.success("Đăng nhập thành công", { description: "Chào mừng bạn quay lại Uniemarket!" });
      navigate(from, { replace: true });
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Đăng nhập"
      subtitle="Truy cập bảng điều khiển, đơn hàng và minh chứng giao dịch của bạn."
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-semibold text-yellow hover:text-yellow-hover">
            Đăng ký ngay
          </Link>
        </>
      }
    >
      <div className="mb-5 rounded-xl border border-yellow bg-yellow-soft p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-yellow">
          <Sparkles className="h-4 w-4" aria-hidden />
          Tài khoản do bạn tự đăng ký
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Uniemarket dùng tài khoản thật — đăng nhập bằng email và mật khẩu bạn đã đăng ký. Chưa có
          tài khoản? Bấm "Đăng ký ngay" bên dưới.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="login-email">Email</Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
              aria-hidden
            />
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="ban@email.com"
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="login-password">Mật khẩu</Label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
              aria-hidden
            />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="px-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle transition-colors hover:text-text"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong bg-surface-2 accent-yellow"
            />
            Ghi nhớ đăng nhập
          </label>
          <button
            type="button"
            disabled
            title="Sắp ra mắt — liên hệ hỗ trợ nếu bạn quên mật khẩu"
            className="cursor-not-allowed text-sm text-text-subtle"
          >
            Quên mật khẩu?
          </button>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
          <LogIn className="h-4 w-4" aria-hidden />
          {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
        </Button>
      </form>

      {/* Social login (visual only) */}
      <div className="my-5 flex items-center gap-3 text-xs text-text-subtle">
        <span className="h-px flex-1 bg-border" />
        HOẶC
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => toast("Đăng nhập Google chưa được kích hoạt.")}
        >
          Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => toast("Đăng nhập Discord chưa được kích hoạt.")}
        >
          Discord
        </Button>
      </div>
    </AuthCard>
  );
}
