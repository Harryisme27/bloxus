import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { GameCard } from "@/components/GameCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listCategories, listCategoryFolders } from "@/lib/db/catalog";
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
    otherFolder: "Khác",
  },
  en: {
    eyebrow: "Categories",
    title: "Games",
    description: "Pick a game to see all the items and services on sale.",
    viewAll: "View all",
    loadError: "Couldn't load categories. Please try again.",
    retry: "Try again",
    empty: "No categories yet — check back soon.",
    otherFolder: "Other",
  },
};

/** "Trò chơi nổi bật" grid — danh mục nổi bật từ DB, fallback về tất cả. */
export function FeaturedGames() {
  const t = usePick(STR);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories({ activeOnly: true }),
  });
  const foldersQuery = useQuery({ queryKey: ["category-folders"], queryFn: listCategoryFolders });

  // Hiện TẤT CẢ game đang bán (nổi bật lên đầu) — không ẩn sau "Xem tất cả".
  const categories = [...(data ?? [])].sort(
    (a, b) => Number(b.is_featured) - Number(a.is_featured),
  );

  // Gom theo folder (Roblox, CS2...). Folder có game -> 1 nhóm; game chưa xếp -> "Khác".
  const folders = foldersQuery.data ?? [];
  const groups: Array<{ id: string; name: string | null; items: typeof categories }> = [];
  for (const f of folders) {
    const items = categories.filter((c) => c.folder_id === f.id);
    if (items.length > 0) groups.push({ id: f.id, name: f.name, items });
  }
  const folderIds = new Set(folders.map((f) => f.id));
  const ungrouped = categories.filter((c) => !c.folder_id || !folderIds.has(c.folder_id));
  if (ungrouped.length > 0)
    groups.push({ id: "__other__", name: groups.length > 0 ? t.otherFolder : null, items: ungrouped });

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
        <div className="space-y-10">
          {groups.map((g) => (
            <div key={g.id}>
              {g.name ? (
                <h3 className="mb-4 font-heading text-lg font-bold text-text">{g.name}</h3>
              ) : null}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {g.items.map((category) => (
                  <GameCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">{t.empty}</p>
      )}
    </PageContainer>
  );
}
