import { useEffect, useRef, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, ChevronsRight, Eye, EyeOff, KeyRound, Lock, LogIn, Mail } from "lucide-react";
import { AuthCard } from "@/components/account/AuthCard";
import { DiscordIcon } from "@/components/account/SocialLoginButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TurnstileWidget, turnstileEnabled } from "@/components/account/TurnstileWidget";
import { useAuthStore } from "@/store/authStore";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    title: "Đăng nhập",
    subtitle: "Truy cập bảng điều khiển, đơn hàng và minh chứng giao dịch của bạn.",
    slideLabel: "Nhấn hoặc kéo để đăng nhập",
    slideAria: "Nhấn hoặc kéo icon Discord để đăng nhập",
    redirecting: "Đang chuyển hướng…",
    noAccount: "Chưa có tài khoản?",
    signUpNow: "Đăng ký ngay",
    email: "Email hoặc tên hiển thị",
    emailPlaceholder: "name@example.com",
    password: "Mật khẩu",
    passwordPlaceholder: "Mật khẩu của bạn",
    hidePassword: "Ẩn mật khẩu",
    showPassword: "Hiện mật khẩu",
    forgot: "Quên mật khẩu?",
    signingIn: "Đang đăng nhập…",
    signIn: "Đăng nhập",
    welcomeBack: "Đăng nhập thành công",
    or: "hoặc",
    oauthErrors: {
      discord_denied: "Bạn đã huỷ đăng nhập Discord.",
      discord_failed: "Discord không phản hồi. Vui lòng thử lại.",
      bad_state: "Phiên đăng nhập đã hết hạn. Vui lòng bấm đăng nhập lại.",
      no_email: "Tài khoản Discord này chưa có email.",
      email_unverified: "Email trên Discord chưa được xác minh. Hãy xác minh email trong Discord rồi thử lại.",
      account_disabled: "Tài khoản này đã bị khoá.",
      server_error: "Đăng nhập Discord đang gặp sự cố. Vui lòng thử lại sau hoặc đăng nhập bằng email.",
    } as Record<string, string>,
  },
  en: {
    title: "Log in",
    subtitle: "Access your dashboard, orders, and transaction proofs.",
    slideLabel: "Click or drag to login",
    slideAria: "Click or drag the Discord icon to login",
    redirecting: "Redirecting…",
    noAccount: "Don't have an account?",
    signUpNow: "Sign up now",
    email: "Email or display name",
    emailPlaceholder: "name@example.com",
    password: "Password",
    passwordPlaceholder: "Your password",
    hidePassword: "Hide password",
    showPassword: "Show password",
    forgot: "Forgot password?",
    signingIn: "Signing in…",
    signIn: "Log in",
    welcomeBack: "Signed in successfully",
    or: "or",
    oauthErrors: {
      discord_denied: "You cancelled the Discord sign-in.",
      discord_failed: "Discord didn't respond. Please try again.",
      bad_state: "Your sign-in session expired. Please try again.",
      no_email: "This Discord account has no email address.",
      email_unverified: "Your Discord email isn't verified yet. Verify it in Discord, then try again.",
      account_disabled: "This account has been disabled.",
      server_error: "Discord sign-in is having trouble. Please try again later or sign in with email.",
    } as Record<string, string>,
  },
};

/** Kích thước handle (px) + padding trong nút — dùng để tính quãng kéo tối đa. */
const HANDLE = 44;
const PAD = 10;

/** Nút "Click or drag to login" kiểu yummytrack: handle Discord kéo được sang
 * phải; kéo quá ~70% (hoặc bấm/Enter) thì chuyển sang trang OAuth Discord. */
