import { BadgeCheck } from "lucide-react";
import type { Review } from "@/types";
import { Stars } from "@/components/content/Stars";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ReviewCardProps {
  review: Review;
  className?: string;
}

/** Deterministic accent-ish initials avatar background from the author's name. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SOURCE_LABEL: Record<Review["source"], string> = {
  Trustpilot: "Trustpilot",
  "On-site": "Trên trang",
  Discord: "Discord",
};

/** A customer review/testimonial card. */
export function ReviewCard({ review, className }: ReviewCardProps) {
  return (
    <article
      className={cn(
        "flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-5 transition-all duration-200",
        "hover:-translate-y-1 hover:border-yellow hover:shadow-glow-amber",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-soft font-heading text-sm font-bold text-yellow">
          {initialsOf(review.author)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-heading text-sm font-semibold text-text">{review.author}</p>
            {review.verifiedPurchase ? (
              <BadgeCheck className="h-4 w-4 shrink-0 text-green" aria-label="Đã mua hàng" />
            ) : null}
          </div>
          <Stars value={review.stars} size={14} className="mt-0.5" />
        </div>
      </div>

      <p className="flex-1 text-sm leading-relaxed text-text-muted">"{review.text}"</p>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 font-medium text-text-muted">
          {SOURCE_LABEL[review.source]}
        </span>
        {review.verifiedPurchase ? (
          <span className="font-medium text-success">Đã mua hàng</span>
        ) : (
          <span className="text-text-subtle">{relativeTime(review.createdAt)}</span>
        )}
      </div>
    </article>
  );
}
