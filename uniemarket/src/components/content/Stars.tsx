import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePick } from "@/i18n";

const STR = {
  vi: { ariaRating: (v: string) => `${v} trên 5 sao` },
  en: { ariaRating: (v: string) => `${v} out of 5 stars` },
};

export interface StarsProps {
  /** Rating value 0–5. Supports halves via fill fraction on the last visible star. */
  value: number;
  /** Star size in pixels. */
  size?: number;
  className?: string;
}

/** A row of 5 gold stars, filling `value` of them (supports fractional last star). */
export function Stars({ value, size = 16, className }: StarsProps) {
  const t = usePick(STR);
  const rounded = Math.max(0, Math.min(5, value));
  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={t.ariaRating(value.toFixed(1))}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, rounded - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star
              className="absolute inset-0 text-border-strong"
              style={{ width: size, height: size }}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            {fill > 0 ? (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className="text-yellow"
                  style={{ width: size, height: size }}
                  fill="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