function SlideDiscordLogin({ next }: { next: string }) {
  const t = usePick(STR);
  const loginWithOAuth = useAuthStore((s) => s.loginWithOAuth);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const startX = useRef(0);
  const moved = useRef(false);

  async function trigger() {
    if (busy) return;
    setBusy(true);
    const result = await loginWithOAuth("discord", next);
    if (!result.success) {
      toast.error(result.error);
      setBusy(false);
    }
    // Thành công thì trình duyệt đang rời trang — giữ trạng thái chờ.
  }

  function maxDrag() {
    const el = btnRef.current;
    return el ? Math.max(0, el.clientWidth - HANDLE - PAD * 2) : 0;
  }

  function onPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    if (busy) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    moved.current = false;
    setDragging(true);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragging || busy) return;
    const dx = Math.min(Math.max(0, e.clientX - startX.current), maxDrag());
    if (dx > 8) moved.current = true;
    setDrag(dx);
  }

  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    // Kéo quá 70% quãng đường -> đăng nhập; bấm nhanh (không kéo) cũng vậy.
    if (!busy && (drag >= maxDrag() * 0.7 || !moved.current)) void trigger();
    setDrag(0);
  }

  return (
    <button
      ref={btnRef}
      type="button"
      disabled={busy}
      aria-label={t.slideAria}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        setDragging(false);
        setDrag(0);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          void trigger();
        }
      }}
      className="um-slide-btn flex h-16 w-full touch-none select-none items-center rounded-2xl border border-border-strong bg-surface-2 px-2.5 text-sm font-bold uppercase tracking-[0.14em] text-text transition-colors hover:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-60"
    >
      <span className="um-slide-fill" aria-hidden />
      <span
        aria-hidden
        style={{
          transform: `translateX(${drag}px)`,
          transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        className="inline-flex h-11 w-11 shrink-0 cursor-grab items-center justify-center rounded-xl bg-[#5865F2] shadow-lg shadow-[#5865F2]/30 active:cursor-grabbing"
      >
        <DiscordIcon className="um-icon-bob h-6 w-6" fill="#fff" />
      </span>
      <span className="flex-1 text-center" aria-hidden>
        {busy ? t.redirecting : t.slideLabel}
      </span>
      <ChevronsRight className="um-slide-chevrons mr-1.5 h-4 w-4 shrink-0 text-text-subtle" aria-hidden />
    </button>
  );
}

/** Form đăng nhập tay (email/tên hiển thị + mật khẩu), giữ gọn một cột. */
function ManualLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const t = usePick(STR);
  const login = useAuthStore((s) => s.login);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(identifier, password, captchaToken ?? undefined);
    if (result.success) {
      toast.success(t.welcomeBack);
      onSuccess();
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="login-identifier">{t.email}</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle">
            <Mail className="um-icon-bob h-4 w-4" aria-hidden />
          </span>
          <Input
            id="login-identifier"
            type="text"
            autoComplete="username"
            placeholder={t.emailPlaceholder}
            className="pl-9"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">{t.password}</Label>
          <Link to="/forgot-password" className="text-xs text-yellow hover:text-yellow-hover">
            {t.forgot}
          </Link>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle">
            <Lock className="um-icon-sway h-4 w-4" aria-hidden />
          </span>
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={t.passwordPlaceholder}
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
        <LogIn className="um-icon-bob h-4 w-4" aria-hidden />
        {submitting ? t.signingIn : t.signIn}
      </Button>
    </form>
  );
}

export function Login() {
  const t = usePick(STR);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Where to send the user after a successful sign-in (set by RequireAuth as
  // state.from, or by RequireRole as the ?next= query param).
  const from =
    (location.state as { from?: string } | null)?.from ??
    searchParams.get("next") ??
    "/dashboard";

  // Máy chủ đăng nhập Discord báo lỗi qua ?error=<mã> -> hiện thông báo rồi xoá khỏi URL.
  useEffect(() => {
    const code = searchParams.get("error");
    if (!code) return;
    toast.error(t.oauthErrors[code] ?? t.oauthErrors.server_error);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete("error");
        return params;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams, t]);

  // Already signed in → skip the form.
  if (user) return <Navigate to={from} replace />;

  return (
    <AuthCard
      title={t.title}
      subtitle={t.subtitle}
      footer={
        <span className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5">
          <span className="flex items-center gap-2 text-text-muted">
            <KeyRound className="um-icon-sway h-3.5 w-3.5 text-text-subtle" aria-hidden />
            {t.noAccount}
          </span>
          <Link
            to="/register"
            className="rounded-xl bg-yellow px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-text-on-yellow transition-colors hover:bg-yellow-hover"
          >
            {t.signUpNow}
          </Link>
        </span>
      }
    >
      <ManualLoginForm onSuccess={() => navigate(from, { replace: true })} />

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-text-subtle" aria-hidden>
        <span className="um-auth-hr flex-1" />
        {t.or}
        <span className="um-auth-hr flex-1" />
      </div>

      <div className="space-y-2.5">
        <SlideDiscordLogin next={from} />
      </div>
    </AuthCard>
  );
}
