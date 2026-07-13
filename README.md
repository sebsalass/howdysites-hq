# Howdy Sites — HQ

**howdysites.com** — a web design + care-plan agency run by **Sebastian, Michael, and Parker**. We find local businesses in **Houston, Dallas, and San Antonio** that have no website or a badly outdated one, and we sell them a modern site plus ongoing hosting/maintenance.

This repo is the **single source of truth** for the whole operation:

- The master business plan lives in `docs/`
- Tweakable numbers (pricing, targets, cities, niches) live in `config/` — change the JSON, commit, everyone has the new model
- Shared team memory (decisions, lead notes, session logs) lives in `memory/` and `data/`
- The operations dashboard lives in `dashboard/`
- The public site (howdysites.com) will live in `site/` and auto-deploy from this repo on every push

## How this works for the team

1. Each of us clones this repo.
2. Anyone opens it in **Claude Code** — `CLAUDE.md` gives Claude full context instantly, so all three of us are talking to an assistant that knows the same plan, the same pricing, the same pipeline.
3. Work happens → gets committed → pushed. `git pull` is how we sync brains.
4. The dashboard app reads directly from `config/` and `data/`, so the repo IS the database. Pull the repo, run the app, see the same pipeline everyone else sees.

## Quick start

> New teammate? Follow **[SETUP.md](SETUP.md)** — 10 minutes, no terminal needed after day one.
>
> Putting howdysites.com live? That job is **[SETUP-DOMAIN.md](SETUP-DOMAIN.md)** (owner: Michael).

```bash
git clone https://github.com/sebsalass/howdysites-hq.git
cd howdysites-hq
claude   # open in Claude Code — it reads CLAUDE.md automatically
```

Then boot the dashboard — **double-click `Howdy HQ.command`** in Finder. It pulls the latest team data, installs anything missing (first run only), starts the app, and opens http://localhost:3000. Keep the window open while you work.

> First-time setup on a new machine: install Node.js — either the [LTS installer](https://nodejs.org) (easiest) or via nvm (`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash`, then `nvm install 24`) — clone this repo, double-click the launcher (it finds nvm-installed Node automatically). If macOS blocks the first double-click: right-click the file, then Open. (Terminal equivalent: `cd dashboard && npm install && npm run dev`.)

Work leads → hit the **Sync** button in the dashboard header (it commits `data/`, `memory/`, `config/` and pushes) → teammates pull (the launcher does it on every boot) and they're current.

## Repo map

| Path | What it is |
|---|---|
| `docs/01-vision.md` | Why this business, the opportunity, the goal |
| `docs/02-business-model.md` | Pricing tiers, revenue math, unit economics |
| `docs/03-roles.md` | Who does what — Sebastian / Michael / Parker |
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
