import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  PackageCheck,
  Users,
  Star,
  BadgeCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  ImageOff,
  User2,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { RarityBadge } from "@/components/RarityBadge";
import { CountUpStat } from "@/components/content/CountUpStat";
import { Stars } from "@/components/content/Stars";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SetupNotice } from "@/components/SetupNotice";
import { listProofs, listReviews } from "@/lib/db/content";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatPrice, relativeTime } from "@/lib/format";
import { DISCORD_URL } from "@/lib/constants";
import type { ProofRow, ReviewRow } from "@/types/db";
import { cn } from "@/lib/utils";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    eyebrow: "Uy tín & minh bạch",
    title: "Minh chứng giao dịch",
    description: "Mỗi đơn hoàn thành đều được ghi lại kèm bằng chứng — và khách hàng đánh giá thật.",
    statDelivered: "Đơn đã giao",
    statCustomers: "Khách hàng",
    statAvg: "Đánh giá TB",
    statWithProof: "Có minh chứng",
    feedEyebrow: "Feed thời gian thực",
    feedTitle: "Đơn hàng vừa được giao",
    all: "Tất cả",
    noProofs: "Chưa có minh chứng nào để hiển thị.",
    reviewsEyebrow: "Khách hàng nói gì",
    reviewsTitle: "Đánh giá từ cộng đồng",
    basedOn: (n: number) => `Dựa trên ${n} đánh giá`,
    noReviews: "Chưa có đánh giá nào.",
    ctaTitle: "Tham gia cộng đồng Uniemarket",
    ctaBody: "Cập nhật hàng mới, khuyến mãi và xem thêm minh chứng giao dịch mỗi ngày.",
    ctaButton: "Vào Discord",
    verified: "Đã xác minh",
    anonymous: "Ẩn danh",
    handledBy: "Xử lý bởi",
    verifiedPurchase: "Đã mua hàng",
    viewDetails: "Xem chi tiết",
    prev: "Trước",
    next: "Sau",
    pageInfo: (cur: number, total: number) => `Trang ${cur}/${total}`,
    detailTitle: "Chi tiết minh chứng",
    proofImageAlt: "Ảnh giao hàng",
    noImage: "Đơn này không có ảnh minh chứng.",
    amountLabel: "Số tiền",
    dateLabel: "Thời gian giao",
  },
  en: {
    eyebrow: "Trusted & transparent",
    title: "Transaction proof",
    description: "Every completed order is recorded with proof — and customers leave real reviews.",
    statDelivered: "Orders delivered",
    statCustomers: "Customers",
    statAvg: "Avg rating",
    statWithProof: "With proof",
    feedEyebrow: "Real-time feed",
    feedTitle: "Recently delivered orders",
    all: "All",
    noProofs: "No proof to show yet.",
    reviewsEyebrow: "What customers say",
    reviewsTitle: "Reviews from the community",
    basedOn: (n: number) => `Based on ${n} review${n === 1 ? "" : "s"}`,
    noReviews: "No reviews yet.",
    ctaTitle: "Join the Uniemarket community",
    ctaBody: "New stock, promotions, and more transaction proof every day.",
    ctaButton: "Open Discord",
    verified: "Verified",
    anonymous: "Anonymous",
    handledBy: "Handled by",
    verifiedPurchase: "Verified purchase",
    viewDetails: "View details",
    prev: "Previous",
    next: "Next",
    pageInfo: (cur: number, total: number) => `Page ${cur}/${total}`,
    detailTitle: "Proof details",
    proofImageAlt: "Delivery photo",
    noImage: "This order has no proof image.",
    amountLabel: "Amount",
    dateLabel: "Delivered at",
  },
};

const PROOFS_PER_PAGE = 10;

