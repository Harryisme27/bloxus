import { Sparkles } from "lucide-react";
import { usePick } from "@/i18n";
import { cn } from "@/lib/utils";

const STR = {
  vi: { demo: "DEMO — không thanh toán thật" },
  en: { demo: "DEMO — no real payments" },
};

export interface DemoChipProps {
  className?: string;
  /** Short label to show. Defaults to the standard demo disclaimer. */
  label?: string;
}

/** Small pill reminding visitors this is a demo with no real payments. */
export function DemoChip({ className, label }: DemoChipProps) {
  const t = usePick(STR);
  const text = label ?? t.demo;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-yellow-soft px-3 py-1 text-xs font-semibold text-gold-deep",
        className,
      )}
      style={{ borderColor: "rgba(245, 176, 30, 0.4)" }}
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      {text}
    </span>
  );
}
