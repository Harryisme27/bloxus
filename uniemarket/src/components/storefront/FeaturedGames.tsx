import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { GameCard } from "@/components/GameCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listCategories } from "@/lib/db/catalog";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    eyebrow: "Danh mục",
    title: "Trò chơi",
    description: "Chọn trò chơi để xem toàn bộ vật phẩm và dịch vụ đang bán.",
    viewAll: "Xem tất cả",
    loadError: "Không tải được danh mục. Vui lòng thử lại.",
    retry: "Thử lại",
    empty: "Chưa có danh mục nào — quay lại sau nhé.",
  },
  en: {
    eyebrow: "Categories",
    title: "Games",
    description: "Pick a game to see all the items and services on sale.",
    viewAll: "View all",
    loadError: "Couldn't load categories. Please try again.",
    retry: "Try again",
    empty: "No categories yet — check back soon.",
  },
};

/** "Trò chơi nổi bật" grid — danh mục nổi bật từ DB, fallback về tất cả. */
export function FeaturedGames() {
  const t = usePick(STR);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories({ activeOnly: true }),
  });

  // Hiện TẤT CẢ game đang bán (nổi bật lên đầu) — không ẩn sau "Xem tất cả".
  const categories = [...(data ?? [])].sort(
    (a, b) => Number(b.is_featured) - Number(a.is_featured),
  );

  return (
    <PageContainer className="py-14">
      <SectionHeading
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        action={
          <Link to="/games" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            {t.viewAll}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />
      {isPending ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
          <p className="text-sm text-text-muted">{t.loadError}</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => refetch()}>
            {t.retry}
          </Button>
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <GameCard key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">{t.empty}</p>
      )}
    </PageContainer>
  );
}
