// Demo-only promo-code helpers, shared between /cart and /checkout.
//
// The cart page is where a user enters a code, but the discount also needs to
// be reflected on the checkout summary + persisted onto the placed Order. Since
// we may NOT edit the shared stores, we keep the currently-applied code in a
// tiny module-level singleton. This survives client-side route navigation
// (same JS runtime) which is all the demo needs; a full page reload simply
// resets it back to "no promo", which is fine for a mock shop.

/** Map of valid promo codes -> fractional discount rate. */
export const PROMO_CODES: Record<string, number> = {
  UNIE10: 0.1,
};

let appliedPromo: string | null = null;

/** The code that is currently applied (already normalized/uppercased), or null. */
export function getAppliedPromo(): string | null {
  return appliedPromo;
}

/** Persist the applied code across route navigation. Pass null to clear. */
export function setAppliedPromo(code: string | null): void {
  appliedPromo = code;
}

/** Normalize raw user input into a comparable code. */
export function normalizePromo(raw: string): string {
  return raw.trim().toUpperCase();
}

/** Fractional discount rate for a code (0 if unknown/null). */
export function promoRate(code: string | null): number {
  if (!code) return 0;
  return PROMO_CODES[code] ?? 0;
}
