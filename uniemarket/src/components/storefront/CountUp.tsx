import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface CountUpProps {
  /** Target value to count up to. */
  end: number;
  durationMs?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/** Animated number that counts from 0 -> `end` the first time it scrolls into
 * view (easeOutCubic). Respects prefers-reduced-motion by snapping to `end`. */
export function CountUp({
  end,
  durationMs = 1600,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: CountUpProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const runAnimation = () => {
      if (started.current) return;
      started.current = true;
      if (prefersReduced) {
        setValue(end);
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(end * eased);
        if (progress < 1) requestAnimationFrame(tick);
        else setValue(end);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) runAnimation();
        });
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [end, durationMs]);

  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
