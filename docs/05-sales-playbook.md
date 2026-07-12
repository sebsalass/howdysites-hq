# 05 — Sales Playbook

Goal: turn lead files into paying clients. Every touch gets logged in the lead's JSON file (the dashboard shows who's been contacted, when, and what happened).

## The core move: the personalized audit + mockup

We never send "we build websites" spam. Every first touch references **their specific business and their specific problem**, and the follow-up shows them **a mockup of their own new homepage**. The mockup is our whole advantage — Claude Code can generate a beautiful demo homepage for a specific business in minutes, so we can afford to do it *before* they pay.

## Sequence (per lead)

1. **Day 0 — Email #1 (the audit):** 3 sentences. What we noticed, what it's costing them, one question.
2. **Day 2 — Call:** ask for the owner, 30-second version of the email. Goal is not to close — it's to get permission to send the mockup.
3. **Day 4 — Email #2 (the mockup):** a LIVE link to their demo homepage (built via the dashboard's Mockup pipeline: paste their Google Business link, build in Emergent, save the demo URL — the page generates this email and a QR code). "Built this for you — want the rest?" The QR version of the demo link goes on printed one-pagers and door hangers for in-person visits.
4. **Day 8 — Email #3 (the breakup):** "Closing your file — should I?" (breakup emails get the most replies)
5. Reply at any point → book a 15-minute call → close on the call.

## Scripts (v1 — iterate in this file as we learn)

### Email #1 — no website at all

> Subject: your Google listing, [Business Name]
>
> Hi [Name] — found [Business Name] on Google while looking at [niche] in [area]. You've got [X] reviews at [Y] stars, but when people tap for your website there's nothing there — so a chunk of them are calling the next [niche] on the list instead.
>
> We build sites for [city] [niche]s — live in 7 days, no big agency price. Want me to send over a free mockup of what yours could look like?
>
> [Founder name] · Howdy Sites · [address] · reply "no thanks" and I won't email again

### Email #1 — outdated site

> Subject: [businessdomain].com on a phone
>
> Hi [Name] — checked out [businessdomain].com and on a phone it [specific problem: doesn't load / is unreadable / the contact form errors]. Most of your customers are finding you on their phone, so that's real money walking.
>
> We rebuild sites for [city] [niche]s — live in 7 days, and we handle everything after. Want a free mockup of the new version?

### The close (on the call)

- Anchor high: "Agencies around [city] quote $5k+ and 6 weeks for this."
- Present the tier that fits (usually Standard), build fee + care plan together, never the build alone.
- Objection "too expensive" → drop to Starter, never discount Standard.
- Objection "I'll think about it" → "Totally fine — the mockup stays yours either way. Can I follow up Friday?"
- Objection "my nephew/friend does our site" → "Great — keep them! The care plan means it never falls on them at 9pm when something breaks."
- Close = send Stripe payment link + intake form **while still on the call**.

## Rules

- Log EVERY touch (date, channel, outcome) in the lead file, commit, push. If Michael is out, anyone can pick up a lead cold from its file.
- Honor "no" instantly: set lead status to `do-not-contact`. Never re-add them.
- CAN-SPAM: real name, real physical address, working opt-out in every cold email.
- Max 25 cold emails/day per mailbox (deliverability), from a warmed secondary domain — not our main domain.
