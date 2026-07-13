# 04 — Lead Gen Playbook

Goal: a steady weekly flow of qualified leads — local businesses in Houston, Dallas, or San Antonio with **no website or a visibly bad one** — saved as structured files in `data/leads/`.

Quotas and target niches live in [`config/targets.json`](../config/targets.json).

## The pipeline in one line

**Pull business listings (public data / APIs) → check each one's website automatically → score the bad ones → enrich with contact info → save as lead files.**

## Step 1 — Source businesses

Primary source: **Google Places API** (official, legal, reliable — has a `website` field, which is exactly the signal we need).

- Query pattern: `<niche> in <zip>` — we organize the whole database by **ZIP code** (`scripts/scrape.mjs "hvac" 77502 77506 --city=houston`). Iterate over zips to beat the 60-results-per-query cap, and the dashboard's Territories page shows which zips are richest in bad websites.
- Secondary sources: Yelp Fusion API, Texas Secretary of State new-LLC filings (brand-new businesses rarely have sites yet), local chamber-of-commerce directories.
- **Rules:** use official APIs where they exist, respect rate limits and robots.txt, only collect business (not personal) data that's already public. No scraping behind logins.

## Step 2 — Audit their web presence (automated)

For each business, a script checks and scores:

| Check | Signal of a bad/missing site |
|---|---|
| `website` field empty | **Jackpot — no site at all** |
| Website is a facebook.com / instagram.com / linktree URL | No real site |
| Site doesn't load / SSL error / parked domain | Dead site |
| Not mobile-responsive (viewport meta missing) | Outdated |
| Copyright footer ≤ 2020, Flash, table layouts | Outdated |
| No contact form / click-to-call | Losing customers |
| PageSpeed score < 40 | Slow, likely old |

Every business gets a **Website Report Score, 0–100** (`scripts/audit.mjs`): **100 = great website, 0 = no website at all.** Rubric: loads over HTTPS (30) + valid SSL (15) + mobile viewport (15) + click-to-call/form (10) + fast (10) + title/description (5+5) + recent copyright (5) + not parked (5). Facebook-only = 10, dead site = 5. Anything **below** `lead_quality.max_web_score` in `targets.json` becomes a lead — and the score itself goes in the outreach email ("your site scored 22/100").

## Step 3 — Qualify

A good lead also shows signs of **being a real, revenue-generating business that cares**:

- 10+ Google reviews (they have customers) — sweet spot is 3.8★+ with recent reviews
- Still answering their phone / posting on Facebook
- In a niche with high ticket sizes (roofer > coffee shop) — see niche priorities in targets.json

## Step 4 — Enrich

Find the decision-maker contact: business email and owner name where publicly listed (their GBP, Facebook page, TX SOS filing, Hunter-style lookup on their domain if they have one). Log the source of every contact detail in the lead file.

## Step 5 — Save

One JSON file per lead in `data/leads/`, named `<city>-<slug>.json`, following the schema in `docs/07-dashboard-spec.md`. Commit and push — that's how the lead reaches Michael.

## Weekly cadence

- Monday: run the scrape+audit for that week's niche/city combo (rotate per targets.json)
- Deduplicate against existing `data/leads/` before committing
- Target: quota in `targets.json` (v1: 100 new qualified leads/week)

## Compliance notes (non-negotiable)

- Google Places API terms: don't cache/redistribute Google content beyond what terms allow; we store our own derived audit + contact info, not their proprietary content wholesale.
- Cold **email** is legal under CAN-SPAM: must include our real identity, a physical address, and a working opt-out; honor opt-outs immediately (dashboard tracks a do-not-contact list).
- No automated cold **texts or robocalls** (TCPA). Manual, one-to-one calls are fine.
