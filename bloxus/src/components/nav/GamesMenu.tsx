import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock3, Search, Sparkles, X } from "lucide-react";
import { listCategories } from "@/lib/db/catalog";
import { isSupabaseConfigured } from "@/lib/supabase";
import { usePick } from "@/i18n";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/types/db";

/** Shared style for the compact navigation links beside the search bar. */
export const navPillItemClass =
  "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 font-heading text-[11px] font-extrabold uppercase tracking-[0.045em] text-text-muted transition-colors hover:bg-white/[0.04] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow";

const RECENT_SEARCHES_KEY = "bloxus-game-search-history";
const MAX_RECENT_SEARCHES = 5;

const STR = {
  vi: {
    searchPh: "Tìm game bạn muốn chơi...",
    searchAria: "Tìm game theo tên",
    recent: "Tìm kiếm gần đây",
    clear: "Xoá lịch sử",
    recommended: "Game đề xuất",
    results: "Kết quả tìm kiếm",
    noMatch: (q: string) => `Không tìm thấy game phù hợp với “${q}”`,
    viewAll: "Xem tất cả game",
    error: "Không tải được danh sách game.",
    empty: "Chưa có game nào.",
  },
  en: {
    searchPh: "Search for a game...",
    searchAria: "Search games by name",
    recent: "Recent searches",
    clear: "Clear history",
    recommended: "Recommended games",
    results: "Search results",
    noMatch: (q: string) => `No games match “${q}”`,
    viewAll: "View all games",
    error: "Couldn't load games.",
    empty: "No games yet.",
  },
};

function norm(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function GameIcon({ game, className }: { game: CategoryRow; className?: string }) {
  if (game.icon_url) {
    return <img src={game.icon_url} alt="" loading="lazy" className={cn("shrink-0 object-cover", className)} />;
  }

  const initials = game.name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center font-heading text-xs font-extrabold text-bg", className)}
      style={{ backgroundColor: game.accent_color || "var(--color-yellow)" }}
    >
      {initials}
    </span>
  );
}

