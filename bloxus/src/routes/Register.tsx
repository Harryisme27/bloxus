import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User2, Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle } from "lucide-react";
import { AuthCard } from "@/components/account/AuthCard";
import { SocialLoginButtons } from "@/components/account/SocialLoginButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { TurnstileWidget, turnstileEnabled } from "@/components/account/TurnstileWidget";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    mustAgree: "Bạn cần đồng ý với Điều khoản dịch vụ để tiếp tục.",
    passwordMin: "Mật khẩu cần tối thiểu 6 ký tự.",
    created: "Tạo tài khoản thành công",
    createdDesc: "Chào mừng bạn đến với Bloxus!",
    checkEmail: "Kiểm tra email để xác nhận tài khoản",
    checkEmailDesc: "Sau khi xác nhận, hãy đăng nhập lại.",
    title: "Tạo tài khoản",
    subtitle: "Đăng ký miễn phí để theo dõi đơn hàng và mua sắm nhanh hơn.",
    haveAccount: "Đã có tài khoản?",
    signIn: "Đăng nhập",
    displayName: "Tên hiển thị",
    displayNamePlaceholder: "name@example.com",
    displayNameHint: "Tên in-game để nhận hàng sẽ được hỏi riêng cho từng đơn hàng.",
    email: "Email",
    emailPlaceholder: "name@example.com",
    password: "Mật khẩu",
    passwordPlaceholder: "Tối thiểu 6 ký tự",
    hidePassword: "Ẩn mật khẩu",
    showPassword: "Hiện mật khẩu",
    agreePrefix: "Tôi đồng ý với ",
    terms: "Điều khoản dịch vụ",
    agreeAnd: " và ",
    privacy: "Chính sách bảo mật",
    agreeSuffix: ".",
    creating: "Đang tạo tài khoản…",
    signUp: "Đăng ký",
  },
  en: {
    mustAgree: "You must agree to the Terms of Service to continue.",
    passwordMin: "Your password must be at least 6 characters.",
    created: "Account created successfully",
    createdDesc: "Welcome to Bloxus!",
    checkEmail: "Check your email to confirm your account",
    checkEmailDesc: "Once confirmed, sign in again.",
    title: "Create an account",
    subtitle: "Sign up for free to track your orders and shop faster.",
    haveAccount: "Already have an account?",
    signIn: "Log in",
    displayName: "Display name",
    displayNamePlaceholder: "name@example.com",
    displayNameHint: "Your in-game name for delivery is asked separately for each order.",
    email: "Email",
    emailPlaceholder: "name@example.com",
    password: "Password",
    passwordPlaceholder: "At least 6 characters",
    hidePassword: "Hide password",
    showPassword: "Show password",
    agreePrefix: "I agree to the ",
    terms: "Terms of Service",
    agreeAnd: " and the ",
    privacy: "Privacy Policy",
    agreeSuffix: ".",
    creating: "Creating account…",
    signUp: "Sign up",
  },
};

export function Register() {
  const t = usePick(STR);
  const user = useAuthStore((state) => state.user);
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!agree) {
      setError(t.mustAgree);
      return;
    }
    if (password.length < 6) {
      setError(t.passwordMin);
      return;
    }

    setSubmitting(true);
    const result = await register({ username, email, password, captchaToken: captchaToken ?? undefined });
    if (result.success) {
      // Nếu Confirm email đang bật, đăng ký xong chưa có phiên — hướng người
      // dùng sang trang đăng nhập sau khi xác nhận email.
      if (useAuthStore.getState().session) {
        toast.success(t.created, {
          description: t.createdDesc,
        });
        navigate("/dashboard", { replace: true });
      } else {
        toast.info(t.checkEmail, {
          description: t.checkEmailDesc,
        });
        navigate("/login", { replace: true });
      }
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
          {t.haveAccount}{" "}
          <Link to="/login" className="font-semibold text-yellow hover:text-yellow-hover">
            {t.signIn}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="reg-username">{t.displayName}</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle">
              <User2 className="um-icon-bob h-4 w-4" aria-hidden />
            </span>
            <Input
              id="reg-username"
              type="text"
              autoComplete="username"
              placeholder={t.displayNamePlaceholder}
              className="pl-9"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <p className="mt-1 text-xs text-text-subtle">{t.displayNameHint}</p>
        </div>

        <div>
          <Label htmlFor="reg-email">{t.email}</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle">
              <Mail className="um-icon-bob h-4 w-4" aria-hidden style={{ animationDelay: "-1.3s" }} />
            </span>
            <Input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder={t.emailPlaceholder}
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="reg-password">{t.password}</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle">
              <Lock className="um-icon-sway h-4 w-4" aria-hidden />
            </span>
            <Input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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

        <label className="flex cursor-pointer items-start gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border-strong bg-surface-2 accent-yellow"
            required
          />
          <span>
            {t.agreePrefix}
            <Link to="/terms" className="text-yellow hover:text-yellow-hover">
              {t.terms}
            </Link>
            {t.agreeAnd}
            <Link to="/privacy" className="text-yellow hover:text-yellow-hover">
              {t.privacy}
            </Link>
            {t.agreeSuffix}
          </span>
        </label>

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
          <UserPlus className="um-icon-bob h-4 w-4" aria-hidden />
          {submitting ? t.creating : t.signUp}
        </Button>
      </form>

      <SocialLoginButtons />
    </AuthCard>
  );
}
