# 07 — Dashboard Spec (for Fable 5 to build)

The operations dashboard: one app, run locally by each founder, that turns this repo into a shared agency control center. **The repo is the database** — the app reads and writes JSON in `data/` and `config/`, and git push/pull is the sync layer. No server, no accounts, no hosting bill.

## Architecture

- **Next.js app in `dashboard/`**, runs with `npm run dev` (or `npm run build && npm start`). Local-only; binds to localhost.
- Reads/writes the repo's own files via API routes (Node `fs`). Every write goes to disk immediately.
- A **Sync button** in the header runs `git pull --rebase && git add data memory && git commit && git push` via a server route, and shows ahead/behind status so founders can see if they're stale.
- Config-driven: pricing tiers, cities, niches, funnel targets all rendered from `config/*.json` — tweak the JSON (or edit in the Settings page), the whole app updates.
- Stack: Next.js 15 + Tailwind. No external services required to run. Dark UI, no emojis in the interface.

## Data model

### Lead file — `data/leads/<city>-<slug>.json`

```json
{
  "id": "hou-smith-hvac",
  "business": "Smith HVAC",
  "city": "houston",
  "niche": "hvac",
  "address": "…",
  "phone": "…",
  "email": "…",
  "owner_name": "…",
  "contact_source": "google-business-profile",
  "website": null,
  "audit": { "score": 92, "problems": ["no-website"], "reviews": 47, "rating": 4.6, "audited_at": "2026-07-12" },
  "status": "new",
  "assigned_to": "michael",
  "value_tier": "standard",
  "touches": [
    { "date": "2026-07-14", "by": "michael", "channel": "email", "note": "sent audit email #1" }
  ],
  "client": null
}
```

`status` enum: `new → contacted → replied → demo-sent → negotiating → closed-won (→ client) | closed-lost | do-not-contact`

When `closed-won`, the `client` object gets filled: tier, build_fee, care_mrr, launch_date, site_repo, care_log[].

### Other data

- `config/pricing.json`, `config/targets.json` — settings pages edit these
- `memory/log.md`, `memory/decisions.md` — appended to by the app (activity + decisions)
- `data/do-not-contact.json` — flat list, checked by lead importer

## Pages

1. **Overview (home)** — the numbers that matter: pipeline funnel this week vs. targets (leads added, contacted, replies, demos, closes), current MRR from care plans, cash collected this month, per-founder activity streak. Everything computed live from lead files.
2. **Pipeline (kanban)** — leads as cards in status columns, drag to move (writes status + auto-touch). Filter by city/niche/assignee. Card shows audit score, review count, last touch age (stale >7 days glows red).
3. **Lead detail** — full record, touch timeline, one-click log-a-touch form, buttons: "Draft outreach email" and "Draft mockup brief" (fills templates from the sales playbook with this lead's data, copies to clipboard).
4. **Clients** — closed-won leads: care MRR table, launch dates, next health-report due, edit-request log, churn tracking.
5. **Leads importer** — paste/upload a CSV or JSON array of scraped businesses → dedupes against existing leads + do-not-contact → writes lead files. (The scraper itself lives in `scripts/`, see below — this page is where its output lands.)
6. **Money** — revenue model calculator wired to `pricing.json`: sliders for close rate, leads/week, tier mix → projected MRR curve. This is the "tweak the business model" page — saving writes back to the JSON.
7. **Playbooks** — renders the `docs/*.md` files in-app so nobody has to leave the dashboard to check a script.
8. **Settings** — edit pricing/targets JSON with validation, founder profiles, git sync status.

## Scripts (CLI, in `scripts/`, run by Lane 1 or by Claude Code)

- `scripts/scrape.ts <city> <niche>` — Google Places API pull (key in `.env`, never committed) → raw candidate list
- `scripts/audit.ts` — for each candidate: website presence/liveness/mobile checks → score
- `scripts/import.ts` — score-filter, dedupe, emit lead JSON files

Keep scripts idempotent and re-runnable. API keys via `.env` (gitignored), with `.env.example` committed.

## Build order for Fable 5

1. Scaffold Next.js app + repo file-access layer + Sync button
2. Lead schema + Pipeline kanban + Lead detail (the daily-driver pages)
3. Overview metrics + Money calculator
4. Importer + scrape/audit scripts
5. Clients page + health-report generator
6. Playbooks renderer + Settings

Ship after step 2 — the team can start working leads with just the kanban.

## Non-goals (v1)

No auth/multi-user server, no external DB, no mobile app, no email-sending from the app (drafts are copy-paste — keeps deliverability and compliance in human hands).
