import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { REPO, readLeads, readJson, writeLead, today, type Lead } from "./data";
import { draftEmail, draftMockupEmail } from "./templates";

// Real email sending via Resend (resend.com — free tier 100/day, domain
// verified through Cloudflare DNS). Config lives in the repo root .env:
//   RESEND_API_KEY=re_...
//   EMAIL_FROM=Michael at Howdy Sites <howdy@howdysites.com>
//   EMAIL_PHYSICAL_ADDRESS=123 Main St, Houston, TX 77002
//
// Guards, in order — every send must pass all of them:
//   1. lead has an email address
//   2. lead is not on the do-not-contact list
//   3. CAN-SPAM: a real physical address is configured (no placeholder mail)
//   4. daily cap (targets.json outreach.daily_email_cap) — deliverability

function env(): Record<string, string> {
  const out: Record<string, string> = {};
  const f = join(REPO, ".env");
  if (existsSync(f)) {
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
      if (m) out[m[1]] = m[2];
    }
  }
  for (const k of ["RESEND_API_KEY", "EMAIL_FROM", "EMAIL_PHYSICAL_ADDRESS"]) {
    if (process.env[k]) out[k] = process.env[k]!;
  }
  return out;
}

export function sentToday(): number {
  return readLeads()
    .flatMap((l) => l.touches)
    .filter((t) => t.date === today() && (t.note || "").startsWith("email sent")).length;
}

export function dailyCap(): number {
  const t = readJson<{ outreach?: { daily_email_cap?: number } }>("config/targets.json");
  return t.outreach?.daily_email_cap ?? 25;
}

export type SendResult = { ok: boolean; reason?: string };

export async function sendLeadEmail(lead: Lead, kind: "audit" | "mockup", by: string): Promise<SendResult> {
  const cfg = env();
  if (!cfg.RESEND_API_KEY || !cfg.EMAIL_FROM) {
    return { ok: false, reason: "EMAIL_NOT_CONFIGURED" };
  }
  if (!cfg.EMAIL_PHYSICAL_ADDRESS) {
    return { ok: false, reason: "CAN-SPAM: set EMAIL_PHYSICAL_ADDRESS in .env before any cold email goes out." };
  }
  if (!lead.email) return { ok: false, reason: "no email address on file" };
  if (lead.status === "do-not-contact") return { ok: false, reason: "lead is do-not-contact" };
  const dnc = readJson<{ list: string[] }>("data/do-not-contact.json");
  if (dnc.list.includes(lead.id)) return { ok: false, reason: "lead is on the do-not-contact list" };
  if (sentToday() >= dailyCap()) {
    return { ok: false, reason: `daily cap reached (${dailyCap()}/day for deliverability — raise it in targets.json when the domain is warmed)` };
  }

  const founder = by.charAt(0).toUpperCase() + by.slice(1);
  const draft = kind === "mockup" ? draftMockupEmail(lead, founder) : draftEmail(lead, founder);
  const body = draft.body.replace("[PHYSICAL ADDRESS]", cfg.EMAIL_PHYSICAL_ADDRESS);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: cfg.EMAIL_FROM, to: [lead.email], subject: draft.subject, text: body }),
  });
  if (!res.ok) {
    return { ok: false, reason: `send failed: ${(await res.text()).slice(0, 200)}` };
  }

  lead.touches.push({ date: today(), by, channel: "email", note: `email sent (${kind}) to ${lead.email}` });
  if (lead.status === "new") {
    lead.touches.push({ date: today(), by, channel: "status", note: "new -> contacted" });
    lead.status = "contacted";
  }
  writeLead(lead);
  return { ok: true };
}
