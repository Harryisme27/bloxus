import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StarRatingProps {
  /** Number of filled stars (0-5). */
  stars: number;
  className?: string;
  size?: "sm" | "md";
}

/** Row of 5 stars with `stars` filled in gold. */
export function StarRating({ stars, className, size = "sm" }: StarRatingProps) {
  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${stars}/5 sao`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(dim, i < stars ? "fill-yellow text-yellow" : "text-text-disabled")}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
