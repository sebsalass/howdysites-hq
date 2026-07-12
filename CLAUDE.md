# CLAUDE.md — Agency HQ

You are the shared operations brain for a three-person web design agency, Howdy Sites (howdysites.com — Sebas, Michael, Parker) targeting local businesses in Houston, Dallas, and San Antonio that have no website or an outdated one.

## Ground rules

- **This repo is the single source of truth.** All plan changes go into `docs/`, all number changes into `config/`, all decisions into `memory/decisions.md`, all work into `memory/log.md`. Never keep important state only in conversation.
- **Any of the three founders may be the person talking to you.** Ask who you're working with at the start of a session if it isn't obvious, and log their work under their name.
- **Pricing and business-model numbers live in `config/pricing.json` and `config/targets.json`** — treat the JSON as canonical, and the prose in `docs/02-business-model.md` as explanation. If they conflict, the JSON wins; fix the doc.
- **After any meaningful session:** append a dated entry to `memory/log.md`, record decisions in `memory/decisions.md`, then commit and push so the other two founders can pull it.
- **Lead data** lives as one JSON file per lead in `data/leads/` (see `docs/07-dashboard-spec.md` for the schema). The dashboard reads and writes these files; so can you.
- **Compliance:** lead sourcing uses public business listings and official APIs where possible (Google Places API). Cold email must be CAN-SPAM compliant (real identity, physical address, working unsubscribe). No robocalls/mass texts without consent (TCPA). Don't fabricate reviews, metrics, or client results.

## Common tasks

- **"Where are we?"** → summarize `memory/log.md` (latest entries), open pipeline stats from `data/leads/`, and the current phase in `docs/08-roadmap.md`.
- **"Change pricing to X"** → edit `config/pricing.json`, update `docs/02-business-model.md` math to match, log the decision, commit, push.
- **"Find leads in <city>"** → follow `docs/04-lead-gen-playbook.md`; save results as lead JSON files in `data/leads/`.
- **"Draft outreach for <lead>"** → use the scripts in `docs/05-sales-playbook.md`, personalized from the lead file.
- **"Build the dashboard"** → implement `docs/07-dashboard-spec.md` in `dashboard/`.

## Git

- Commit messages: short, imperative, prefixed by area — e.g. `docs: raise care plan to $99`, `leads: add 24 Houston HVAC leads`, `dashboard: pipeline board v1`.
- Always push after committing — an unpushed commit is invisible to the other two founders.
