// /reset-password — đích của link trong email: đặt mật khẩu mới.
// Supabase JS tự bắt token recovery trong URL (detectSessionInUrl) và tạo
// phiên tạm; ở đây chỉ cần updateUser({ password }).
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/account/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    title: "Đặt lại mật khẩu",
    subtitle: "Nhập mật khẩu mới cho tài khoản của bạn.",
    password: "Mật khẩu mới",
    confirm: "Nhập lại mật khẩu mới",
    submit: "Đổi mật khẩu",
    submitting: "Đang đổi…",
    success: "Đã đổi mật khẩu! Bạn đã đăng nhập.",
    tooShort: "Mật khẩu cần ít nhất 6 ký tự.",
    mismatch: "Hai mật khẩu không khớp.",
    noSession:
      "Link không hợp lệ hoặc đã hết hạn. Hãy gửi lại email đặt lại mật khẩu.",
    resend: "Gửi lại email",
    backToLogin: "Quay lại đăng nhập",
  },
  en: {
    title: "Reset password",
    subtitle: "Choose a new password for your account.",
    password: "New password",
    confirm: "Confirm new password",
    submit: "Change password",
    submitting: "Changing…",
    success: "Password changed! You're now signed in.",
    tooShort: "Password must be at least 6 characters.",
    mismatch: "Passwords don't match.",
    noSession: "This link is invalid or expired. Please request a new reset email.",
    resend: "Resend email",
    backToLogin: "Back to sign in",
  },
};

export function ResetPassword() {
  const t = usePick(STR);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Chờ Supabase xử lý token recovery trong URL rồi kiểm tra phiên.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = requireSupabase();
    let cancelled = false;
    const check = async () => {
      const { data } = await sb.auth.getSession();
      if (!cancelled) setHasSession(!!data.session);
    };
    void check();
    // Token có thể được xử lý trễ vài trăm ms sau khi trang mount.
    const timer = setTimeout(() => void check(), 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError(t.tooShort);
    if (password !== confirm) return setError(t.mismatch);
    setSubmitting(true);
    const sb = requireSupabase();
    const { error: err } = await sb.auth.updateUser({ password });
    setSubmitting(false);
    if (err) return setError(err.message);
    toast.success(t.success);
    navigate("/dashboard", { replace: true });
  }

  return (
    <AuthCard
      title={t.title}
      subtitle={t.subtitle}
      footer={
        <Link to="/login" className="font-semibold text-yellow hover:text-yellow-hover">
          {t.backToLogin}
        </Link>
      }
    >
      {hasSession === false ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-danger bg-danger-soft p-4 text-sm text-text">
            {t.noSession}
          </p>
          <Link
            to="/forgot-password"
            className="block text-center font-semibold text-yellow hover:text-yellow-hover"
          >
            {t.resend}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {[
            { id: "rp-password", label: t.password, val: password, set: setPassword },
            { id: "rp-confirm", label: t.confirm, val: confirm, set: setConfirm },
          ].map((f) => (
            <div key={f.id}>
              <Label htmlFor={f.id}>{f.label}</Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
                  aria-hidden
                />
                <Input
                  id={f.id}
                  type="password"
                  className="pl-9"
                  autoComplete="new-password"
                  value={f.val}
                  onChange={(e) => f.set(e.target.value)}
                />
              </div>
            </div>
          ))}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" size="lg" className="w-full" disabled={submitting || hasSession !== true}>
            {submitting ? t.submitting : t.submit}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
