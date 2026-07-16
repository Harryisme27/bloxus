// VI/EN language switch — compact segmented control wired to the language
// store. Active segment uses the amber brand fill; both segments stay legible
// in the warm dark chrome. Accessible: labelled group + aria-pressed segments.
import { useLangStore, type Lang } from "@/i18n";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Lang; label: string; aria: string }[] = [
  { value: "vi", label: "VI", aria: "Tiếng Việt" },
  { value: "en", label: "EN", aria: "English" },
];

export function LanguageToggle({ className }: { className?: string }) {
  const lang = useLangStore((state) => state.lang);
  const setLang = useLangStore((state) => state.setLang);

  return (
    <div
      role="group"
      aria-label="Ngôn ngữ / Language"
      className={cn(
        "inline-flex items-center rounded-lg border border-border-strong bg-surface-2 p-0.5",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const active = lang === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLang(opt.value)}
            aria-pressed={active}
            aria-label={opt.aria}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-heading font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
              active
                ? "bg-yellow text-text-on-yellow"
                : "text-text-muted hover:text-text",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
