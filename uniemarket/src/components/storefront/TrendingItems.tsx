import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { ProductCard } from "@/components/ProductCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listProducts } from "@/lib/db/catalog";

/** "Vật phẩm nổi bật / bán chạy" — sản phẩm is_featured từ DB. */
export function TrendingItems() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => listProducts({ featured: true }),
  });

  const products = (data ?? []).slice(0, 8);

  return (
    <section className="bg-bg-subtle py-14">
      <PageContainer>
        <SectionHeading
          eyebrow="Bán chạy"
          title={
            <span className="inline-flex items-center gap-2">
              <Flame className="h-6 w-6 text-yellow" aria-hidden="true" />
              Vật phẩm nổi bật
            </span>
          }
          description="Những vật phẩm và dịch vụ được săn lùng nhiều nhất tuần này."
          action={
            <Link to="/games" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Khám phá thêm
            </Link>
          }
        />
        {isPending ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
            <p className="text-sm text-text-muted">Không tải được sản phẩm. Vui lòng thử lại.</p>
            <Button type="button" variant="secondary" size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">Chưa có sản phẩm nổi bật nào.</p>
        )}
      </PageContainer>
    </section>
  );
}
