// Thanh tìm kiếm navbar THẬT (trước đây chỉ là div trang trí):
// - Bấm vào ô (chưa gõ gì) -> panel danh mục trò chơi (Phổ biến / A-Z,
//   cột "Phổ biến nhất" bên trái) để chọn nhanh không cần gõ.
// - Gõ >= 2 ký tự -> dropdown kết quả live (game + sản phẩm), debounce 250ms.
//   Enter mở kết quả đầu tiên; Escape / click ra ngoài để đóng.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Flame, Gamepad2, Loader2, Search } from "lucide-react";
import { searchCatalog, listCategories } from "@/lib/db/catalog";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { usePick, useT } from "@/i18n";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/types/db";

const STR = {
  vi: {
    games: "Trò chơi",
    products: "Sản phẩm",
    noResults: (q: string) => `Không tìm thấy kết quả cho "${q}"`,
    searchAria: "Tìm kiếm",
    mostPopular: "Phổ biến nhất",
    tabPopular: "Phổ biến",
    tabAz: "A-Z",
    viewAll: "Xem tất cả trò chơi",
  },
  en: {
    games: "Games",
    products: "Products",
    noResults: (q: string) => `No results for "${q}"`,
    searchAria: "Search",
    mostPopular: "Most popular",
    tabPopular: "Popular",
    tabAz: "A-Z",
    viewAll: "View all games",
  },
};

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function GameIcon({ category, className }: { category: CategoryRow; className?: string }) {
  return category.icon_url ? (
    <img
      src={category.icon_url}
      alt=""
      className={cn("shrink-0 rounded-lg object-cover", className)}
    />
  ) : (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-surface-3 text-text-muted",
        className,
      )}
    >
      <Gamepad2 className="h-4 w-4" aria-hidden />
    </span>
  );
}

