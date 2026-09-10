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
import { usePick } from "@/i18n";

const STR = {
  vi: {
    gamesTitle: "Trò chơi",
    catalogTitle: "Danh mục trò chơi",
    catalogSubtitle: "Chọn trò chơi để xem vật phẩm và dịch vụ đang bán.",
    searchPlaceholder: "Tìm trò chơi theo tên…",
    searchAria: "Tìm trò chơi",
    sortAria: "Sắp xếp trò chơi",
    sortFeatured: "Nổi bật trước",
    sortNameAsc: "Tên: A → Z",
    loadErrorTitle: "Không tải được danh mục",
    connectError: "Có lỗi khi kết nối máy chủ. Kiểm tra mạng rồi thử lại nhé.",
    retry: "Thử lại",
    showing: (n: number) => `Hiển thị ${n} trò chơi`,
    emptyTitle: "Không tìm thấy trò chơi nào",
    emptyQuery: (q: string) => `Không có trò chơi nào khớp với "${q}". Thử từ khoá khác nhé.`,
    emptyNone: "Cửa hàng chưa có danh mục nào — quay lại sau nhé.",
    clearSearch: "Xoá tìm kiếm",
  },
  en: {
    gamesTitle: "Games",
    catalogTitle: "Game catalog",
    catalogSubtitle: "Pick a game to see the items and services on sale.",
    searchPlaceholder: "Search games by name…",
    searchAria: "Search games",
    sortAria: "Sort games",
    sortFeatured: "Featured first",
    sortNameAsc: "Name: A → Z",
    loadErrorTitle: "Couldn't load the catalog",
    connectError: "There was a problem connecting to the server. Check your connection and try again.",
    retry: "Try again",
    showing: (n: number) => `Showing ${n} games`,
    emptyTitle: "No games found",
    emptyQuery: (q: string) => `No games match "${q}". Try a different keyword.`,
    emptyNone: "The store has no categories yet — check back soon.",
    clearSearch: "Clear search",
  },
};

type GameSort = "featured" | "name-asc";

export function GamesCatalog() {
  const t = usePick(STR);
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
        <h1 className="mb-6 font-heading text-3xl font-bold text-text sm:text-4xl">{t.gamesTitle}</h1>
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
              {t.catalogTitle}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              {t.catalogSubtitle}
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
              placeholder={t.searchPlaceholder}
              className="pl-9"
              aria-label={t.searchAria}
            />
          </div>
          <div className="sm:w-56">
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as GameSort)}
              aria-label={t.sortAria}
            >
              <option value="featured">{t.sortFeatured}</option>
              <option value="name-asc">{t.sortNameAsc}</option>
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
          title={t.loadErrorTitle}
          description={t.connectError}
          action={
            <Button type="button" variant="primary" size="sm" onClick={() => refetch()}>
              {t.retry}
            </Button>
          }
        />
      ) : categories.length > 0 ? (
        <>
          <p className="mb-4 flex items-center gap-1.5 text-sm text-text-subtle">
            <Package className="h-4 w-4" aria-hidden="true" />
            {t.showing(categories.length)}
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
          title={t.emptyTitle}
          description={query ? t.emptyQuery(query) : t.emptyNone}
          action={
            query ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => setQuery("")}>
                {t.clearSearch}
              </Button>
            ) : undefined
          }
        />
      )}
    </PageContainer>
  );
}
