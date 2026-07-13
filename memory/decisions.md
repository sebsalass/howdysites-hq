# Decisions Log

Every business decision, dated, with who made it and why. Newest first. This is the file that settles "wait, why did we do it that way?"

---

## 2026-07-12 — Agency named: Howdy Sites (Sebastian)

- Name: **Howdy Sites**, domain **howdysites.com** (Sebastian registering). Chosen over CarbonDesignCo / EthosSites / LiveOakSites / BlueBonnetSites for the friendliest phone-and-email presence with our small-business customer. Note: howdydigital.com is an unrelated existing registrant — we deliberately avoided the "Howdy Digital" name.
- Repo renamed `agency-hq` → `howdysites-hq` (GitHub redirects old clones automatically).
- Public site plan: build in `site/` in this repo, auto-deploy to howdysites.com via Vercel's GitHub integration — every push to main goes live.
- Decision: docs stay as markdown in `docs/` (readable in the dashboard's Playbooks page + Claude Code); we are NOT using GitHub's wiki feature — it's a separate repo that would split the brain.

## 2026-07-12 — Repo founded (Sebastian)

- Business: web design + care-plan agency targeting Houston / Dallas / San Antonio businesses with missing or outdated websites.
- Structure: this repo is the single source of truth; git = team sync; dashboard reads/writes repo files.
- v1 pricing set in `config/pricing.json` ($750/$1,500/$3,000 builds + $49/$99/$199 care) — placeholder until real close-rate data exists.
- Profit split: even three ways (Sebastian / Michael / Parker) until revisited.
- Open items: agency name, lane assignments confirmation, Michael + Parker GitHub handles.