export function NavbarSearch({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const t = usePick(STR);
  const s = useT();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"popular" | "az">("popular");

  // Debounce 250ms để không query mỗi phím gõ.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(id);
  }, [q]);

  const enabled = isSupabaseConfigured && debounced.length >= 2;
  const query = useQuery({
    queryKey: ["nav-search", debounced],
    queryFn: () => searchCatalog(debounced),
    enabled,
    staleTime: 30_000,
  });

  // Danh mục trò chơi cho panel khi chưa gõ gì (cache chung key "categories").
  const catsQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories({ activeOnly: true }),
    enabled: isSupabaseConfigured && open,
    staleTime: 60_000,
  });

  // Đóng khi click ra ngoài / Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const categories = query.data?.categories ?? [];
  const products = query.data?.products ?? [];

  const allCats = useMemo(() => catsQuery.data ?? [], [catsQuery.data]);
  // Phổ biến: nổi bật trước, giữ nguyên sort_order từ DB trong từng nhóm.
  const popularCats = useMemo(
    () => [...allCats].sort((a, b) => Number(b.is_featured) - Number(a.is_featured)),
    [allCats],
  );
  const azCats = useMemo(
    () => [...allCats].sort((a, b) => a.name.localeCompare(b.name, "vi")),
    [allCats],
  );
  const gridCats = tab === "az" ? azCats : popularCats;
  const sidebarCats = popularCats.slice(0, 10);

  // Gõ >= 2 ký tự -> kết quả tìm kiếm; ngược lại -> danh mục trò chơi.
  const showResults = open && enabled;
  const showDirectory = open && !enabled && isSupabaseConfigured;

  function choose(to: string) {
    setOpen(false);
    setQ("");
    navigate(to);
  }

  function gameLink(c: CategoryRow, extra?: string) {
    return (
      <Link
        key={c.id}
        to={`/games/${c.slug}`}
        onClick={() => choose(`/games/${c.slug}`)}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-2",
          extra,
        )}
      >
        <GameIcon category={c} className="h-7 w-7" />
        <span className="min-w-0 truncate text-sm font-medium text-text">{c.name}</span>
      </Link>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="flex w-full items-center gap-2 rounded-full border border-border-strong bg-surface-2 px-3.5 py-2 text-sm focus-within:border-yellow">
        {query.isFetching && enabled ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-text-subtle" aria-hidden />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-text-subtle" aria-hidden />
        )}
        <input
          type="text"
          role="searchbox"
          autoFocus={autoFocus}
          aria-label={t.searchAria}
          placeholder={s.nav.searchPlaceholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // Enter = mở kết quả đầu tiên (ưu tiên sản phẩm).
              const first = products[0]
                ? `/item/${products[0].id}`
                : categories[0]
                  ? `/games/${categories[0].slug}`
                  : null;
              if (first) choose(first);
            }
          }}
          className="w-full bg-transparent text-text placeholder:text-text-subtle focus:outline-none"
        />
      </div>

      {/* Panel danh mục trò chơi (bấm vào ô, chưa gõ gì) */}
      {showDirectory ? (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-[min(92vw,52rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-border-strong bg-surface shadow-xl">
          {catsQuery.isPending ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-text-subtle">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />…
            </div>
          ) : allCats.length === 0 ? null : (
            <div className="flex max-h-[70vh]">
              {/* Cột trái: phổ biến nhất */}
              <div className="hidden w-56 shrink-0 overflow-y-auto border-r border-border p-2 md:block">
                <p className="flex items-center gap-1.5 px-2.5 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                  <Flame className="h-3.5 w-3.5" aria-hidden />
                  {t.mostPopular}
                </p>
                {sidebarCats.map((c) => gameLink(c))}
              </div>

              {/* Bên phải: tab + lưới toàn bộ trò chơi */}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                  {(["popular", "az"] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                        tab === key
                          ? "bg-yellow text-text-on-yellow"
                          : "text-text-muted hover:bg-surface-2 hover:text-text",
                      )}
                    >
                      {key === "popular" ? t.tabPopular : t.tabAz}
                    </button>
                  ))}
                  <Link
                    to="/games"
                    onClick={() => choose("/games")}
                    className="ml-auto flex items-center gap-1 text-sm font-medium text-yellow hover:text-yellow-hover"
                  >
                    {t.viewAll}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
                <div className="grid grid-cols-1 content-start gap-x-2 overflow-y-auto p-2 sm:grid-cols-2 lg:grid-cols-3">
                  {gridCats.map((c) => gameLink(c))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Dropdown kết quả tìm kiếm (gõ >= 2 ký tự) */}
      {showResults ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border-strong bg-surface shadow-xl">
          {query.isPending ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-text-subtle">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />…
            </div>
          ) : categories.length === 0 && products.length === 0 ? (
            <p className="px-4 py-3 text-sm text-text-subtle">{t.noResults(debounced)}</p>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto py-1.5">
              {categories.length > 0 ? (
                <>
                  <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                    {t.games}
                  </p>
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      to={`/games/${c.slug}`}
                      onClick={() => choose(`/games/${c.slug}`)}
                      className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-surface-2"
                    >
                      {c.icon_url ? (
                        <img src={c.icon_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-3 text-text-muted">
                          <Gamepad2 className="h-4 w-4" aria-hidden />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-text">{c.name}</span>
                        {c.tagline ? (
                          <span className="block truncate text-xs text-text-subtle">{c.tagline}</span>
                        ) : null}
                      </span>
                    </Link>
                  ))}
                </>
              ) : null}

              {products.length > 0 ? (
                <>
                  <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-text-subtle">
                    {t.products}
                  </p>
                  {products.map((p) => (
                    <Link
                      key={p.id}
                      to={`/item/${p.id}`}
                      onClick={() => choose(`/item/${p.id}`)}
                      className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-surface-2"
                    >
                      {p.images[0] ? (
                        <img src={p.images[0]} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-3 text-xs font-bold text-text-muted">
                          {initialsOf(p.name)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-text">{p.name}</span>
                      </span>
                      <span className="tabular-nums-mono shrink-0 text-sm font-semibold text-yellow">
                        {formatPrice(p.price)}
                      </span>
                    </Link>
                  ))}
                </>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
