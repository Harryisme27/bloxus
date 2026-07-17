// Language store (zustand + persist). Holds the active UI language and drives
// `useT()`, which returns the matching string catalog (vi | en). Persisted so a
// visitor's choice survives reloads. Default = Vietnamese.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { vi } from "./vi";
import { en } from "./en";
import type { Strings } from "./vi";

export type Lang = "vi" | "en";

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      // Mặc định tiếng Anh (đổi được bằng nút VI/EN, lựa chọn được ghi nhớ).
      lang: "en",
      setLang: (lang) => set({ lang }),
      toggle: () => set({ lang: get().lang === "vi" ? "en" : "vi" }),
    }),
    { name: "uniemarket-lang" },
  ),
);

/** String catalogs keyed by language. */
export const CATALOG: Record<Lang, Strings> = { vi, en };

/**
 * Active string catalog for the current language. Subscribes to the language
 * store, so components re-render on toggle. Use: `const s = useT();` then
 * `s.nav.home`, `s.status[displayStatus]`, etc.
 */
export function useT(): Strings {
  const lang = useLangStore((state) => state.lang);
  return CATALOG[lang];
}

/**
 * Chọn bản dịch cho một CATALOG cục bộ của trang/thành phần. Mỗi trang tự khai
 * `const STR = { vi: {...}, en: {...} }` rồi `const t = usePick(STR)` — không
 * cần đụng vào file catalog chung, nên dịch từng trang độc lập, không xung đột.
 */
export function usePick<T>(catalog: { vi: T; en: T }): T {
  const lang = useLangStore((state) => state.lang);
  return catalog[lang];
}
