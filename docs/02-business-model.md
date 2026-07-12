# 02 — Business Model

> **Canonical numbers live in [`config/pricing.json`](../config/pricing.json).** This doc explains the model; the JSON is what we actually tweak. If they ever disagree, the JSON wins.

## Revenue structure: build fee + care plan

Every client signs up for two things:

1. **One-time build fee** — covers the site build. Priced well under agency quotes, well above "my nephew can do it."
2. **Monthly care plan** — hosting, domain management, SSL, content edits, uptime monitoring. This is the recurring engine. A client who pays the build fee but skips the care plan is a worse client than a small build fee with a care plan attached — recurring is the business.

## Launch pricing (v1 — tweak in pricing.json)

| Tier | Build fee | Monthly care | What they get |
|---|---|---|---|
| **Starter** | $750 | $49/mo | 3-page site (Home, Services, Contact), mobile-first, Google Business link-up, contact form |
| **Standard** | $1,500 | $99/mo | 5–7 pages, photo gallery, reviews section, basic on-page SEO, 2 rounds of edits/mo |
| **Pro** | $3,000 | $199/mo | Everything in Standard + booking/quote forms, blog setup, priority same-day edits |

Positioning line: *"Agencies quote $5,000 and six weeks. We're live in seven days at a fraction of that — and we maintain it for you forever."*

## Unit economics (per Standard client)

- Build revenue: $1,500. Delivery cost: ~$20 of AI/API usage + a few hours of founder time.
- Care revenue: $99/mo. Cost: ~$5–10/mo hosting (Vercel/Netlify/Cloudflare + domain). **~90% margin.**
- 12-month client value: $1,500 + 12 × $99 ≈ **$2,690**.

## The recurring math (why care plans matter)

| Care clients | MRR @ avg $99 | Annualized |
|---|---|---|
| 10 | $990 | ~$12k |
| 30 | $2,970 | ~$36k |
| 100 | $9,900 | ~$119k |

Split three ways, 100 care clients is meaningful passive-ish income before any new builds that month. Churn is the enemy — the care plan must feel effortless and obviously worth it (fast edits, monthly "your site is healthy" report from the dashboard).

## Funnel assumptions (v1 — measure and replace with real data)

These are conservative cold-outreach benchmarks; the dashboard will track actuals.

- 100 scraped leads → ~80 with usable contact info
- 80 contacted → ~8 replies (10%)
- 8 replies → ~4 demo calls / mockup views
- 4 demos → **1–2 closes**

So roughly **1 client per 50–100 leads contacted**. At 200 contacts/week across three people, that's 2–4 new clients/week once the machine runs.

## Payment terms

- 50% of build fee up front, 50% at launch (or 100% up front with a small discount).
- Care plan billed monthly by card (Stripe), starts at launch, cancel anytime (low-friction cancel actually reduces sales resistance).
- No refunds after launch approval; one revision round included at each milestone.

## Expansion revenue (Phase 2+, not sold on day one)

- Google Business Profile optimization: $250 one-time
- Review-generation setup (QR cards, follow-up texts): $49/mo add-on
- Local SEO basics package: $299/mo
- Extra pages / landing pages: $150 each

## Costs to run the whole agency

- Hosting/domains: pass-through-ish, covered by care margin
- Google Places API: free tier likely covers early volume; budget ~$50–200/mo at scale
- Email outreach tooling (mailbox warm-up, sending): ~$30–100/mo
- Claude / AI usage: founders' existing plans initially
- LLC + bank account (do this before first invoice): ~$300 one-time in TX

Break-even is effectively the first client.
