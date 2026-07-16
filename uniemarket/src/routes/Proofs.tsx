import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  PackageCheck,
  Users,
  Star,
  BadgeCheck,
  ArrowRight,
  Clock,
  User2,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { RarityBadge } from "@/components/RarityBadge";
import { CountUpStat } from "@/components/content/CountUpStat";
import { Stars } from "@/components/content/Stars";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { SetupNotice } from "@/components/SetupNotice";
import { listProofs, listReviews } from "@/lib/db/content";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatPrice, relativeTime } from "@/lib/format";
import { DISCORD_URL } from "@/lib/constants";
import type { ProofRow, ReviewRow } from "@/types/db";
import { cn } from "@/lib/utils";

export function Proofs() {
  const proofsQuery = useQuery({
    queryKey: ["proofs"],
    queryFn: listProofs,
    enabled: isSupabaseConfigured,
  });
  const reviewsQuery = useQuery({
    queryKey: ["reviews"],
    queryFn: listReviews,
    enabled: isSupabaseConfigured,
  });

  const proofs = proofsQuery.data ?? [];
  const reviews = reviewsQuery.data ?? [];

  const proofGames = useMemo(
    () => Array.from(new Set(proofs.map((p) => p.game_name))),
    [proofs],
  );
  const [activeGame, setActiveGame] = useState("all");
  const filteredProofs =
    activeGame === "all" ? proofs : proofs.filter((p) => p.game_name === activeGame);

  const avgStars =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length
      : 0;

  return (
    <PageContainer className="py-10 sm:py-14">
      <SectionHeading
        eyebrow="Uy tín & minh bạch"
        title="Minh chứng giao dịch"
        description="Mỗi đơn hoàn thành đều được ghi lại kèm bằng chứng — và khách hàng đánh giá thật."
      />

      {!isSupabaseConfigured ? <SetupNotice /> : null}

      {/* Stats banner */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CountUpStat icon={PackageCheck} target={proofs.length} suffix="+" label="Đơn đã giao" />
        <CountUpStat icon={Users} target={proofs.length * 3} suffix="+" label="Khách hàng" />
        <CountUpStat icon={Star} target={avgStars} decimals={1} suffix="/5" label="Đánh giá TB" />
        <CountUpStat icon={ShieldCheck} target={100} suffix="%" label="Có minh chứng" />
      </div>

      {/* Proof feed */}
      <div className="mt-12">
        <SectionHeading eyebrow="Feed thời gian thực" title="Đơn hàng vừa được giao" />
        {proofGames.length > 0 ? (
          <div className="mb-5 flex flex-wrap gap-2">
            <GameChip label="Tất cả" active={activeGame === "all"} onClick={() => setActiveGame("all")} />
            {proofGames.map((g) => (
              <GameChip key={g} label={g} active={activeGame === g} onClick={() => setActiveGame(g)} />
            ))}
          </div>
        ) : null}

        {proofsQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))}
          </div>
        ) : filteredProofs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProofs.map((p) => (
              <ProofItem key={p.id} proof={p} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-text-muted">
            Chưa có minh chứng nào để hiển thị.
          </p>
        )}
      </div>

      {/* Reviews */}
      <div className="mt-14">
        <SectionHeading eyebrow="Khách hàng nói gì" title="Đánh giá từ cộng đồng" />
        {reviews.length > 0 ? (
          <>
            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-surface p-5">
              <span className="font-heading text-4xl font-extrabold text-yellow">
                {avgStars.toFixed(1)}
              </span>
              <div>
                <Stars value={avgStars} size={18} />
                <p className="mt-1 text-xs text-text-muted">Dựa trên {reviews.length} đánh giá</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <ReviewItem key={r.id} review={r} />
              ))}
            </div>
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-text-muted">
            Chưa có đánh giá nào.
          </p>
        )}
      </div>

      {/* Discord CTA */}
      <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-8 text-center">
        <h3 className="font-heading text-xl font-bold text-text">Tham gia cộng đồng Uniemarket</h3>
        <p className="max-w-md text-sm text-text-muted">
          Cập nhật hàng mới, khuyến mãi và xem thêm minh chứng giao dịch mỗi ngày.
        </p>
        <a href={DISCORD_URL} className={buttonVariants({ variant: "gold" })}>
          Vào Discord
          <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </PageContainer>
  );
}

function GameChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-yellow bg-yellow-soft text-yellow"
          : "border-border-strong bg-surface text-text-muted hover:border-yellow hover:text-text",
      )}
    >
      {label}
    </button>
  );
}

function ProofItem({ proof }: { proof: ProofRow }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-1 hover:border-yellow hover:shadow-glow-amber">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-semibold text-text">{proof.item_name}</p>
          <p className="truncate text-sm text-text-muted">{proof.game_name}</p>
        </div>
        {proof.rarity ? <RarityBadge rarity={proof.rarity} className="shrink-0" /> : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-semibold text-green">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Đã xác minh
        </span>
        {proof.amount !== null ? (
          <span className="font-mono text-lg font-bold tabular-nums text-yellow">
            {formatPrice(proof.amount)}
          </span>
        ) : null}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-text-subtle">
        <span className="inline-flex items-center gap-1.5">
          <User2 className="h-3.5 w-3.5" aria-hidden />
          <span className="text-text-muted">{proof.buyer_masked ?? "Ẩn danh"}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {relativeTime(proof.delivered_at)}
        </span>
      </div>
      {proof.staff_name ? (
        <p className="text-xs text-text-subtle">
          Xử lý bởi <span className="font-medium text-text-muted">{proof.staff_name}</span>
        </p>
      ) : null}
    </article>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ReviewItem({ review }: { review: ReviewRow }) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-yellow hover:shadow-glow-amber">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-soft font-heading text-sm font-bold text-yellow">
          {initialsOf(review.author)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-heading text-sm font-semibold text-text">{review.author}</p>
            {review.verified_purchase ? (
              <BadgeCheck className="h-4 w-4 shrink-0 text-green" aria-label="Đã mua hàng" />
            ) : null}
          </div>
          <Stars value={review.stars} size={14} className="mt-0.5" />
        </div>
      </div>
      <p className="flex-1 text-sm leading-relaxed text-text-muted">"{review.text}"</p>
      <div className="flex items-center justify-between gap-2 border-t border-border pt-3 text-xs">
        {review.source ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 font-medium text-text-muted">
            {review.source}
          </span>
        ) : (
          <span />
        )}
        {review.verified_purchase ? (
          <span className="font-medium text-success">Đã mua hàng</span>
        ) : (
          <span className="text-text-subtle">{relativeTime(review.created_at)}</span>
        )}
      </div>
    </article>
  );
}
