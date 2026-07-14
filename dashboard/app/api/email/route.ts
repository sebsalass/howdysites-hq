import { NextRequest, NextResponse } from "next/server";
import { readLead } from "@/lib/data";
import { sendLeadEmail, sentToday, dailyCap } from "@/lib/email";

export const dynamic = "force-dynamic";

const SETUP_HELP =
  "Email isn't configured yet. Setup (10 min): 1) resend.com — free account. 2) Add domain howdysites.com, add the DNS records it shows at Cloudflare (they verify in minutes). 3) Put RESEND_API_KEY, EMAIL_FROM (e.g. Michael at Howdy Sites <howdy@howdysites.com>) and EMAIL_PHYSICAL_ADDRESS in the repo's .env. Until then, use the copy buttons and send by hand.";

// GET -> sending status (configured? sent today? cap?)
export async function GET() {
  return NextResponse.json({ sentToday: sentToday(), dailyCap: dailyCap() });
}

// POST { leadIds: string[], kind: "audit" | "mockup", by: string }
// Sends to each lead, stopping at the daily cap. Returns per-lead results.
export async function POST(req: NextRequest) {
  const { leadIds, kind, by } = await req.json();
  if (!Array.isArray(leadIds) || leadIds.length === 0 || !["audit", "mockup"].includes(kind)) {
    return NextResponse.json({ error: "leadIds[] and kind (audit|mockup) required" }, { status: 400 });
  }
  const results: { id: string; ok: boolean; reason?: string }[] = [];
  for (const id of leadIds) {
    const lead = readLead(String(id));
    if (!lead) {
      results.push({ id, ok: false, reason: "not found" });
      continue;
    }
    const r = await sendLeadEmail(lead, kind, String(by || "sebastian"));
    if (r.reason === "EMAIL_NOT_CONFIGURED") {
      return NextResponse.json({ error: SETUP_HELP }, { status: 424 });
    }
    results.push({ id, ...r });
    if (r.reason?.startsWith("daily cap")) break;
  }
  const sent = results.filter((r) => r.ok).length;
  return NextResponse.json({ sent, results, sentToday: sentToday(), dailyCap: dailyCap() });
}
