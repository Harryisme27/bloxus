import { Link } from "react-router-dom";
import { BadgeCheck, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { RarityBadge } from "@/components/RarityBadge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listProofs } from "@/lib/db/content";
import { formatPrice, relativeTime } from "@/lib/format";
import type { ProofRow } from "@/types/db";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    verified: "Đã xác minh",
    buyer: "Người mua",
    eyebrow: "Minh bạch",
    title: "Đơn hàng vừa giao",
    description: "Mỗi thẻ tương ứng một đơn đã giao và được xác minh.",
    allProofs: "Tất cả minh chứng",
  },
  en: {
    verified: "Verified",
    buyer: "Buyer",
    eyebrow: "Transparency",
    title: "Recently delivered",
    description: "Each card is a delivered and verified order.",
    allProofs: "All proofs",
  },
};

function ProofPill({ proof }: { proof: ProofRow }) {
  const t = usePick(STR);
  return (
    <div className="flex w-72 shrink-0 flex-col gap-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-semibold text-green">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {t.verified}
        </span>
        <span className="text-[11px] text-text-subtle">{relativeTime(proof.delivered_at)}</span>
      </div>
      <div>
        <p className="line-clamp-1 font-heading text-sm font-semibold text-text">{proof.item_name}</p>
        <p className="text-xs text-text-muted">{proof.game_name}</p>
      </div>
      <div className="flex items-center justify-between gap-2">
        {proof.rarity ? <RarityBadge rarity={proof.rarity} /> : <span />}
        {proof.amount !== null ? (
          <span className="font-mono text-sm font-bold tabular-nums text-yellow">
            {formatPrice(proof.amount)}
          </span>
        ) : null}
      </div>
      {proof.buyer_masked ? (
        <p className="text-[11px] text-text-subtle">
          {t.buyer} <span className="font-mono text-text-muted">{proof.buyer_masked}</span>
        </p>
      ) : null}
    </div>
  );
}

/** Auto-scrolling strip of recently delivered & verified orders (social proof). */
export function ProofTicker() {
  const t = usePick(STR);
  const { data, isPending } = useQuery({
    queryKey: ["proofs"],
    queryFn: listProofs,
  });

  const proofs = data ?? [];
  // Lỗi hoặc chưa có minh chứng nào → ẩn hẳn section (không chặn trang chủ).
  if (!isPending && proofs.length === 0) return null;

  // Duplicate the list so the marquee can loop seamlessly.
  const loop = [...proofs, ...proofs];

  return (
    <PageContainer className="py-14">
      <SectionHeading
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        action={
          <Link to="/proofs" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            {t.allProofs}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />

      {isPending ? (
        <div className="flex gap-3 overflow-hidden rounded-2xl border border-border bg-bg-subtle p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-72 shrink-0 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="um-ticker-wrap relative overflow-hidden rounded-2xl border border-border bg-bg-subtle py-4">
          {/* edge fades */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg-subtle to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg-subtle to-transparent"
          />
          <div className="um-ticker flex w-max gap-3 px-4">
            {loop.map((proof, i) => (
              <ProofPill key={`${proof.id}-${i}`} proof={proof} />
            ))}
          </div>
          <style>{`
            @keyframes um-ticker-scroll {
              from { transform: translateX(0); }
              to { transform: translateX(-50%); }
            }
            .um-ticker { animation: um-ticker-scroll 50s linear infinite; }
            .um-ticker-wrap:hover .um-ticker { animation-play-state: paused; }
            @media (prefers-reduced-motion: reduce) {
              .um-ticker { animation: none; }
            }
          `}</style>
        </div>
      )}
    </PageContainer>
  );
}
