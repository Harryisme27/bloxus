import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BRAND_NAME } from "@/lib/constants";

export interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Rendered under the card (e.g. "Chưa có tài khoản? Đăng ký"). */
  footer?: ReactNode;
}

/** Centered auth shell shared by /login and /register: brand mark, heading,
 * the form (children) and a small footer link row. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
      {/* Ambient brand glow — purely decorative. */}
      <div
        aria-hidden
        style={{ backgroundColor: "rgba(245, 176, 30, 0.08)" }}
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 transition-colors hover:border-yellow"
            aria-label={BRAND_NAME}
          >
            <img src="/logo-unie.png" alt={BRAND_NAME} className="h-8 w-auto" />
          </Link>
          <h1 className="font-heading text-3xl font-bold text-text">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-text-muted">{subtitle}</p> : null}
        </div>

        <Card className="p-6 shadow-2xl sm:p-8">{children}</Card>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-text-subtle">
          <ShieldCheck className="h-3.5 w-3.5 text-green" aria-hidden />
          <span>Bản demo — tài khoản chỉ lưu cục bộ trên máy bạn, không có thanh toán thật.</span>
        </div>

        {footer ? <div className="mt-4 text-center text-sm text-text-muted">{footer}</div> : null}
      </div>
    </div>
  );
}
