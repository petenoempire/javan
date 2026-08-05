# Full-project fix sweep — phased

## Phase 1 (this approval) — Dead-click & routing audit

Goal: every button, tab, icon, and card across Javan does exactly what its label promises. No visual redesign.

**Method**
1. Ripgrep the whole `src/routes` and `src/components` tree for:
   - `onClick` handlers that only call `toast.info(...soon...)` or are empty
   - `<Link to="/…">` targets that don't exist in `routeTree.gen.ts`
   - `useNavigate()` calls with hardcoded strings
   - Buttons with no `onClick`, `type`, or wrapping `<Link>`
2. Cross-check every destination against the actual route files listed in the codebase context.
3. For each miss, either wire it to the correct existing route, create the missing leaf, or replace the stub with a working handler.

**Known suspects to verify & fix**
- Bottom nav (`MobileShell`) — Friends/Notifications/Alerts icons vs. route existence
- `VideoCard` share button — currently `navigator.share?.().catch(()=>{})` swallows unsupported-browser case → add clipboard fallback + toast
- `VideoCard` avatar — not clickable; should link to `/u/$handle`
- Music footer in `VideoCard` — not clickable; should link to a track page or trigger sound-detail sheet
- Profile drawer, Settings index, Account settings, Security, Help — walk every row, confirm route exists
- `create.tsx` mode selector, camera/upload/story CTAs
- Wallet, Studio subsections, Artist onboarding step buttons
- Notification bell / notifications page item clicks → deep link to source (video/comment/follow)
- Follower/Following counts → `/followers` `/following`
- Any `toast.info("… coming soon")` where the destination now exists

**Deliverable**: a single implementation pass; no layout changes; TS build clean.

---

## Phase 2 (next turn, after Phase 1 lands) — TikTok-parity Home + Story + Live

Layout + interactions only; keep Javan brand tokens (colors, fonts, gradients).

### Home feed (`/`)
- Top bar: two centered tabs only — **Following** | **For You** — with the animated underline pill directly under the active label (TikTok style), search icon top-right, no other chrome.
- Move Live/Drama/Community/STEM into a horizontally scrollable secondary strip only when the user pulls down, or drop them (confirm during build). Default TikTok-parity is two tabs.
- Right-rail action stack order: **Avatar (with + follow badge) → Like → Comment → Save/Bookmark → Share → Spinning music disc**. Add a Bookmark (save) button — currently missing.
- Caption block: `@handle` bold, caption below, music row with marquee scroll if overflow, small spinning disc bottom-right that mirrors the current audio.
- Double-tap heart burst: keep, tune scale/timing to TikTok curve.
- Long-press = pause + hide UI; release = resume (currently missing).

### Story tray
- Horizontal scrollable strip pinned to the top of the feed (above tabs), avatars with gradient ring for unseen, grey ring for seen, "Your Story +" tile first.
- New DB: `stories` (id, user_id, media_url, media_type, created_at, expires_at) + `story_views`. RLS: owner writes; anyone authenticated reads unexpired; owner reads views. 24h expiry via `expires_at > now()` filter.
- Story viewer: full-screen, tap-right = next, tap-left = prev, hold = pause, progress bars up top (one per story), swipe-down = close.
- Composer entry from `+` tile → reuses existing `create.tsx` story mode.

### Live page (`/live/$id`)
- Replace current "coming soon" stub with TikTok-parity viewer layout:
  - Full-bleed video area (placeholder gradient/poster until real streaming is added — user chose "UI + realtime chat/gifts" only).
  - Top-left: host avatar + display name + follow button + LIVE badge + viewer count.
  - Top-right: close (X), share, more menu.
  - Left/lower-middle: scrolling **chat log** (last ~30 messages, fades at top).
  - Floating **heart burst** rising animation when viewers tap the heart.
  - Right-rail: Gift button (opens existing `GiftPanel`), Heart, Comment focus, Share.
  - Bottom: chat composer input pinned above safe area.
- Backend:
  - New tables `live_streams` (id, host_id, title, started_at, ended_at, viewer_count) and `live_chat_messages` (id, stream_id, user_id, text, kind: 'chat'|'gift'|'join', created_at). RLS + GRANTs per project rules.
  - Enable `supabase_realtime` publication on `live_chat_messages`.
  - Gift send reuses existing `gifts_sent` + coin debit trigger; on insert, also insert a `live_chat_messages` row of kind `gift` so it appears in the chat log.
  - Viewer count = distinct presence via Supabase Realtime `presence` channel keyed on `stream_id`.
- Go-Live entry from create flow → inserts a `live_streams` row, routes host to `/live/$id` in "host" mode (same layout, host sees no follow button, sees end-stream button instead).

### Files touched (Phase 2 preview)
- `src/routes/index.tsx` — feed top bar, story tray mount
- `src/components/VideoCard.tsx` — right-rail order, bookmark, long-press, avatar link, share fallback
- `src/components/StoryTray.tsx` (new)
- `src/routes/story.$userId.tsx` (new) — viewer
- `src/routes/live.$id.tsx` — full rewrite
- `src/components/LiveChat.tsx` (new)
- `src/lib/stories.ts` (new)
- `src/lib/live.ts` (new)
- Migrations: `stories`, `story_views`, `live_streams`, `live_chat_messages` (+ RLS, GRANTs, realtime publication)

---

## What I'm NOT doing
- No real WebRTC/HLS video streaming (user chose UI + realtime chat/gifts only).
- No pixel-perfect TikTok clone — Javan brand tokens stay.
- No new Stripe wiring (still pending your explicit "enable Stripe").
- No admin-panel changes.

Approve to start Phase 1. Phase 2 kicks off in the next turn once the audit is clean.