// Simple i18n entry point. Vietnamese is the default and only active
// language for this demo. Components should `import { t } from "@/i18n"`.
// To add a language toggle later: turn `t` into a hook backed by a store
// (e.g. `useT()`) that picks between `vi` and `en` — the string *keys* below
// won't need to change, only where they're read from.
export { vi } from "./vi";
export { en } from "./en";
export type { Strings } from "./vi";

import { vi } from "./vi";

/** Active strings for the app. Swap to `en` to preview English copy. */
export const t = vi;
