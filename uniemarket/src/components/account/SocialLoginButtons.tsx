// Nút đăng nhập/đăng ký qua Google & Discord (dùng chung Login + Register).
// Bấm -> chuyển hướng sang trang OAuth của provider; quay về web là có phiên.
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { usePick } from "@/i18n";

const STR = {
  vi: { or: "hoặc", redirecting: "Đang chuyển hướng…", withGoogle: "Tiếp tục với Google", withDiscord: "Tiếp tục với Discord" },
  en: { or: "or", redirecting: "Redirecting…", withGoogle: "Continue with Google", withDiscord: "Continue with Discord" },
};

export type Provider = "google" | "discord";

function GoogleIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.1 3.57-5.17 3.57-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.1-6.72-4.94H1.29v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.29a12.04 12.04 0 0 0 0 10.8l3.99-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.34.6 4.58 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.29 6.6l3.99 3.1C6.23 6.87 8.88 4.76 12 4.76z"
      />
    </svg>
  );
}

export function DiscordIcon({ className = "h-[18px] w-[18px]", fill = "#5865F2" }: { className?: string; fill?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={fill} aria-hidden="true">
      <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.6 1.25a18.27 18.27 0 0 0-5.5 0 12.6 12.6 0 0 0-.61-1.25.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-4.88 1.52.07.07 0 0 0-.04.03A20.25 20.25 0 0 0 .1 18.06a.08.08 0 0 0 .03.05 19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .08-.02c.46-.63.87-1.3 1.22-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1-.01-.12c.13-.1.25-.19.37-.29a.07.07 0 0 1 .08-.01c3.93 1.8 8.18 1.8 12.06 0a.07.07 0 0 1 .08 0c.12.11.25.21.38.3a.08.08 0 0 1-.01.13c-.6.35-1.22.64-1.87.89a.08.08 0 0 0-.04.11c.36.7.77 1.37 1.22 2a.08.08 0 0 0 .08.03 19.84 19.84 0 0 0 6.02-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.68-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.15-1.08-2.15-2.42 0-1.33.95-2.42 2.15-2.42 1.22 0 2.18 1.1 2.16 2.42 0 1.34-.94 2.42-2.16 2.42z" />
    </svg>
  );
}

export function SocialLoginButtons({ only, noDivider }: { only?: Provider[]; noDivider?: boolean }) {
  const t = usePick(STR);
  const loginWithOAuth = useAuthStore((s) => s.loginWithOAuth);
  const [busy, setBusy] = useState<Provider | null>(null);

  async function handle(provider: Provider) {
    setBusy(provider);
    const result = await loginWithOAuth(provider);
    if (!result.success) {
      toast.error(result.error);
      setBusy(null);
    }
    // Thành công thì trình duyệt đang rời trang — giữ nút ở trạng thái chờ.
  }

  const all: { id: Provider; label: string; icon: ReactNode }[] = [
    { id: "google", label: t.withGoogle, icon: <GoogleIcon /> },
    { id: "discord", label: t.withDiscord, icon: <DiscordIcon /> },
  ];
  const providers = only ? all.filter((p) => only.includes(p.id)) : all;

  return (
    <>
      {noDivider ? null : (
        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-text-subtle">
          <span className="um-auth-hr flex-1" />
          {t.or}
          <span className="um-auth-hr flex-1" />
        </div>
      )}
      <div className="grid gap-2.5">
        {providers.map((p, i) => (
          <button
            key={p.id}
            type="button"
            disabled={busy !== null}
            onClick={() => void handle(p.id)}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3 text-left text-sm font-semibold text-text transition-colors hover:border-border-strong hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-3">
              {/* Lệch pha để hai icon không nhấp nhô cùng nhịp. */}
              <span className="um-icon-bob inline-flex" style={{ animationDelay: `${i * -1.3}s` }}>
                {p.icon}
              </span>
            </span>
            <span className="truncate">{busy === p.id ? t.redirecting : p.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
