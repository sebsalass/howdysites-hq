# 06 — Delivery Playbook

Goal: closed deal → live site in **7 calendar days or less**, with zero scope creep, then a smooth transition onto the care plan.

## What's included (say this out loud to every client)

A tier's page count and features are defined in `config/pricing.json` — nothing else is included. Extra requests are quoted from the expansion price list in `docs/02-business-model.md`. "Sure, we can add that — it's $150/page" is a full sentence.

## The build stack (default)

- **Static-first:** Next.js or plain HTML/Tailwind, deployed on Vercel/Netlify/Cloudflare Pages. Small-business sites don't need CMSs; edits go through the care plan (that's the point).
- **Forms:** hosted form service or serverless function → email to the client.
- **Repo per client** under the agency GitHub org, named `client-<slug>`. Site content (hours, services, photos) in a structured data file so edits are trivial.
- **Claude Code builds it.** The intake form (below) becomes the prompt. A founder art-directs and QAs; the AI does the labor.

## Day-by-day

| Day | What happens |
|---|---|
| 0 | Deal closes. Client fills intake form (business info, services, photos, brand colors, domain access). 50% payment received. |
| 1 | Claude Code generates full site draft from intake + the mockup that closed the deal. Internal QA on phone + desktop. |
| 2 | Draft link sent to client: "one round of changes included." |
| 3–5 | Client feedback → single revision round applied. |
| 6 | Domain connected, SSL, forms tested end-to-end, Google Business Profile updated to point at the site. |
| 7 | Launch. Final 50% collected. Care plan billing starts. Handoff text/call: "here's how to request edits." |

## Launch QA checklist

- [ ] Loads fast on a real phone (test on 4G, not wifi)
- [ ] Every phone number is click-to-call; every form actually delivers
- [ ] Hours, address, services match their Google Business Profile exactly
- [ ] SSL green, no console errors, favicon set, OG/social preview set
- [ ] Google Business Profile "website" field updated ← the whole funnel exists because of this field; don't be a lead for the next agency
- [ ] Lighthouse: 90+ performance, accessibility pass
- [ ] Client can name one person + one channel for edit requests

## Care plan operations

- Edit requests come by text/email to Delivery lane → done within the tier's SLA (Pro: same day, Standard: 48h, Starter: within the week)
- Monthly automated health report per client (uptime, traffic if analytics installed, "3 edits completed") — this is churn insurance; the report is generated from the dashboard
- Every care action logged in the client's record in `data/leads/` (status: `client`)

## No-fabrication rule

Never invent testimonials, review counts, "as seen in" logos, or traffic claims on client sites or our own. Real reviews (pulled with permission), real photos, real claims.
