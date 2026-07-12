# Agency HQ

**Working name: TBD** (repo can be renamed anytime — nothing depends on the name)

A web design + marketing agency run by **Sebas, Michael, and Parker**. We find local businesses in **Houston, Dallas, and San Antonio** that have no website or a badly outdated one, and we sell them a modern site plus ongoing hosting/maintenance.

This repo is the **single source of truth** for the whole operation:

- The master business plan lives in `docs/`
- Tweakable numbers (pricing, targets, cities, niches) live in `config/` — change the JSON, commit, everyone has the new model
- Shared team memory (decisions, lead notes, session logs) lives in `memory/` and `data/`
- The operations dashboard (to be built by Fable 5) lives in `dashboard/`

## How this works for the team

1. Each of us clones this repo.
2. Anyone opens it in **Claude Code** — `CLAUDE.md` gives Claude full context instantly, so all three of us are talking to an assistant that knows the same plan, the same pricing, the same pipeline.
3. Work happens → gets committed → pushed. `git pull` is how we sync brains.
4. The dashboard app reads directly from `config/` and `data/`, so the repo IS the database. Pull the repo, run the app, see the same pipeline everyone else sees.

## Quick start

```bash
git clone https://github.com/sebsalass/agency-hq.git
cd agency-hq
claude   # open in Claude Code — it reads CLAUDE.md automatically
```

Once the dashboard is built:

```bash
cd dashboard
npm install
npm run dev   # opens the ops dashboard at localhost:3000
```

## Repo map

| Path | What it is |
|---|---|
| `docs/01-vision.md` | Why this business, the opportunity, the goal |
| `docs/02-business-model.md` | Pricing tiers, revenue math, unit economics |
| `docs/03-roles.md` | Who does what — Sebas / Michael / Parker |
| `docs/04-lead-gen-playbook.md` | How we find businesses without (good) websites |
| `docs/05-sales-playbook.md` | Outreach scripts, objection handling, closing |
| `docs/06-delivery-playbook.md` | How we build + launch a client site fast |
| `docs/07-dashboard-spec.md` | Full spec for the app Fable 5 will build |
| `docs/08-roadmap.md` | Phases from zero to recurring revenue |
| `config/pricing.json` | The numbers — edit these to tweak the model |
| `config/targets.json` | Cities, niches, lead quotas |
| `memory/decisions.md` | Every business decision we make, dated |
| `memory/log.md` | Running work log (who did what, when) |
| `data/leads/` | The lead pipeline (dashboard reads/writes here) |
