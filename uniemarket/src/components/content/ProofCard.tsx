import { BadgeCheck, ImageIcon, User2, Clock } from "lucide-react";
import type { Proof } from "@/types";
import { RarityBadge } from "@/components/RarityBadge";
import { formatPrice, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ProofCardProps {
  proof: Proof;
  /** Optional hex accent (from the matching Game) used to tint the thumbnail. */
  accentColor?: string;
  className?: string;
}

/** A single "proof of delivery" card for the /proofs trust feed. */
export function ProofCard({ proof, accentColor = "#6FCF5B", className }: ProofCardProps) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200",
        "hover:-translate-y-1 hover:border-yellow hover:shadow-glow-amber",
        className,
      )}
    >
      {/* Placeholder "delivery screenshot" thumbnail */}
      <div
        className="relative flex h-32 items-center justify-center border-b border-border"
        style={{
          background: `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}0d 55%, transparent 100%)`,
        }}
      >
        <div className="flex flex-col items-center gap-1 text-text-subtle">
          <ImageIcon className="h-7 w-7" aria-hidden="true" />
          <span className="text-[11px] font-medium">Ảnh giao hàng</span>
        </div>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-green-soft px-2.5 py-1 text-xs font-semibold text-green">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Đã xác minh
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-semibold text-text">{proof.itemName}</p>
            <p className="truncate text-sm text-text-muted">{proof.gameName}</p>
          </div>
          <RarityBadge rarity={proof.rarity} className="shrink-0" />
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-lg font-bold tabular-nums text-yellow">
            {formatPrice(proof.amountUSD)}
          </span>
          <span className="font-mono text-xs text-text-subtle">{proof.orderId}</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <User2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-text-muted">{proof.buyerMasked}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {relativeTime(proof.deliveredAt)}
          </span>
        </div>

        <p className="text-xs text-text-subtle">
          Xử lý bởi <span className="font-medium text-text-muted">{proof.staffName}</span>
        </p>
      </div>
    </article>
  );
}
