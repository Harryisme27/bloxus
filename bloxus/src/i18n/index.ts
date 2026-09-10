// i18n entry point. The app now has a VI/EN toggle backed by a zustand store.
//
//   import { useT } from "@/i18n";
//   const s = useT();            // active catalog (vi | en), re-renders on toggle
//   s.nav.home; s.status[displayStatus]; ...
//
//   import { useLangStore } from "@/i18n";
//   const toggle = useLangStore((st) => st.toggle);
//
// `t` remains exported (always Vietnamese) for back-compat with any code that
// hasn't migrated to `useT()` yet — prefer `useT()` for new/updated components.
export { vi } from "./vi";
export { en } from "./en";
export type { Strings } from "./vi";
export { useLangStore, useT, usePick, CATALOG } from "./store";
export type { Lang } from "./store";

import { vi } from "./vi";

/** Back-compat static catalog (Vietnamese). New code should use `useT()`. */
export const t = vi;
