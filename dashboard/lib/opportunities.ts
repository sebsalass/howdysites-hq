import type { Lead } from "./data";

export type Pricing = {
  tiers: Record<string, { label: string; build_fee: number; care_monthly: number }>;
  expansion: {
    gbp_optimization_onetime: number;
    review_gen_monthly: number;
    local_seo_monthly: number;
    extra_page: number;
  };
};

export type Opportunity = { title: string; detail: string; price: string; kind: "core" | "addon" };

// What can we sell this lead, based on what we know about them?
// Mirrors the offerings in docs/02-business-model.md — update both together.
export function opportunities(lead: Lead, pricing: Pricing): Opportunity[] {
  const out: Opportunity[] = [];
  const problems = lead.audit?.problems || [];
  const reviews = lead.audit?.reviews ?? 0;
  const rating = lead.audit?.rating ?? 0;
  const highTicket = ["hvac", "roofing", "plumbing"].includes(lead.niche);
  const bookingNiche = ["barbershops", "auto-detailing", "cleaning", "restaurants"].includes(lead.niche);

  const tierKey = highTicket ? (reviews >= 50 ? "pro" : "standard") : bookingNiche ? "starter" : "standard";
  const tier = pricing.tiers[tierKey];

  if (!lead.website) {
    out.push({
      kind: "core",
      title: `First-ever website — pitch ${tier.label}`,
      detail: `No site at all: every Google searcher currently bounces to a competitor. ${reviews ? `Their ${reviews} reviews at ${rating} stars prove real demand with nothing capturing it.` : ""}`,
      price: `$${tier.build_fee.toLocaleString()} + $${tier.care_monthly}/mo`,
    });
  } else {
    out.push({
      kind: "core",
      title: `Rebuild — pitch ${tier.label}`,
      detail: `Existing site has problems (${problems.join(", ") || "outdated"}). Lead with the specific broken thing, not "modern design."`,
      price: `$${tier.build_fee.toLocaleString()} + $${tier.care_monthly}/mo`,
    });
  }

  if (highTicket && tierKey !== "pro") {
    out.push({
      kind: "core",
      title: "Upsell path: Pro with quote forms",
      detail: `${cap(lead.niche)} jobs are high-ticket — one extra lead a month pays for the Pro tier by itself. Pitch quote-request forms as a lead machine, not a website feature.`,
      price: `$${pricing.tiers.pro.build_fee.toLocaleString()} + $${pricing.tiers.pro.care_monthly}/mo`,
    });
  }

  if (bookingNiche) {
    out.push({
      kind: "addon",
      title: "Booking flow",
      detail: "Appointment-driven business: an online booking page cuts their phone tag and makes the care plan sticky.",
      price: `included in Pro, or +$${pricing.expansion.extra_page} as a page`,
    });
  }

  if (!lead.gbp_url) {
    out.push({
      kind: "addon",
      title: "Google Business Profile optimization",
      detail: "No GBP link on file — either they don't have one (big gap, easy win) or we haven't captured it yet. Verify first; if unclaimed, this is the strongest add-on in the deck.",
      price: `$${pricing.expansion.gbp_optimization_onetime} one-time`,
    });
  }

  if (reviews > 0 && rating > 0 && rating < 4.2) {
    out.push({
      kind: "addon",
      title: "Review generation",
      detail: `Rating is ${rating} — below the 4.2 trust line. QR cards + follow-up flow lifts it; frame as "get your happy customers on the record."`,
      price: `$${pricing.expansion.review_gen_monthly}/mo`,
    });
  } else if (reviews >= 30 && rating >= 4.4) {
    out.push({
      kind: "addon",
      title: "Local SEO package",
      detail: `${reviews} reviews at ${rating} stars means Google already trusts them — SEO spend compounds fast on a base like this. Sell after launch, not in the first pitch.`,
      price: `$${pricing.expansion.local_seo_monthly}/mo`,
    });
  }

  return out;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
