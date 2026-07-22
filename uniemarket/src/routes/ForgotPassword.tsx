// /forgot-password — gửi email đặt lại mật khẩu qua Supabase Auth.
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/account/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    title: "Quên mật khẩu",
    subtitle: "Nhập email đã đăng ký — chúng tôi sẽ gửi link đặt lại mật khẩu.",
    email: "Email",
    send: "Gửi link đặt lại",
    sending: "Đang gửi…",
    sent: "Đã gửi! Kiểm tra hộp thư (kể cả mục Spam) và bấm vào link trong email.",
    backToLogin: "Quay lại đăng nhập",
    invalidEmail: "Vui lòng nhập email hợp lệ.",
  },
  en: {
    title: "Forgot password",
    subtitle: "Enter your registered email — we'll send you a reset link.",
    email: "Email",
    send: "Send reset link",
    sending: "Sending…",
    sent: "Sent! Check your inbox (and Spam folder) and click the link in the email.",
    backToLogin: "Back to sign in",
    invalidEmail: "Please enter a valid email.",
  },
};

export function ForgotPassword() {
  const t = usePick(STR);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed.includes("@")) {
      setError(t.invalidEmail);
      return;
    }
    if (!isSupabaseConfigured) return;
    setSubmitting(true);
    const sb = requireSupabase();
    const { error: err } = await sb.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    toast.success(t.sent);
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
      {done ? (
        <p className="rounded-xl border border-green bg-green-soft p-4 text-sm text-text">{t.sent}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="fp-email">{t.email}</Label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
                aria-hidden
              />
              <Input
                id="fp-email"
                type="email"
                className="pl-9"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? t.sending : t.send}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
