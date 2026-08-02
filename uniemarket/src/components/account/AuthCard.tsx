import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BRAND_NAME, DISCORD_URL } from "@/lib/constants";
import { AuthHeroScene } from "@/components/account/AuthHeroScene";
import { DiscordIcon } from "@/components/account/SocialLoginButtons";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    secureNotice: "Tài khoản được bảo vệ — thanh toán an toàn qua Stripe.",
    backHome: "Về trang chủ",
  },
  en: {
    secureNotice: "Your account is protected — secure payments through Stripe.",
    backHome: "Back to home",
  },
};

/** Gõ từng ký tự của tiêu đề, kèm con trỏ nhấp nháy (giữ nhấp nháy sau khi gõ xong). */
function TypingTitle({ text }: { text: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(text.length);
      return;
    }
    const timer = window.setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          window.clearInterval(timer);
          return c;
        }
        return c + 1;
      });
    }, 70);
    return () => window.clearInterval(timer);
  }, [text]);

  return (
    <span className="inline-flex items-baseline whitespace-pre-wrap" aria-label={text}>
      <span aria-hidden>{text.slice(0, count)}</span>
      <span className="um-auth-caret" aria-hidden />
    </span>
  );
}

export interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Rendered under the card (e.g. "Chưa có tài khoản? Đăng ký"). */
  footer?: ReactNode;
}

/** Centered auth shell shared by /login and /register: brand mark, typing
 * heading, the form (children) and a small footer link row — everything fades
 * up in sequence inside one deep-dark rounded card. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  const t = usePick(STR);
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
      {/* Ambient brand glow — purely decorative. */}
      <div
        aria-hidden
        style={{ backgroundColor: "rgba(245, 176, 30, 0.08)" }}
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
      />

      <div className="relative grid w-full max-w-md items-center gap-8 lg:max-w-6xl lg:grid-cols-[1.3fr_1fr]">
        {/* Cột trái: panel cảnh động (ẩn trên màn nhỏ). */}
        <div className="um-auth-item hidden lg:block" style={{ animationDelay: "40ms" }}>
          <AuthHeroScene />
        </div>

        <div className="rounded-[28px] border border-border bg-bg-subtle p-6 shadow-2xl shadow-black/50 sm:p-8">
          <div className="um-auth-item flex flex-col items-center text-center" style={{ animationDelay: "80ms" }}>
            <Link
              to="/"
              className="mb-4 inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 transition-colors hover:border-yellow"
              aria-label={BRAND_NAME}
            >
              <img src="/logo-unie.png" alt={BRAND_NAME} className="h-8 w-auto" />
            </Link>
            <h1 className="font-heading text-3xl font-bold text-text">
              <TypingTitle text={title} />
            </h1>
            {subtitle ? <p className="mt-2 text-sm text-text-muted">{subtitle}</p> : null}
          </div>

          <div className="um-auth-item um-auth-hr my-6" aria-hidden style={{ animationDelay: "200ms" }} />

          <div className="um-auth-item" style={{ animationDelay: "280ms" }}>
            {children}
          </div>

          <div
            className="um-auth-item mt-6 flex items-center justify-center gap-2 text-xs text-text-subtle"
            style={{ animationDelay: "440ms" }}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-green" aria-hidden />
            <span>{t.secureNotice}</span>
          </div>

          {footer ? (
            <div className="um-auth-item mt-4 text-center text-sm text-text-muted" style={{ animationDelay: "520ms" }}>
              {footer}
            </div>
          ) : null}

          {/* Hàng icon cộng đồng (kiểu yummytrack): bấm Discord -> mở link mời server. */}
          <div className="um-auth-item mt-6 flex items-center justify-center gap-3" style={{ animationDelay: "580ms" }}>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Discord"
              title="Discord"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#5865F2] shadow-lg shadow-[#5865F2]/25 transition-transform hover:scale-110"
            >
              <DiscordIcon className="um-icon-bob h-5 w-5" fill="#fff" />
            </a>
          </div>

          <div className="um-auth-item mt-4 flex justify-center" style={{ animationDelay: "620ms" }}>
            <Link
              to="/"
              aria-label={t.backHome}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-text-subtle transition-colors hover:bg-surface-2 hover:text-text"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
