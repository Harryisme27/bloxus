// Chọn ngôn ngữ trên thanh menu (kiểu bloxmart): nút lá cờ tròn -> danh sách.
// Cờ vẽ bằng SVG vì emoji cờ không hiện trên Windows (chỉ ra chữ "US", "VN").
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Check } from "lucide-react";
import { useLangStore, usePick, type Lang } from "@/i18n";
import { cn } from "@/lib/utils";

type FlagProps = { className?: string };

function FlagFrame({ className, children }: FlagProps & { children: ReactNode }) {
  return (
    <span className={cn("inline-block shrink-0 overflow-hidden rounded-full ring-1 ring-border-strong", className)}>
      <svg viewBox="0 0 24 24" className="block h-full w-full" aria-hidden>
        {children}
      </svg>
    </span>
  );
}

const STRIPE = 24 / 13;

function FlagUS({ className }: FlagProps) {
  return (
    <FlagFrame className={className}>
      <rect width="24" height="24" fill="#b22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect key={i} y={i * STRIPE} width="24" height={STRIPE} fill="#ffffff" />
      ))}
      <rect width="11" height={7 * STRIPE} fill="#3c3b6e" />
      {[0, 1, 2, 3].flatMap((r) =>
        [0, 1, 2, 3].map((c) => (
          <circle key={`${r}-${c}`} cx={1.6 + c * 2.6} cy={1.6 + r * 3} r="0.55" fill="#ffffff" />
        )),
      )}
    </FlagFrame>
  );
}

const VN_STAR = Array.from({ length: 10 }, (_, k) => {
  const a = ((-90 + k * 36) * Math.PI) / 180;
  const r = k % 2 ? 2.6 : 6.5;
  return `${(12 + r * Math.cos(a)).toFixed(2)},${(12 + r * Math.sin(a)).toFixed(2)}`;
}).join(" ");

function FlagVN({ className }: FlagProps) {
  return (
    <FlagFrame className={className}>
      <rect width="24" height="24" fill="#da251d" />
      <polygon points={VN_STAR} fill="#ffcd00" />
    </FlagFrame>
  );
}

const LANGS: { value: Lang; label: string; Flag: ComponentType<FlagProps> }[] = [
  { value: "en", label: "English", Flag: FlagUS },
  { value: "vi", label: "Tiếng Việt", Flag: FlagVN },
];

const STR = {
  vi: { aria: (name: string) => `Ngôn ngữ: ${name}`, title: "Ngôn ngữ" },
  en: { aria: (name: string) => `Language: ${name}`, title: "Language" },
};

export function LanguageMenu() {
  const lang = useLangStore((state) => state.lang);
  const setLang = useLangStore((state) => state.setLang);
  const t = usePick(STR);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const current = LANGS.find((l) => l.value === lang) ?? LANGS[0];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.aria(current.label)}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow",
          open && "bg-surface-2",
        )}
      >
        <current.Flag className="h-6 w-6" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t.title}
          className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-border-strong bg-surface p-1 shadow-2xl shadow-black/60"
        >
          {LANGS.map((l) => {
            const active = l.value === lang;
            return (
              <button
                key={l.value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setLang(l.value);
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none",
                  active ? "text-text" : "text-text-muted",
                )}
              >
                <l.Flag className="h-5 w-5" />
                <span className="flex-1 text-left">{l.label}</span>
                {active ? <Check className="h-4 w-4 text-yellow" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
