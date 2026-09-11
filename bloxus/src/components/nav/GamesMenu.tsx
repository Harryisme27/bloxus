// Nút "Select games" trong thanh menu + bảng phụ (mega menu) kiểu bloxmart:
// cột trái = game nổi bật (is_featured), cột phải = tất cả game kèm ô tìm.
// Đóng khi: bấm lại nút, bấm ra ngoài, Escape (trả focus về nút), đổi trang.
//
// Bảng định vị theo <header> (header là sticky nên là khung chứa của phần tử
// absolute bên trong) — vì vậy luôn nằm giữa màn hình ngay dưới thanh menu, dù
// nút bấm ở đâu trong nhóm menu.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronDown, Gamepad2, Search } from "lucide-react";
import { listCategories } from "@/lib/db/catalog";
import { isSupabaseConfigured } from "@/lib/supabase";
import { usePick } from "@/i18n";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/types/db";

/** Kiểu chữ chung cho các mục trong nhóm menu (dùng cả ở Navbar). */
export const navPillItemClass =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 font-heading text-[13px] font-extrabold uppercase tracking-[0.06em] text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow";

const STR = {
  vi: {
    selectGames: "Chọn game",
    popular: "Game nổi bật",
    all: "Tất cả game",
    count: (n: number) => `${n} game`,
    searchPh: "Tìm game",
    searchAria: "Tìm game theo tên",
    noMatch: (q: string) => `Không có game nào khớp "${q}"`,
    viewAll: "Xem tất cả game",
    error: "Không tải được danh sách game.",
    empty: "Chưa có game nào.",
  },
  en: {
    selectGames: "Select games",
    popular: "Popular games",
    all: "All games",
    count: (n: number) => `${n} ${n === 1 ? "game" : "games"}`,
    searchPh: "Search for a game",
    searchAria: "Search games by name",
    noMatch: (q: string) => `No games match "${q}"`,
    viewAll: "View all games",
    error: "Couldn't load games.",
    empty: "No games yet.",
  },
};

/** Bỏ dấu + chữ thường để "blox" khớp "Blox Fruits", "pokemon" khớp "Pokémon". */
function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function GameIcon({ game, className }: { game: CategoryRow; className?: string }) {
  if (game.icon_url) {
    return (
      <img
        src={game.icon_url}
        alt=""
        loading="lazy"
        className={cn("shrink-0 rounded-lg object-cover", className)}
      />
    );
  }
  const initials = game.name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg font-heading text-xs font-extrabold text-bg",
        className,
      )}
      style={{ backgroundColor: game.accent_color || "var(--color-yellow)" }}
    >
      {initials}
    </span>
  );
}

export function GamesMenu() {
  const t = usePick(STR);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const gamesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories({ activeOnly: true }),
    enabled: isSupabaseConfigured,
    staleTime: 5 * 60 * 1000,
  });
  const games = useMemo(() => (gamesQuery.data ?? []).filter((g) => g.is_active), [gamesQuery.data]);

  const popular = useMemo(() => {
    const featured = games.filter((g) => g.is_featured);
    return (featured.length ? featured : games).slice(0, 6);
  }, [games]);

  const filtered = useMemo(() => {
    const needle = norm(q);
    const list = needle ? games.filter((g) => norm(g.name).includes(needle)) : games;
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [games, q]);

  // Đổi trang (vd bấm vào 1 game) -> đóng bảng.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Mở -> xoá ô tìm cũ và đặt con trỏ vào ô tìm.
  useEffect(() => {
    if (!open) return;
    setQ("");
    const id = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onGamesPage = location.pathname.startsWith("/games");

  return (
    <div ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="games-menu-panel"
        onClick={() => setOpen((v) => !v)}
        className={cn(navPillItemClass, (open || onGamesPage) && "text-text")}
      >
        <Gamepad2 className="h-4 w-4 text-yellow" aria-hidden />
        {t.selectGames}
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")} aria-hidden />
      </button>

      {open ? (
        <div
          id="games-menu-panel"
          className="absolute inset-x-0 top-full z-50 mx-auto mt-3 w-[min(1040px,calc(100%-32px))] overflow-hidden rounded-[28px] border border-white/[0.08] bg-surface/95 shadow-[0_28px_80px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          <div className="grid md:grid-cols-[1.1fr_1fr]">
            {/* Cột trái: game nổi bật */}
            <section className="border-b border-border/70 p-7 md:border-b-0 md:border-r md:p-8">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-text-subtle">{t.popular}</h2>
                {games.length ? <span className="text-xs text-text-subtle">{t.count(games.length)}</span> : null}
              </div>
              {gamesQuery.isLoading ? (
                <div className="grid grid-cols-2 gap-3.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-surface-2/80" />
                  ))}
                </div>
              ) : gamesQuery.isError ? (
                <p className="text-sm text-danger">{t.error}</p>
              ) : popular.length === 0 ? (
                <p className="text-sm text-text-muted">{t.empty}</p>
              ) : (
                <div data-popular className="grid grid-cols-2 gap-3.5">
                  {popular.map((g) => (
                    <Link
                      key={g.id}
                      to={`/games/${g.slug}`}
                      className="group flex min-h-[80px] items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-surface-2/70 p-3.5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-yellow/45 hover:bg-surface-2 hover:shadow-[0_14px_32px_-20px_rgba(124,195,90,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
                    >
                      <GameIcon game={g} className="h-12 w-12 rounded-2xl ring-1 ring-white/10 transition-transform duration-200 group-hover:scale-[1.04]" />
                      <span className="truncate font-heading text-sm font-bold text-text/95 transition-colors group-hover:text-text">{g.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Cột phải: tất cả game + tìm */}
            <section className="flex flex-col p-7 md:p-8">
              <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-text-subtle">{t.all}</h2>
              <label className="group relative mb-4 block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-text-subtle transition-colors group-focus-within:text-yellow" aria-hidden />
                <input
                  ref={searchRef}
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t.searchPh}
                  aria-label={t.searchAria}
                  className="h-14 w-full rounded-2xl border border-border-strong/80 bg-bg/35 pl-12 pr-4 text-sm text-text shadow-inner shadow-black/10 outline-none transition-all duration-200 placeholder:text-text-subtle focus:border-yellow/70 focus:bg-bg/50 focus:ring-4 focus:ring-yellow/10"
                />
              </label>
              <div data-all className="-mx-1 max-h-[320px] overflow-y-auto pr-1">
                {gamesQuery.isLoading ? null : filtered.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-text-muted">{q.trim() ? t.noMatch(q.trim()) : t.empty}</p>
                ) : (
                  filtered.map((g) => (
                    <Link
                      key={g.id}
                      to={`/games/${g.slug}`}
                      className="group flex items-center gap-3.5 rounded-2xl px-3 py-2.5 transition-all duration-200 hover:bg-surface-2/80 focus-visible:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/70"
                    >
                      <GameIcon game={g} className="h-10 w-10 rounded-xl ring-1 ring-white/[0.08] transition-transform duration-200 group-hover:scale-105" />
                      <span className="truncate font-heading text-sm font-bold text-text/95 transition-colors group-hover:text-text">{g.name}</span>
                    </Link>
                  ))
                )}
              </div>
              <Link
                to="/games"
                className="group mt-auto inline-flex items-center gap-2 self-start pt-5 text-sm font-semibold text-yellow transition-colors hover:text-yellow-hover"
              >
                {t.viewAll}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
              </Link>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
