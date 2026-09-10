import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CountUpStatProps {
  icon?: LucideIcon;
  /** Numeric target the value animates up to. */
  target: number;
  /** Number of decimals to display (e.g. 1 for "4.9"). */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  /** Animation duration in ms. */
  duration?: number;
  className?: string;
}

/** A stat tile whose number counts up from 0 once it scrolls into view. */
export function CountUpStat({
  icon: Icon,
  target,
  decimals = 0,
  prefix = "",
  suffix = "",
  label,
  duration = 1400,
  className,
}: CountUpStatProps) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Kick off the count-up only when the tile enters the viewport.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // easeOutCubic for a snappy, premium settle.
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);

  const display =
    prefix +
    value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    suffix;

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-6 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-soft text-yellow">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      ) : null}
      <p className="font-heading text-3xl font-bold tabular-nums text-text sm:text-4xl">{display}</p>
      <p className="text-sm text-text-muted">{label}</p>
    </div>
  );
}
