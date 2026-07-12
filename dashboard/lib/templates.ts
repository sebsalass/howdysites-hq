import type { Lead } from "./data";

// Outreach templates mirror docs/05-sales-playbook.md. Update both together.
export function draftEmail(lead: Lead, founder: string): { subject: string; body: string } {
  const name = lead.owner_name || "there";
  const noSite = !lead.website;
  if (noSite) {
    return {
      subject: `your Google listing, ${lead.business}`,
      body: `Hi ${name} — found ${lead.business} on Google while looking at ${lead.niche} in ${cap(lead.city)}. You've got ${lead.audit?.reviews ?? "plenty of"} reviews at ${lead.audit?.rating ?? "a strong"} stars, but when people tap for your website there's nothing there — so a chunk of them are calling the next ${lead.niche} on the list instead.

We build sites for ${cap(lead.city)} ${lead.niche} businesses — live in 7 days, no big agency price. Want me to send over a free mockup of what yours could look like?

${founder}
Howdy Sites · [PHYSICAL ADDRESS]
Reply "no thanks" and I won't email again.`,
    };
  }
  return {
    subject: `${lead.website} on a phone`,
    body: `Hi ${name} — checked out ${lead.website} and on a phone it ${problemPhrase(lead)}. Most of your customers are finding you on their phone, so that's real money walking.

We rebuild sites for ${cap(lead.city)} ${lead.niche} businesses — live in 7 days, and we handle everything after. Want a free mockup of the new version?

${founder}
Howdy Sites · [PHYSICAL ADDRESS]
Reply "no thanks" and I won't email again.`,
  };
}

// Email #2 in the sales sequence — sent once the Emergent demo is live.
export function draftMockupEmail(lead: Lead, founder: string): { subject: string; body: string } {
  const name = lead.owner_name || "there";
  return {
    subject: `built this for you, ${lead.business}`,
    body: `Hi ${name} — I went ahead and built a first draft of what a new ${lead.business} website could look like. It's live right here:

${lead.demo_url || "[DEMO URL]"}

Take a look on your phone — that's where your customers are. If you like where it's headed, the full site can be live in 7 days, and this draft stays yours either way.

Want me to finish it?

${founder}
Howdy Sites · [PHYSICAL ADDRESS]
Reply "no thanks" and I won't email again.`,
  };
}

export function draftMockupBrief(lead: Lead): string {
  return `MOCKUP BRIEF — ${lead.business}
City / niche: ${cap(lead.city)} / ${lead.niche}
Current site: ${lead.website || "none"}
Audit problems: ${(lead.audit?.problems || []).join(", ") || "n/a"}
Reviews: ${lead.audit?.reviews ?? "?"} at ${lead.audit?.rating ?? "?"} stars
Phone: ${lead.phone || "?"} · Address: ${lead.address || "?"}

Task: build a single beautiful demo homepage for this business (hero with their name + niche + city, services section, reviews strip, click-to-call CTA). Mobile-first, screenshot-ready. Use real public info only — no invented testimonials or claims.`;
}

function problemPhrase(lead: Lead): string {
  const p = lead.audit?.problems || [];
  if (p.includes("dead-site")) return "doesn't load at all";
  if (p.includes("not-mobile")) return "is unreadable — it wasn't built for phones";
  if (p.includes("no-ssl")) return "shows a security warning before anyone sees your work";
  if (p.includes("broken-form")) return "has a contact form that errors out";
  return "shows its age — slow, and hard to use";
}

function cap(s: string) {
  return s.replace(/(^|[-\s])\w/g, (c) => c.toUpperCase()).replace(/-/g, " ");
}