export function GamesMenu() {
  const t = usePick(STR);
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const gamesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories({ activeOnly: true }),
    enabled: isSupabaseConfigured,
    staleTime: 5 * 60 * 1000,
  });

  const games = useMemo(() => (gamesQuery.data ?? []).filter((game) => game.is_active), [gamesQuery.data]);

  const recommended = useMemo(() => {
    const featured = games.filter((game) => game.is_featured);
    return (featured.length ? featured : games).slice(0, 4);
  }, [games]);

  const filtered = useMemo(() => {
    const needle = norm(query);
    if (!needle) return [];
    return games
      .filter((game) => norm(game.name).includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"))
      .slice(0, 8);
  }, [games, query]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) setRecentSearches(JSON.parse(saved) as string[]);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        searchRef.current?.blur();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function rememberSearch(value: string) {
    const cleanValue = value.trim();
    if (!cleanValue) return;

    setRecentSearches((current) => {
      const next = [cleanValue, ...current.filter((item) => norm(item) !== norm(cleanValue))].slice(
        0,
        MAX_RECENT_SEARCHES,
      );
      try {
        window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // Search still works when localStorage is unavailable.
      }
      return next;
    });
  }

  function clearHistory() {
    setRecentSearches([]);
    try {
      window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore storage errors.
    }
  }

  function openGame(game: CategoryRow) {
    rememberSearch(game.name);
    setOpen(false);
    setQuery("");
  }

  function selectRecent(value: string) {
    const exactGame = games.find((game) => norm(game.name) === norm(value));
    if (exactGame) {
      rememberSearch(exactGame.name);
      navigate(`/games/${exactGame.slug}`);
      return;
    }
    setQuery(value);
    searchRef.current?.focus();
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstResult = filtered[0];
    if (!firstResult) return;
    rememberSearch(firstResult.name);
    navigate(`/games/${firstResult.slug}`);
  }

  const hasQuery = query.trim().length > 0;

  return (
    <div ref={rootRef} className="relative w-[clamp(380px,34vw,720px)]">
      <form onSubmit={submitSearch} role="search" className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 z-10 h-[18px] w-[18px] -translate-y-1/2 text-text-subtle"
          aria-hidden
        />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          placeholder={t.searchPh}
          aria-label={t.searchAria}
          aria-expanded={open}
          aria-controls="games-search-panel"
          autoComplete="off"
          className="h-12 w-full rounded-full border border-[#31563a] bg-[#122417] pl-11 pr-4 text-[15px] font-medium text-text shadow-[0_8px_28px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-all duration-200 placeholder:text-[#879b82] hover:border-[#4b7b54] focus:border-yellow/70 focus:bg-[#172c1b] focus:ring-4 focus:ring-yellow/10"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              searchRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-text-subtle transition-colors hover:bg-white/[0.06] hover:text-text"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </form>

      {open ? (
        <div
          id="games-search-panel"
          className="absolute left-1/2 top-full z-50 mt-3 w-[min(620px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-[26px] border border-[#31513a] bg-[#0d1b10] p-3 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)]"
        >
          {gamesQuery.isError ? <p className="px-4 py-5 text-sm text-danger">{t.error}</p> : null}

          {!gamesQuery.isError && hasQuery ? (
            <section>
              <div className="flex items-center justify-between px-3 pb-2 pt-2">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-subtle">{t.results}</h2>
                <span className="text-xs text-text-subtle">{filtered.length}</span>
              </div>
              <div className="max-h-[260px] overflow-y-auto">
                {gamesQuery.isLoading ? (
                  <div className="h-16 animate-pulse rounded-2xl bg-surface-2/70" />
                ) : filtered.length === 0 ? (
                  <p className="px-3 py-5 text-sm text-text-muted">{t.noMatch(query.trim())}</p>
                ) : (
                  filtered.map((game) => (
                    <Link
                      key={game.id}
                      to={`/games/${game.slug}`}
                      onClick={() => openGame(game)}
                      className="group flex items-center gap-3 rounded-2xl border border-transparent bg-[#122417] px-3 py-2.5 transition-all duration-200 hover:border-[#3e6947] hover:bg-[#19321e] focus-visible:bg-[#19321e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/70"
                    >
                      <GameIcon game={game} className="h-11 w-11 rounded-xl ring-1 ring-white/10" />
                      <span className="min-w-0 flex-1 truncate font-heading text-sm font-bold text-text">{game.name}</span>
                      <ArrowRight className="h-4 w-4 text-text-subtle transition-transform group-hover:translate-x-1 group-hover:text-yellow" aria-hidden />
                    </Link>
                  ))
                )}
              </div>
            </section>
          ) : null}

          {!hasQuery && recentSearches.length > 0 ? (
            <section className="px-2 pb-3 pt-2">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-text-subtle">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden />
                  {t.recent}
                </h2>
                <button type="button" onClick={clearHistory} className="text-xs font-semibold text-text-subtle transition-colors hover:text-yellow">
                  {t.clear}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selectRecent(item)}
                    className="rounded-full border border-[#31513a] bg-[#14271a] px-3 py-1.5 text-xs font-semibold text-text-muted shadow-sm transition-all hover:border-yellow/40 hover:bg-[#1a3420] hover:text-text"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {!hasQuery ? (
            <section className={cn("rounded-[20px] border border-[#243f2b] bg-[#112216] p-3", recentSearches.length > 0 && "mt-1")}> 
              <div className="mb-3 flex items-center justify-between px-1 pt-1">
                <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-text-subtle">
                  <Sparkles className="h-3.5 w-3.5 text-yellow" aria-hidden />
                  {t.recommended}
                </h2>
                <Link to="/games" className="text-xs font-semibold text-yellow transition-colors hover:text-yellow-hover">
                  {t.viewAll}
                </Link>
              </div>

              {gamesQuery.isLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="h-[68px] animate-pulse rounded-2xl bg-[#19321e]" />
                  ))}
                </div>
              ) : recommended.length === 0 ? (
                <p className="px-1 py-3 text-sm text-text-muted">{t.empty}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {recommended.map((game) => (
                    <Link
                      key={game.id}
                      to={`/games/${game.slug}`}
                      onClick={() => openGame(game)}
                      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-[#294a31] bg-[#172c1b] p-2.5 shadow-[0_8px_20px_-16px_rgba(0,0,0,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:border-yellow/45 hover:bg-[#1d3823]"
                    >
                      <GameIcon game={game} className="h-11 w-11 rounded-xl ring-1 ring-white/10" />
                      <span className="min-w-0 truncate font-heading text-sm font-bold text-text/95">{game.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
