import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { GameCard } from "@/components/GameCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listCategories } from "@/lib/db/catalog";

/** "Trò chơi nổi bật" grid — danh mục nổi bật từ DB, fallback về tất cả. */
export function FeaturedGames() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories({ activeOnly: true }),
  });

  const featured = (data ?? []).filter((c) => c.is_featured);
  const categories = (featured.length > 0 ? featured : data ?? []).slice(0, 8);

  return (
    <PageContainer className="py-14">
      <SectionHeading
        eyebrow="Danh mục"
        title="Trò chơi nổi bật"
        description="Chọn trò chơi để xem toàn bộ vật phẩm và dịch vụ đang bán."
        action={
          <Link to="/games" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Xem tất cả
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
          <p className="text-sm text-text-muted">Không tải được danh mục. Vui lòng thử lại.</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <GameCard key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">Chưa có danh mục nào — quay lại sau nhé.</p>
      )}
    </PageContainer>
  );
}