export function Proofs() {
  const t = usePick(STR);
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
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<ProofRow | null>(null);
  const filteredProofs =
    activeGame === "all" ? proofs : proofs.filter((p) => p.game_name === activeGame);

  // Đổi bộ lọc thì về trang 1.
  useEffect(() => {
    setPage(1);
  }, [activeGame]);

  const totalPages = Math.max(1, Math.ceil(filteredProofs.length / PROOFS_PER_PAGE));
  const pageProofs = filteredProofs.slice((page - 1) * PROOFS_PER_PAGE, page * PROOFS_PER_PAGE);

  const avgStars =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length
      : 0;

  return (
    <PageContainer className="py-10 sm:py-14">
      <SectionHeading
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
      />

      {!isSupabaseConfigured ? <SetupNotice /> : null}

      {/* Stats banner */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CountUpStat icon={PackageCheck} target={proofs.length} suffix="+" label={t.statDelivered} />
        <CountUpStat icon={Users} target={proofs.length * 3} suffix="+" label={t.statCustomers} />
        <CountUpStat icon={Star} target={avgStars} decimals={1} suffix="/5" label={t.statAvg} />
        <CountUpStat icon={ShieldCheck} target={100} suffix="%" label={t.statWithProof} />
      </div>

      {/* Proof feed */}
      <div className="mt-12">
        <SectionHeading eyebrow={t.feedEyebrow} title={t.feedTitle} />
        {proofGames.length > 0 ? (
          <div className="mb-5 flex flex-wrap gap-2">
            <GameChip label={t.all} active={activeGame === "all"} onClick={() => setActiveGame("all")} />
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
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pageProofs.map((p) => (
                <ProofItem key={p.id} proof={p} onOpen={() => setDetail(p)} />
              ))}
            </div>
            {totalPages > 1 ? (
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden /> {t.prev}
                </Button>
                <span className="tabular-nums text-sm text-text-muted">
                  {t.pageInfo(page, totalPages)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  {t.next} <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-text-muted">
            {t.noProofs}
          </p>
        )}
      </div>

      <ProofDetailDialog proof={detail} onClose={() => setDetail(null)} />

      {/* Reviews */}
      <div className="mt-14">
        <SectionHeading eyebrow={t.reviewsEyebrow} title={t.reviewsTitle} />
        {reviews.length > 0 ? (
          <>
            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-surface p-5">
              <span className="font-heading text-4xl font-extrabold text-yellow">
                {avgStars.toFixed(1)}
              </span>
              <div>
                <Stars value={avgStars} size={18} />
                <p className="mt-1 text-xs text-text-muted">{t.basedOn(reviews.length)}</p>
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
            {t.noReviews}
          </p>
        )}
      </div>

      {/* Discord CTA */}
      <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-8 text-center">
        <h3 className="font-heading text-xl font-bold text-text">{t.ctaTitle}</h3>
        <p className="max-w-md text-sm text-text-muted">
          {t.ctaBody}
        </p>
        <a href={DISCORD_URL} className={buttonVariants({ variant: "gold" })}>
          {t.ctaButton}
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

function ProofItem({ proof, onOpen }: { proof: ProofRow; onOpen: () => void }) {
  const t = usePick(STR);
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-1 hover:border-yellow hover:shadow-glow-amber">
      {/* Thumbnail ảnh proof (nếu có) — bấm để phóng to trong dialog */}
      {proof.proof_image_url ? (
        <button
          type="button"
          onClick={onOpen}
          className="group relative -mx-1 -mt-1 mb-1 overflow-hidden rounded-xl border border-border"
        >
          <img
            src={proof.proof_image_url}
            alt={t.proofImageAlt}
            loading="lazy"
            className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-semibold text-green">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> {t.verified}
          </span>
        </button>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-semibold text-text">{proof.item_name}</p>
          <p className="truncate text-sm text-text-muted">{proof.game_name}</p>
        </div>
        {proof.rarity ? <RarityBadge rarity={proof.rarity} className="shrink-0" /> : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        {!proof.proof_image_url ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-semibold text-green">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> {t.verified}
          </span>
        ) : (
          <span />
        )}
        {proof.amount !== null ? (
          <span className="font-mono text-lg font-bold tabular-nums text-yellow">
            {formatPrice(proof.amount)}
          </span>
        ) : null}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-text-subtle">
        <span className="inline-flex items-center gap-1.5">
          <User2 className="h-3.5 w-3.5" aria-hidden />
          <span className="text-text-muted">{proof.buyer_masked ?? t.anonymous}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {relativeTime(proof.delivered_at)}
        </span>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-1 self-start text-xs font-semibold text-yellow hover:text-yellow-hover"
      >
        {t.viewDetails} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </button>
    </article>
  );
}

function ProofDetailDialog({ proof, onClose }: { proof: ProofRow | null; onClose: () => void }) {
  const t = usePick(STR);
  return (
    <Dialog open={proof !== null} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      {proof ? (
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{proof.item_name}</DialogTitle>
            <DialogDescription>{proof.game_name}</DialogDescription>
          </DialogHeader>

          {proof.proof_image_url ? (
            <img
              src={proof.proof_image_url}
              alt={t.proofImageAlt}
              className="max-h-[50vh] w-full rounded-xl border border-border object-contain"
            />
          ) : (
            <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong text-text-subtle">
              <ImageOff className="h-7 w-7" aria-hidden />
              <span className="text-sm">{t.noImage}</span>
            </div>
          )}

          <dl className="mt-2 space-y-2 text-sm">
            {proof.amount !== null ? (
              <Row label={t.amountLabel} value={formatPrice(proof.amount)} accent />
            ) : null}
            <Row label={t.dateLabel} value={relativeTime(proof.delivered_at)} />
            {proof.buyer_masked ? <Row label={t.anonymous} value={proof.buyer_masked} /> : null}
            {proof.staff_name ? <Row label={t.handledBy} value={proof.staff_name} /> : null}
          </dl>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-2 first:border-t-0 first:pt-0">
      <dt className="text-text-subtle">{label}</dt>
      <dd className={cn("font-medium", accent ? "font-mono tabular-nums text-yellow" : "text-text")}>
        {value}
      </dd>
    </div>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ReviewItem({ review }: { review: ReviewRow }) {
  const t = usePick(STR);
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
              <BadgeCheck className="h-4 w-4 shrink-0 text-green" aria-label={t.verifiedPurchase} />
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
          <span className="font-medium text-success">{t.verifiedPurchase}</span>
        ) : (
          <span className="text-text-subtle">{relativeTime(review.created_at)}</span>
        )}
      </div>
    </article>
  );
}
