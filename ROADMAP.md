# AlgoPilot — Build Roadmap: "Beat AlphaInsider"

> Audit date: 2026-06-07. Direction locked: **auto-execute**, **both markets (crypto + stocks)**, two-sided marketplace.
> This roadmap is prioritized. Phase 0 first; Phases 2–3 are the real differentiators vs AlphaInsider.

## Where we stand (the expensive 80% is done)

**Built & working** (28 tables, ~90 endpoints):
- Marketplace browse/filter/subscribe; creator dashboards + gated applications; creator social posts/comments/reactions.
- Money: Stripe subscriptions, discount codes, featured placements, **Stripe Connect payouts** (75% creator / 25% platform, min-$100, admin approval).
- Auto-execution: AES-256-GCM-encrypted exchange connections (**Binance + Bybit**, spot/futures, paper/live/testnet), webhook → trade-execution → P&L, rich per-subscription bot settings (leverage, sizing modes, SL/TP, slippage, schedule).
- Trust layer (started): performance-gated evaluation engine (`botEvaluation*` tables — runs/trades/positions) with tamper-proof server-side metrics + chronological drawdown replay. Thresholds currently: 15 trades / +8% / <12% DD (schema defaults).
- Infra: WebSocket realtime, admin panel, CSRF/CSP/rate-limiting, Resend email, onboarding, legal pages.

**Key architectural seams we'll use:**
- `server/exchange-clients/base.ts` — `BaseExchangeClient` abstract (testConnection/getBalance/placeOrder/cancelOrder/getOrderStatus/getOpenPositions/closePosition). Adding a venue = implement this + register in `factory.ts`.
- Webhook ingestion: `POST /api/webhooks/:botId/:secret` (`routes.ts:3421`).
- Two trade ledgers: `botTradeLogs` + `botEvaluation*` (creator track record) vs `trades`/`positions` (subscriber fills). Correct separation for a signal marketplace.

---

## Phase 0 — Run it & verify (foundation, do first)
Goal: app running locally, core flows smoke-tested, so we build on observed reality.
- [ ] Recover/regenerate secrets (see SECRETS table below); fresh Neon Postgres DB.
- [ ] Fix Windows dev script: `dev` uses bash-style `NODE_ENV=...` → add `cross-env` (or run via Bash tool).
- [ ] `npm install` → `npm run db:push` → `npm run dev`; seed (`server/seed.ts`); promote admin (`server/scripts/setup-admin.ts`).
- [ ] Smoke test: register → create bot → webhook test signal → evaluation progress → subscribe (Stripe test) → paper exchange connect → simulated execution.

## Phase 1 — "Both markets": add STOCKS (Alpaca)
Goal: close the explicit gap. Contained job thanks to the exchange abstraction.
- [ ] `server/exchange-clients/alpaca.ts` implementing `BaseExchangeClient` (paper + live; API-key auth). Handle: market hours, fractional shares, no leverage on cash accts, long/short rules, symbol format (e.g. `AAPL` not `AAPL-USD`).
- [ ] Register in `factory.ts`; add `Alpaca` to exchange options + connection-form UI; tag bots/connections with asset class (crypto|stocks).
- [ ] Marketplace filter by asset class; ensure price-fetcher + P&L handle equities.
- [ ] (Later) IBKR via gateway — bigger lift; defer.

## Phase 2 — The trust MOAT (the real "better than AlphaInsider")
Goal: make verifiability a feature competitors can't match. This is the CLV/anti-overfit ethos as product.
- [ ] **2a. Live-vs-evaluation divergence monitor** (their doc lists FUTURE): track each live bot's post-launch stats vs its passing evaluation; auto-flag + badge when live materially underperforms. Builds subscriber trust + auto-protects them.
- [ ] **2b. Tamper-evident signal ledger (commit-reveal):** hash each incoming signal at receipt (payload + server timestamp), chain prev-hash → append-only verifiable log per bot. Publish a "Verified Live" badge. Optional: daily Merkle root anchored via OpenTimestamps for third-party-provable timestamps.
- [ ] **2c. Min evaluation period (7–14d)** + surface **# of failed attempts** per bot/creator (anti "multiple attempts" gaming, their RECOMMENDED).

## Phase 3 — Honest metrics layer
Goal: rank on truth, not vanity %. Differentiator on the marketplace surface.
- [ ] **R-multiple expectancy** + **sample-size confidence** labels ("47 trades — not yet significant").
- [ ] **Capacity cap** per strategy (stop taking subs before crowding) + **actual-vs-theoretical slippage** tracking (signal price vs subscriber fill) → surface live slippage decay.
- [ ] Separate **forward (live) curve** from any backtest visually; never blend.

## Phase 4 — Launch as creator #1 + growth
- [ ] Seed your own verified books (Crypto-ORB, Gold-fade, Supertrend-filter) as the first listings → solves cold-start, proves the trust tech on yourself.
- [ ] Public verified-track-record pages (SEO/shareable); referral; analytics.

## Cross-cutting / risk (track throughout)
- **Compliance:** non-custodial messaging, "information not advice" disclaimers, ToS/Privacy review by a lawyer before taking real money; geo-restrictions (US retail crypto/stocks nuance).
- **Tech debt:** `routes.ts` is a 150KB monolith — consider splitting into routers once we're actively editing it (not urgent).
- **Secrets hygiene:** any keys pasted in chat → rotate.

## SECRETS — recover vs regenerate (Phase 0)
Replit stores secrets in its **Secrets manager (cloud)**, NOT in the repo (no `.env` was committed). To run locally:
| Var | Source | Action |
|---|---|---|
| `DATABASE_URL` (+ PG*) | Neon (via Replit) | Recover from Replit Secrets, OR provision a fresh free Neon DB (clean slate). |
| `SESSION_SECRET` | self | Regenerate (any 32+ char random). |
| `ENCRYPTION_KEY` | self | Regenerate **only if** fresh DB (old encrypted exchange creds become undecryptable; moot on clean DB). |
| `STRIPE_SECRET_KEY` / `VITE_STRIPE_PUBLIC_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe dashboard | Recover (use **test** keys for local). |
| `RESEND_API_KEY` | Resend dashboard | Recover, or stub email in dev. |
