# Work Log

Running log of who did what. Append at the end of every work session, newest first. Format: date — name — what happened.

---

## 2026-07-12 — Sebas (via Fable 5)

- Created the repo: vision, business model, roles, lead-gen / sales / delivery playbooks, dashboard spec, roadmap, pricing + targets config.
- Next: Michael and Parker clone + read; confirm lanes; pick agency name; Fable 5 starts dashboard build (spec steps 1–2).

## 2026-07-12 — Sebas (via Fable 5)

- Built the dashboard (spec steps 1–6): Overview metrics, Pipeline kanban with drag + filters, Lead detail with touch log and outreach/mockup drafting, Clients MRR table, CSV/JSON lead importer with dedupe + do-not-contact check, Money model calculator (reads/writes pricing.json), in-app Playbooks reader, Settings JSON editors, and a git Sync button. Verified with a clean `npm run build` plus live API smoke tests (import, status move, touch logging), then removed the test lead.
- Still pending from the spec: `scripts/scrape.ts` + `scripts/audit.ts` (need a Google Places API key first — see .env.example).
