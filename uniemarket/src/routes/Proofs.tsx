import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  PackageCheck,
  Users,
  Star,
  MessageCircle,
  ArrowRight,
  Filter,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { CountUpStat } from "@/components/content/CountUpStat";
import { ProofCard } from "@/components/content/ProofCard";
import { ReviewCard } from "@/components/content/ReviewCard";
import { RatingSummary } from "@/components/content/RatingSummary";
import { getProofs, getReviews, getGames } from "@/lib/api";
import { DISCORD_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Proofs() {
  const proofs = useMemo(() => getProofs(), []);
  const reviews = useMemo(() => getReviews(), []);
  const games = useMemo(() => getGames(), []);

  // Map gameName -> accentColor for tinting proof thumbnails.
  const accentByGame = useMemo(() => {
    const map: Record<string, string> = {};
    for (const g of games) map[g.name] = g.accentColor;
    return map;
  }, [games]);

  // Distinct games that actually appear in the proofs feed, for the filter.
  const proofGames = useMemo(() => {
    const set = new Set(proofs.map((p) => p.gameName));
    return Array.from(set);
  }, [proofs]);

  const [activeGame, setActiveGame] = useState<string>("all");
  const filteredProofs =
    activeGame === "all" ? proofs : proofs.filter((p) => p.gameName === activeGame);

  // Review aggregates for the Trustpilot-style summary.
  const { average, distribution } = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    let sum = 0;
    for (const r of reviews) {
      sum += r.stars;
      const idx = Math.min(5, Math.max(1, Math.round(r.stars))) - 1;
      dist[idx] += 1;
    }
    return { average: reviews.length ? sum / reviews.length : 0, distribution: dist };
  }, [reviews]);

  return (
    <div className="pb-20">
      {/* Hero + stats banner */}
      <div className="border-b border-border bg-bg-subtle">
        <PageContainer className="py-14 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-soft px-3 py-1 text-xs font-semibold text-green">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Minh bạch từng đơn hàng
            </span>
            <h1 className="mt-4 font-heading text-4xl font-bold text-text sm:text-5xl">
              Minh chứng giao dịch
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-text-muted">
              Mỗi đơn hoàn tất tại Uniemarket đều được ghi lại kèm ảnh giao hàng và nhân viên xử lý.
              Đây là lý do hàng nghìn game thủ tin tưởng chúng tôi.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            <CountUpStat icon={PackageCheck} target={12480} suffix="+" label="Đơn đã giao" />
            <CountUpStat icon={Users} target={8900} suffix="+" label="Khách hàng tin dùng" />
            <CountUpStat icon={Star} target={4.9} decimals={1} suffix="/5" label="Đánh giá trung bình" />
            <CountUpStat icon={ShieldCheck} target={100} suffix="%" label="Giao dịch có minh chứng" />
          </div>
        </PageContainer>
      </div>

      <PageContainer className="pt-14">
        {/* Proof feed */}
        <SectionHeading
          eyebrow="Feed thời gian thực"
          title="Đơn hàng vừa được giao"
          description="Danh sách cập nhật các đơn đã xác minh gần đây. Thông tin người mua được ẩn để bảo vệ quyền riêng tư."
        />

        {/* Filter-by-game control */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-sm text-text-subtle">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Lọc theo game:
          </span>
          <GameChip
            label="Tất cả"
            active={activeGame === "all"}
            onClick={() => setActiveGame("all")}
          />
          {proofGames.map((name) => (
            <GameChip
              key={name}
              label={name}
              active={activeGame === name}
              onClick={() => setActiveGame(name)}
            />
          ))}
        </div>

        {filteredProofs.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProofs.map((proof) => (
              <ProofCard key={proof.id} proof={proof} accentColor={accentByGame[proof.gameName]} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-12 text-center">
            <p className="text-text-muted">Chưa có minh chứng nào cho game này.</p>
          </div>
        )}

        {/* Rating summary + reviews */}
        <div className="mt-20">
          <SectionHeading
            eyebrow="Khách hàng nói gì"
            title="Đánh giá từ cộng đồng"
            description="Tổng hợp đánh giá thực tế từ Trustpilot, Discord và ngay trên trang."
          />
          <RatingSummary average={average} count={reviews.length} distribution={distribution} />

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>

        {/* Discord / community CTA */}
        <div className="mt-20 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-yellow-soft to-surface p-8 sm:p-10">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow text-text-on-yellow">
                <MessageCircle className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-heading text-2xl font-bold text-text">
                Tham gia cộng đồng Uniemarket
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                Cập nhật hàng mới, khuyến mãi và xem thêm minh chứng giao dịch mỗi ngày trong Discord
                của chúng tôi.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:items-end">
              <a href={DISCORD_URL} target="_blank" rel="noreferrer">
                <Button variant="primary" size="lg">
                  <MessageCircle className="h-5 w-5" />
                  Vào Discord
                </Button>
              </a>
              <Link
                to="/tutorial"
                className="inline-flex items-center gap-1 text-sm font-medium text-yellow hover:underline"
              >
                Xem cách mua hàng
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

interface GameChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function GameChip({ label, active, onClick }: GameChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-transparent bg-yellow text-text-on-yellow"
          : "border-border-strong bg-surface text-text-muted hover:border-yellow hover:text-text",
      )}
    >
      {label}
    </button>
  );
}
