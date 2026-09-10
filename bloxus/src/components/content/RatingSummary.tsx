import { Star } from "lucide-react";
import { Stars } from "@/components/content/Stars";
import { cn } from "@/lib/utils";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    excellent: "Xuất sắc",
    star: "sao",
    basedOnPrefix: "Dựa trên",
    basedOnSuffix: "đánh giá",
  },
  en: {
    excellent: "Excellent",
    star: "stars",
    basedOnPrefix: "Based on",
    basedOnSuffix: "reviews",
  },
};

export interface RatingSummaryProps {
  average: number;
  count: number;
  /** Distribution of star counts, index 0 = 1★ ... index 4 = 5★. */
  distribution: number[];
  className?: string;
}

/** Trustpilot-style rating summary: big average, stars, count, and a bar breakdown. */
export function RatingSummary({ average, count, distribution, className }: RatingSummaryProps) {
  const t = usePick(STR);
  const total = distribution.reduce((sum, n) => sum + n, 0) || 1;

  return (
    <div
      className={cn(
        "grid gap-6 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-[auto,1fr] sm:items-center sm:gap-10",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2 text-center sm:border-r sm:border-border sm:pr-10">
        <p className="font-heading text-5xl font-bold tabular-nums text-text">
          {average.toFixed(1)}
        </p>
        <Stars value={average} size={20} />
        <p className="text-sm text-text-muted">
          {t.basedOnPrefix} <span className="font-semibold text-text">{count.toLocaleString("en-US")}</span> {t.basedOnSuffix}
        </p>
        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-yellow-soft px-2.5 py-1 text-xs font-semibold text-yellow">
          <Star className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} aria-hidden="true" />
          {t.excellent}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const n = distribution[stars - 1] ?? 0;
          const pct = Math.round((n / total) * 100);
          return (
            <div key={stars} className="flex items-center gap-3 text-xs">
              <span className="w-8 shrink-0 text-text-muted">{stars} {t.star}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-yellow transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-9 shrink-0 text-right tabular-nums text-text-subtle">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
