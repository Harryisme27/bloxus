// Widget đánh giá Seller — hiện ở trang chi tiết đơn của KHÁCH khi đơn đã HOÀN
// THÀNH. Cho chọn 1–5 sao + nhận xét tuỳ chọn, gửi 1 lần / đơn.
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, BadgeCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrderReview, submitOrderReview } from "@/lib/db/content";
import { usePick } from "@/i18n";
import { cn } from "@/lib/utils";

const STR = {
  vi: {
    title: "Đánh giá người xử lý đơn",
    subtitle: "Cho biết trải nghiệm của bạn với người bán đã giao đơn này.",
    placeholder: "Nhận xét của bạn (không bắt buộc)...",
    submit: "Gửi đánh giá",
    submitting: "Đang gửi...",
    thanks: "Cảm ơn bạn đã đánh giá!",
    done: "Bạn đã đánh giá đơn này",
    pickStars: "Vui lòng chọn số sao.",
    starAria: (n: number) => `${n} sao`,
  },
  en: {
    title: "Rate the person who handled your order",
    subtitle: "Share your experience with the seller who delivered this order.",
    placeholder: "Your review (optional)...",
    submit: "Submit review",
    submitting: "Submitting...",
    thanks: "Thanks for your review!",
    done: "You've reviewed this order",
    pickStars: "Please pick a star rating.",
    starAria: (n: number) => `${n} star${n === 1 ? "" : "s"}`,
  },
};

export function ReviewWidget({ orderId }: { orderId: string }) {
  const t = usePick(STR);
  const queryClient = useQueryClient();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");

  const existingQuery = useQuery({
    queryKey: ["order-review", orderId],
    queryFn: () => getOrderReview(orderId),
  });

  const mutation = useMutation({
    mutationFn: () => submitOrderReview(orderId, stars, text.trim() || undefined),
    onSuccess: () => {
      toast.success(t.thanks);
      void queryClient.invalidateQueries({ queryKey: ["order-review", orderId] });
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (existingQuery.isPending) return null;

  const existing = existingQuery.data;
  if (existing) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <BadgeCheck className="h-5 w-5 shrink-0 text-green" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-text">{t.done}</p>
            <div className="mt-0.5 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn("h-4 w-4", i < existing.stars ? "fill-lemon text-lemon" : "text-text-subtle")}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function handleSubmit() {
    if (stars < 1) {
      toast.error(t.pickStars);
      return;
    }
    mutation.mutate();
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle className="text-base">{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <p className="text-sm text-text-muted">{t.subtitle}</p>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const n = i + 1;
            const filled = (hover || stars) >= n;
            return (
              <button
                key={n}
                type="button"
                aria-label={t.starAria(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setStars(n)}
                className="p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    filled ? "fill-lemon text-lemon" : "text-text-subtle",
                  )}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.placeholder}
          className="w-full rounded-lg border border-border bg-surface-3 px-3 py-2 text-sm text-text placeholder:text-text-subtle focus-visible:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
        />
        <Button onClick={handleSubmit} disabled={mutation.isPending}>
          <Send className="h-4 w-4" aria-hidden />
          {mutation.isPending ? t.submitting : t.submit}
        </Button>
      </CardContent>
    </Card>
  );
}
