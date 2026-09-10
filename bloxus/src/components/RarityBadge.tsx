import { cn } from "@/lib/utils";

// Maps a rarity string (as used across data/items.ts) to a badge style.
// Higher tiers use the gold accent, mid tiers use green, common/base tiers
// use a neutral outline — this keeps the palette consistent across every
// game even though each game names its rarities differently.
const RARITY_STYLES: Record<string, string> = {
  Common: "border-border-strong bg-surface-2 text-text-muted",
  Uncommon: "border-border-strong bg-surface-2 text-text",
  Rare: "border-transparent bg-green-soft text-green",
  Epic: "border-transparent bg-green-soft text-green",
  "Ultra-Rare": "border-transparent bg-green-soft text-green",
  Legendary: "border-transparent bg-yellow-soft text-yellow",
  Mythical: "border-transparent bg-yellow-soft text-yellow",
  Mythic: "border-transparent bg-yellow-soft text-yellow",
  Godly: "border-transparent bg-yellow-soft text-yellow",
  Chroma: "border-transparent bg-yellow-soft text-yellow",
  Exclusive: "border-transparent bg-yellow-soft text-yellow",
  Huge: "border-transparent bg-yellow-soft text-yellow",
  Titanic: "border-transparent bg-yellow-soft text-yellow",
  Secret: "border-transparent bg-yellow-soft text-yellow",
};

const DEFAULT_STYLE = "border-border-strong bg-surface-2 text-text-muted";

export interface RarityBadgeProps {
  rarity: string;
  className?: string;
}

export function RarityBadge({ rarity, className }: RarityBadgeProps) {
  const style = RARITY_STYLES[rarity] ?? DEFAULT_STYLE;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        style,
        className,
      )}
    >
      {rarity}
    </span>
  );
}
