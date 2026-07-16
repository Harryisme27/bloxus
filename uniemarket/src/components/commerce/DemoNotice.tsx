import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DemoNoticeProps {
  className?: string;
  /** "banner" = full callout with icon chip; "inline" = compact pill. */
  variant?: "banner" | "inline";
  message?: string;
}

/** Reusable "this is a demo, no real money moves" notice. Shown anywhere the
 * user is near a payment / checkout affordance. */
export function DemoNotice({ className, variant = "banner", message }: DemoNoticeProps) {
  if (variant === "inline") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-yellow-soft px-3 py-1 text-xs font-semibold text-yellow",
          className,
        )}
      >
        <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
        DEMO — không thanh toán thật
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border-strong bg-yellow-soft px-4 py-3.5",
        className,
      )}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow text-text-on-yellow">
        <ShieldAlert className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-heading text-sm font-bold text-yellow">DEMO — không thu tiền thật</p>
        <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
          {message ??
            "Đây là cửa hàng minh hoạ. Không có cổng thanh toán thật, không thẻ nào bị trừ tiền — mọi giao dịch đều được mô phỏng."}
        </p>
      </div>
    </div>
  );
}
