// Popup "giao hàng gần đây" góc TRÁI dưới: hiện ngẫu nhiên các đơn đã hoàn
// thành (social proof). Dữ liệu thật từ bảng proofs; chưa có/không kết nối
// Supabase thì xoay vòng danh sách demo. Ẩn trong khu làm việc /work.
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, X } from "lucide-react";
import { listProofs } from "@/lib/db/content";
import { isSupabaseConfigured } from "@/lib/supabase";
import { usePick } from "@/i18n";
import { cn } from "@/lib/utils";

const STR = {
  vi: {
    heading: "GIAO HÀNG GẦN ĐÂY",
    line: (item: string, game: string) => `Đã hoàn thành ${item} cho một khách hàng - ${game}`,
    closeAria: "Đóng thông báo",
  },
  en: {
    heading: "RECENT DELIVERY",
    line: (item: string, game: string) => `Completed ${item} for a customer - ${game}`,
    closeAria: "Dismiss notification",
  },
};

interface Delivery {
  item: string;
  game: string;
}

/** Danh sách demo khi chưa có proofs thật. */
const DEMO_DELIVERIES: Delivery[] = [
  { item: "Neon Frost Dragon", game: "Adopt Me" },
  { item: "Mythical Perks +10 ( You Choose Any 1 )", game: "Attack on Titan Revolution" },
  { item: "Godly Chroma Set x3", game: "Murder Mystery 2" },
  { item: "Leviathan (Perm)", game: "Blox Fruits" },
  { item: "Disco Bee", game: "Grow a Garden" },
  { item: "Huge Techno Cat", game: "Pet Simulator 99" },
  { item: "Rank Boost Diamond → Heroic", game: "Free Fire" },
  { item: "Secret Unit Reroll Service", game: "Anime Vanguards" },
];

const FIRST_DELAY_MS = 5_000; // lần đầu sau khi mở trang
const VISIBLE_MS = 6_000; // thời gian hiện mỗi thông báo
const GAP_MIN_MS = 9_000; // nghỉ ngẫu nhiên giữa 2 thông báo
const GAP_MAX_MS = 20_000;

export function RecentDeliveryToast() {
  const t = usePick(STR);
  const { pathname } = useLocation();
  const [current, setCurrent] = useState<Delivery | null>(null);
  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  // Proofs thật (đơn đã giao có minh chứng) — công khai, cache 5 phút.
  const proofsQuery = useQuery({
    queryKey: ["proofs"],
    queryFn: listProofs,
    enabled: isSupabaseConfigured,
    staleTime: 300_000,
  });

  const pool = useMemo<Delivery[]>(() => {
    const real = (proofsQuery.data ?? [])
      .filter((p) => p.item_name)
      .slice(0, 20)
      .map((p) => ({ item: p.item_name, game: p.game_name }));
    return real.length > 0 ? real : DEMO_DELIVERIES;
  }, [proofsQuery.data]);
  const poolRef = useRef(pool);
  poolRef.current = pool;

  // Vòng lặp hiện/ẩn ngẫu nhiên. Không chạy trong khu làm việc.
  const inWork = pathname.startsWith("/work");
  useEffect(() => {
    if (inWork) return;
    dismissedRef.current = false;

    function schedule(delay: number) {
      const id = window.setTimeout(() => {
        if (dismissedRef.current) return;
        const list = poolRef.current;
        setCurrent(list[Math.floor(Math.random() * list.length)]);
        setVisible(true);
        const hideId = window.setTimeout(() => {
          setVisible(false);
          schedule(GAP_MIN_MS + Math.random() * (GAP_MAX_MS - GAP_MIN_MS));
        }, VISIBLE_MS);
        timersRef.current.push(hideId);
      }, delay);
      timersRef.current.push(id);
    }

    schedule(FIRST_DELAY_MS);
    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
      setVisible(false);
    };
  }, [inWork]);

  if (inWork || !current) return null;

  return (
    <div
      aria-live="polite"
      className={cn(
        "fixed bottom-4 left-4 z-40 max-w-sm transition-all duration-500",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
      )}
    >
      <div className="group relative flex items-center gap-3 rounded-2xl border border-border-strong bg-surface p-4 pr-9 shadow-xl">
        <div className="relative shrink-0">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border-strong bg-surface-2 text-yellow">
            <BadgeCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-green" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-yellow">{t.heading}</p>
          <p className="mt-0.5 text-sm text-text">{t.line(current.item, current.game)}</p>
        </div>
        <button
          type="button"
          aria-label={t.closeAria}
          onClick={() => {
            dismissedRef.current = true;
            setVisible(false);
          }}
          className="absolute right-2 top-2 rounded-md p-1 text-text-subtle opacity-0 transition-opacity hover:text-text focus-visible:opacity-100 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
