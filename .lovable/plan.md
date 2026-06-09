
## Goal

Rebuild Javan's coin + payout economy end-to-end and make the Story composer and Verification button reliably clickable.

---

## 1. Economy rules (DB-enforced)

Migration updates the source of truth so we cannot drift from the spec:

- `gift_catalog` re-seeded — display prices preserved, but **creator share = 80%, platform = 20%**.
  - Update `apply_gift_economy()`: `creator_share := (NEW.coin_value * 80) / 100;`
- New `platform_config` table (single row) for tunables: `creator_share_pct`, `min_payout_usd_cents`, `payout_hold_days`, `coin_to_usd_cents` (1 coin = 1¢ ⇒ 100 coins = $1).
- New `coin_packages` table (admin-managed): {coins, usd_cents, label, sort, active}. Seed with the six packages.
- `payout_requests`: add `available_after` (now + hold_days), `verified_at_request` bool. RPC `request_payout` enforces:
  - user has `verifications.status='approved'`
  - amount ≥ min ($20 = 2000 coins at new rate — see note below)
  - amount ≤ `earned_coins`
  - sets `status='hold'` until `available_after`, then admin queue.
- New `fraud_flags` table + trigger on `gifts_sent`: flag if sender and recipient share IP/device/linked account, or if sender's hourly volume > N. Self-gift via linked accounts blocked in `send_gift` RPC.
- New `transactions` ledger (append-only): every coin movement (purchase, gift-out, gift-in, payout, refund, adjustment). Powers history views.

**Rate note:** spec says "100 coins = $1" AND "$20 min payout". At 80% share, earning $20 requires gifting $25 worth = 2,500 coins gifted → 2,000 earned coins. Min payout stored as `2000` earned coins (= $20). Old code used 1000-coin = $1 with a 2× promo; we collapse that to the clean 100 = $1 rate.

---

## 2. Purchases & withdrawals

- `TopUpDialog` reads packages from `coin_packages`. Six tiles: 100/$1, 500/$5, 1k/$10, 5k/$50, 10k/$100, 100k/$1000.
- Real card/bank processing requires Stripe. I'll wire the **Stripe-managed payments** path (Lovable built-in, no key paste) — confirm before I enable. Until then, purchase flow stays in "test mode" recording `coin_purchases` rows with status `pending` so the UI is complete.
- `PayoutRequestDialog`: min $20, methods Bank / Payoneer / PayPal / Stripe, shows 7-day hold banner, blocks if not verified with a link to `/settings/account/verification`.

---

## 3. Creator dashboard (`/studio/payouts`)

Cards: total coins received · lifetime earnings (USD) · available balance · pending (in 7-day hold) · last payout. Tabs: Videos · Music · Posts · Live — each shows top earners + totals, queried from `transactions` joined to `videos`/`artist_tracks`/etc. Withdrawal history table with status badges.

## 4. Admin dashboard (`/admin/revenue`, `/admin/payouts`)

- Edit `coin_packages` (CRUD), edit `platform_config` (share %, min payout, hold days).
- Approve/reject payout rows; rejection writes reason and refunds to `earned_coins`.
- Revenue: platform 20% cut, GMV, top creators, fraud flags inbox, freeze account toggle (`profiles.banned`, `profiles.suspended_until`).
- CSV export endpoint at `/api/public/admin/export.csv` (admin-gated by signed token).

## 5. Multi-currency

Display layer only for v1: `useCurrency()` hook → pick from {USD, EUR, GBP, NGN, INR, BRL, JPY}. Conversion via static daily rates table `currency_rates` (admin updatable). All ledger amounts stay in USD cents + coins; display formats client-side.

## 6. Live gifts realtime

Subscribe to `gifts_sent` filtered by `stream_id` on `/live/$id` — animated gift bubble overlay, running total on creator's stream HUD.

---

## 7. Story + Verification click bug

Code inspection shows both are wired (`StoryComposer` mounts with `open` state, Verification row is a `<Link to="/settings/account/verification">`). The reported failure is likely:

- **Story:** the `+` badge on the avatar sits behind the cover image's stacking context on some viewports. Fix: bump z-index to `z-50` and make the avatar wrapper `relative z-10`. Also expose a second entry point — tap on the avatar ring itself opens the composer.
- **Verification:** parent `<Link to="/settings/account">` in `ProfileDrawer` swallowing nested taps in some flows. Fix: confirm `settings.account.tsx` rows render as direct anchors (they already do) and ensure `/settings/account/verification` route is registered in `routeTree.gen.ts` (regenerated automatically on dev). Add `onClick` stopPropagation guard for safety.

I'll patch both and verify with a fresh preview.

---

## Files

**Migrations**
- `coin_packages`, `platform_config`, `transactions`, `fraud_flags`, `currency_rates` tables + GRANTs + RLS
- Update `apply_gift_economy` (80/20), `send_gift` (linked-account check), add `request_payout` RPC

**New code**
- `src/lib/currency.ts` · `src/components/GiftOverlay.tsx` · `src/routes/studio.payouts.tsx` · `src/routes/admin/packages.tsx` · `src/routes/api/public/admin.export.csv.ts`

**Edits**
- `TopUpDialog.tsx`, `PayoutRequestDialog.tsx`, `GiftPanel.tsx`, `wallet.tsx`, `admin/payouts.tsx`, `admin/revenue.tsx`, `profile.tsx` (story z-index + avatar tap), `settings.account.tsx` (stopPropagation)

---

## Open question before I build

**Real payments:** the spec requires real card/bank purchases + Payoneer/bank payouts. That needs Stripe Payments enabled (Lovable's built-in flow — no API key paste, no Stripe account required to start in test mode). Reply **"enable Stripe"** and I'll run the eligibility check + enable in the same turn. Otherwise I'll build the full UI/DB layer now and leave purchases in test-mode (rows recorded, no card charged) so we can swap in the live processor in one step later.
