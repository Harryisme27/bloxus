import { useMemo, useState } from "react";
import { Search, Gamepad2, PackageSearch, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/PageContainer";
import { GameCard } from "@/components/GameCard";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/storefront/EmptyState";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listCategories } from "@/lib/db/catalog";

type GameSort = "featured" | "name-asc";

export function GamesCatalog() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<GameSort>("featured");

  const {
    data: allCategories,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories({ activeOnly: true }),
    enabled: isSupabaseConfigured,
  });

  const categories = useMemo(() => {
    const list = allCategories ?? [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? list.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.tagline ?? "").toLowerCase().includes(q),
        )
      : list;

    const sorted = [...filtered];
    if (sort === "name-asc") {
      sorted.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    } else {
      // featured: nổi bật trước, giữ nguyên sort_order từ DB trong từng nhóm.
      sorted.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
    }
    return sorted;
  }, [allCategories, query, sort]);

  if (!isSupabaseConfigured) {
    return (
      <PageContainer className="py-10 sm:py-14">
        <h1 className="mb-6 font-heading text-3xl font-bold text-text sm:text-4xl">Trò chơi</h1>
        <SetupNotice />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-10 sm:py-14">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-soft text-yellow">
            <Gamepad2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-text sm:text-4xl">
              Danh mục trò chơi
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Chọn trò chơi để xem vật phẩm và dịch vụ đang bán.
            </p>
          </div>
        </div>

        {/* Search + sort */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm trò chơi theo tên…"
              className="pl-9"
              aria-label="Tìm trò chơi"
            />
          </div>
          <div className="sm:w-56">
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as GameSort)}
              aria-label="Sắp xếp trò chơi"
            >
              <option value="featured">Nổi bật trước</option>
              <option value="name-asc">Tên: A → Z</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading / error / grid / empty */}
      {isPending ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={PackageSearch}
          title="Không tải được danh mục"
          description="Có lỗi khi kết nối máy chủ. Kiểm tra mạng rồi thử lại nhé."
          action={
            <Button type="button" variant="primary" size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
          }
        />
      ) : categories.length > 0 ? (
        <>
          <p className="mb-4 flex items-center gap-1.5 text-sm text-text-subtle">
            <Package className="h-4 w-4" aria-hidden="true" />
            Hiển thị {categories.length} trò chơi
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <GameCard key={category.id} category={category} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={PackageSearch}
          title="Không tìm thấy trò chơi nào"
          description={
            query
              ? `Không có trò chơi nào khớp với "${query}". Thử từ khoá khác nhé.`
              : "Cửa hàng chưa có danh mục nào — quay lại sau nhé."
          }
          action={
            query ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => setQuery("")}>
                Xoá tìm kiếm
              </Button>
            ) : undefined
          }
        />
      )}
    </PageContainer>
  );
}
