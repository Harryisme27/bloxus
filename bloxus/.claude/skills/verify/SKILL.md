---
name: verify
description: Build, launch, and drive the Bloxus demo (Vite React SPA) end-to-end with Playwright
---

# Verify Bloxus

## Build & launch

```bash
cd bloxus
npm run build            # tsc && vite build — must end with "✓ built in Xs"
npm run preview -- --port 4173 --strictPort   # serves dist/ (run in background)
# dev alternative: npm run dev (port 5173) or double-click start.bat
```

Smoke: `curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/` → 200.

## Drive (Playwright, chromium)

Install once in a scratch dir: `npm i playwright && npx playwright install chromium`.
A full drive script exists from the 2026-07-16 session; flows worth driving:

1. `/` renders hero (h1 "Vật phẩm Roblox, giao ngay tức thì"), NOT "Đang xây dựng".
2. `/games` → 8 game cards; `/games/adopt-me` → 5 items.
3. Item detail → "Thêm vào giỏ" → navbar badge increments.
4. `/cart` → promo `BLOXUS10` gives 10% off (wrong code → error toast).
5. `/checkout` → fill email + Roblox username → "Đặt hàng" → `/order-success`
   with order id `UM-YYYY-NNNN`; cart clears after success.
6. Login demo: `demo@bloxus.gg` / `demo1234` (or "Điền nhanh" button) → `/dashboard`.
7. `/orders` shows placed orders (guest orders included by design).
8. `/admin` → toggle "Thất bại" scenario → checkout lands on `/payment-failed`,
   cart is PRESERVED. Reset scenario to "Thành công" afterwards.
9. Probes: unknown route → branded 404; `/checkout` with empty cart → redirect `/cart`;
   390px viewport → no horizontal scroll.

## Gotchas

- Stat counters (home, `/proofs`) animate over ~2-3s — wait before asserting numbers,
  else you read mid-count values (e.g. "3.7/5" instead of "4.9/5").
- Cart page has TWO buttons matching /xoá/i per single line (line remove + "Xoá tất cả").
- State lives in localStorage keys `bloxus-*`; clear them (or footer "Reset demo",
  or `/admin` reset) to get a clean state between runs.
- Tailwind opacity modifiers (`bg-green/20`) emit NO CSS in this project (hex CSS-var
  colors without alpha channel) — use `-soft` tokens or inline rgba.
- Windows: prefer port 4173 preview; Vite auto-increments ports if taken.
