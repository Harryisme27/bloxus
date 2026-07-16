import { BadgeCheck, Quote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/storefront/StarRating";
import { listReviews } from "@/lib/db/content";
import type { ReviewRow } from "@/types/db";

function ReviewCard({ review }: { review: ReviewRow }) {
  const initials = review.author
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="flex flex-col gap-4 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-yellow hover:shadow-glow-amber">
      <div className="flex items-center justify-between">
        <StarRating stars={review.stars} />
        <Quote className="h-5 w-5 text-text-disabled" aria-hidden="true" />
      </div>
      <CardContent className="flex-1 p-0 pt-0">
        <p className="text-sm leading-relaxed text-text-muted">“{review.text}”</p>
      </CardContent>
      <div className="flex items-center gap-3 border-t border-border pt-4">
        {review.avatar_url ? (
          <img
            src={review.avatar_url}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-soft text-sm font-bold text-yellow">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-sm font-semibold text-text">
            {review.author}
            {review.verified_purchase ? (
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-green" aria-hidden="true" />
            ) : null}
          </p>
          <p className="truncate text-xs text-text-subtle">
            {review.verified_purchase ? "Đã mua hàng" : ""}
            {review.verified_purchase && review.source ? " · " : ""}
            {review.source ?? ""}
          </p>
        </div>
      </div>
    </Card>
  );
}

/** Homepage preview of 3 customer reviews as cards. */
export function ReviewsPreview() {
  const { data, isPending } = useQuery({
    queryKey: ["reviews"],
    queryFn: listReviews,
  });

  const reviews = (data ?? []).filter((r) => r.stars >= 4).slice(0, 3);
  if (!isPending && reviews.length === 0) return null;

  return (
    <section className="bg-bg-subtle py-14">
      <PageContainer>
        <SectionHeading
          eyebrow="Đánh giá"
          title="Khách hàng nói gì"
          description="Nhiều game thủ đã tin tưởng Uniemarket. Đây là một vài lời nhận xét."
        />
        {isPending ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </PageContainer>
    </section>
  );
}
