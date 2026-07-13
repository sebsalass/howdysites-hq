import { NextRequest, NextResponse } from "next/server";
import { readLeads, writeLead, readJson, safeId, today, appendLog, type Lead } from "@/lib/data";

export const dynamic = "force-dynamic";

// POST body: { text: string } — a JSON array of leads, or CSV with a header row.
export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "empty input" }, { status: 400 });

  let rows: Record<string, unknown>[];
  try {
    rows = text.trim().startsWith("[") ? JSON.parse(text) : parseCsv(text);
  } catch (e) {
    return NextResponse.json({ error: `parse failed: ${e}` }, { status: 400 });
  }

  const existing = new Set(readLeads().map((l) => l.id));
  const dnc = new Set(readJson<{ list: string[] }>("data/do-not-contact.json").list);
  let added = 0,
    skipped = 0;

  for (const r of rows) {
    const business = String(r.business || r.name || "").trim();
    const city = String(r.city || "").trim().toLowerCase();
    const niche = String(r.niche || r.category || "").trim().toLowerCase();
    if (!business || !city) {
      skipped++;
      continue;
    }
    const id = safeId(String(r.id || `${city}-${business.replace(/\s+/g, "-")}`));
    if (existing.has(id) || dnc.has(id)) {
      skipped++;
      continue;
    }
    const lead: Lead = {
      id,
      business,
      city,
      niche,
      zip: str(r.zip),
      address: str(r.address),
      phone: str(r.phone),
      email: str(r.email),
      owner_name: str(r.owner_name),
      contact_source: str(r.contact_source),
      website: str(r.website) || null,
      gbp_url: str(r.gbp_url ?? r.google_business ?? r.maps_url),
      audit: {
        web_score: num(r.web_score ?? (r.audit as Record<string, unknown>)?.web_score) ?? (str(r.website) ? 50 : 0),
        problems: parseProblems(r),
        checks: typeof r.checks === "object" && r.checks !== null ? (r.checks as Record<string, boolean>) : undefined,
        reviews: num(r.reviews ?? (r.audit as Record<string, unknown>)?.reviews),
        rating: num(r.rating ?? (r.audit as Record<string, unknown>)?.rating),
        audited_at: today(),
      },
      status: "new",
      created_at: today(),
      touches: [],
      client: null,
    };
    writeLead(lead);
    existing.add(id);
    added++;
  }

  if (added) appendLog(`imported ${added} leads (${skipped} skipped as dupes/invalid)`);
  return NextResponse.json({ added, skipped });
}

function parseCsv(text: string): Record<string, unknown>[] {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i]?.trim() ?? ""]));
  });
}

// Minimal CSV split with quoted-field support.
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "",
    inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function str(v: unknown): string | undefined {
  const s = v == null ? "" : String(v).trim();
  return s || undefined;
}
function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) && String(v).trim() !== "" ? n : undefined;
}
function parseProblems(r: Record<string, unknown>): string[] {
  const raw = r.problems ?? (r.audit as Record<string, unknown>)?.problems;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string" && raw.trim()) return raw.split(/[;|]/).map((s) => s.trim());
  return [];
}
