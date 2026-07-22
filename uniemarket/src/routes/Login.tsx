import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { UserRound, Lock, Eye, EyeOff, LogIn, Sparkles, AlertCircle } from "lucide-react";
import { AuthCard } from "@/components/account/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { TurnstileWidget, turnstileEnabled } from "@/components/account/TurnstileWidget";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    signedIn: "Đăng nhập thành công",
    signedInDesc: "Chào mừng bạn quay lại Uniemarket!",
    title: "Đăng nhập",
    subtitle: "Truy cập bảng điều khiển, đơn hàng và minh chứng giao dịch của bạn.",
    noAccount: "Chưa có tài khoản?",
    signUpNow: "Đăng ký ngay",
    selfRegistered: "Tài khoản do bạn tự đăng ký",
    selfRegisteredDesc:
      'Uniemarket dùng tài khoản thật — đăng nhập bằng tên đăng nhập hoặc email cùng mật khẩu bạn đã đăng ký. Chưa có tài khoản? Bấm "Đăng ký ngay" bên dưới.',
    email: "Tên đăng nhập / Email",
    emailPlaceholder: "username hoặc ban@email.com",
    password: "Mật khẩu",
    hidePassword: "Ẩn mật khẩu",
    showPassword: "Hiện mật khẩu",
    remember: "Ghi nhớ đăng nhập",
    forgotTitle: "Sắp ra mắt — liên hệ hỗ trợ nếu bạn quên mật khẩu",
    forgot: "Quên mật khẩu?",
    signingIn: "Đang đăng nhập…",
    signIn: "Đăng nhập",
    or: "HOẶC",
    googleDisabled: "Đăng nhập Google chưa được kích hoạt.",
    discordDisabled: "Đăng nhập Discord chưa được kích hoạt.",
  },
  en: {
    signedIn: "Signed in successfully",
    signedInDesc: "Welcome back to Uniemarket!",
    title: "Log in",
    subtitle: "Access your dashboard, orders, and transaction proofs.",
    noAccount: "Don't have an account?",
    signUpNow: "Sign up now",
    selfRegistered: "Accounts you register yourself",
    selfRegisteredDesc:
      'Uniemarket uses real accounts — sign in with your username or email and the password you registered. No account yet? Click "Sign up now" below.',
    email: "Username / Email",
    emailPlaceholder: "username or you@email.com",
    password: "Password",
    hidePassword: "Hide password",
    showPassword: "Show password",
    remember: "Remember me",
    forgotTitle: "Coming soon — contact support if you forgot your password",
    forgot: "Forgot password?",
    signingIn: "Signing in…",
    signIn: "Log in",
    or: "OR",
    googleDisabled: "Google sign-in isn't enabled yet.",
    discordDisabled: "Discord sign-in isn't enabled yet.",
  },
};

export function Login() {
  const t = usePick(STR);
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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Already signed in → skip the form.
  if (user) return <Navigate to={from} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await login(email, password, captchaToken ?? undefined);
    if (result.success) {
      toast.success(t.signedIn, { description: t.signedInDesc });
      navigate(from, { replace: true });
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title={t.title}
      subtitle={t.subtitle}
      footer={
        <>
          {t.noAccount}{" "}
          <Link to="/register" className="font-semibold text-yellow hover:text-yellow-hover">
            {t.signUpNow}
          </Link>
        </>
      }
    >
      <div className="mb-5 rounded-xl border border-yellow bg-yellow-soft p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-yellow">
          <Sparkles className="h-4 w-4" aria-hidden />
          {t.selfRegistered}
        </div>
        <p className="mt-2 text-sm text-text-muted">{t.selfRegisteredDesc}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="login-email">{t.email}</Label>
          <div className="relative">
            <UserRound
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
              aria-hidden
            />
            <Input
              id="login-email"
              type="text"
              autoComplete="username"
              placeholder={t.emailPlaceholder}
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="login-password">{t.password}</Label>
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
              aria-label={showPassword ? t.hidePassword : t.showPassword}
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
            {t.remember}
          </label>
          <Link
            to="/forgot-password"
            className="text-sm text-text-muted transition-colors hover:text-yellow"
          >
            {t.forgot}
          </Link>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

        <TurnstileWidget onToken={setCaptchaToken} />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={submitting || (turnstileEnabled && !captchaToken)}
        >
          <LogIn className="h-4 w-4" aria-hidden />
          {submitting ? t.signingIn : t.signIn}
        </Button>
      </form>

      {/* Social login (visual only) */}
      <div className="my-5 flex items-center gap-3 text-xs text-text-subtle">
        <span className="h-px flex-1 bg-border" />
        {t.or}
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => toast(t.googleDisabled)}
        >
          Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => toast(t.discordDisabled)}
        >
          Discord
        </Button>
      </div>
    </AuthCard>
  );
}
