# Work Log

Running log of who did what. Append at the end of every work session, newest first. Format: date — name — what happened.

---

## 2026-07-12 — Sebastian (via Fable 5)

- Created the repo: vision, business model, roles, lead-gen / sales / delivery playbooks, dashboard spec, roadmap, pricing + targets config.
- Next: Michael and Parker clone + read; confirm lanes; pick agency name; Fable 5 starts dashboard build (spec steps 1–2).

## 2026-07-12 — Sebastian (via Fable 5)

- Built the dashboard (spec steps 1–6): Overview metrics, Pipeline kanban with drag + filters, Lead detail with touch log and outreach/mockup drafting, Clients MRR table, CSV/JSON lead importer with dedupe + do-not-contact check, Money model calculator (reads/writes pricing.json), in-app Playbooks reader, Settings JSON editors, and a git Sync button. Verified with a clean `npm run build` plus live API smoke tests (import, status move, touch logging), then removed the test lead.
- Still pending from the spec: `scripts/scrape.ts` + `scripts/audit.ts` (need a Google Places API key first — see .env.example).

## 2026-07-12 — Sebastian (via Fable 5)

- Named the agency **Howdy Sites** (howdysites.com, buying via Cloudflare); repo renamed to howdysites-hq; name swept through docs, templates, dashboard branding.
- Added to the dashboard: Google Business + demo-site link fields, Opportunities panel (pitch suggestions computed from lead data + pricing.json), and the "Build demo in Emergent" button (Emergent = pre-sale demo factory, documented in delivery playbook).
- Built the public site v1 in `site/` — single static HTML, shop-sign design, real pricing, free-mockup CTA, no fabricated content. Deploy plan: Cloudflare Pages connected to this private repo, root dir `site/`, auto-deploy on push.
- Before launch: buy domain, create howdy@howdysites.com mailbox, replace physical-address placeholder in footer + email templates (needs LLC address).

## 2026-07-12 — Sebastian (via Fable 5)

- Built the Mockup pipeline page in the dashboard: paste a Google Business/Maps link → lead auto-created (name parsed from the URL) + Emergent brief copied + Emergent opened → paste back the demo URL → branded QR code (PNG download) + "built this for you" client email draft generated. Same QR + email button added to lead detail for any lead with a demo. Sales playbook Email #2 updated to use it.

## 2026-07-12 — Sebastian (via Fable 5)

- Pipeline now tracks the six-step mockup process per client (Advisor → Google Business → Description → Emergent → QR → Email), derived automatically from lead data — dots on every kanban card, full tracker on lead detail. Added a "By advisor" view: one column per founder (plus Unassigned) showing each advisor's clients, their status, and what step each is on. Advisor can be reassigned straight from any card; the Mockup pipeline auto-assigns whoever ran it.
