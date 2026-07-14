import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFileSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { REPO, readLeads, readJson, writeJson, writeLead, safeId, today, appendLog, type Lead } from "@/lib/data";
import { zipInfo, metroOf } from "@/lib/zips";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
const exec = promisify(execFile);

// POST { zip, niche } — "give it 77494 and it does that one":
// scrape the ZIP (Places API) -> audit every website 0-100 -> import as leads
// -> mark the territory. Returns counts. Fails with instructions if no API key.
export async function POST(req: NextRequest) {
  const { zip, niche } = await req.json();
  const zi = zipInfo(String(zip));
  if (!zi) return NextResponse.json({ error: `unknown TX zip: ${zip}` }, { status: 400 });
  if (!niche) return NextResponse.json({ error: "niche required" }, { status: 400 });
  const city = metroOf(zi) || "";

  let tmp = "";
  try {
    // 1. scrape
    const scrape = await exec(
      "node",
      ["scripts/scrape.mjs", niche, zi.zip, ...(city ? [`--city=${city}`] : [])],
      { cwd: REPO, maxBuffer: 32 * 1024 * 1024, timeout: 120_000 }
    ).catch((e) => {
      throw new Error(
        /GOOGLE_PLACES_API_KEY missing/.test(String(e.stderr || e.message))
          ? "NO_KEY"
          : `scrape failed: ${(e.stderr || e.message || "").slice(0, 300)}`
      );
    });
    const candidates = JSON.parse(scrape.stdout || "[]");

    // 2. audit (works with no key — hits each website directly)
    let audited: Record<string, unknown>[] = [];
    if (candidates.length) {
      tmp = mkdtempSync(join(tmpdir(), "hs-scrape-"));
      const f = join(tmp, "candidates.json");
      writeFileSync(f, JSON.stringify(candidates));
      const audit = await exec("node", ["scripts/audit.mjs", f], {
        cwd: REPO,
        maxBuffer: 32 * 1024 * 1024,
        timeout: 240_000,
      });
      audited = JSON.parse(audit.stdout || "[]");
    }

    // 3. import as lead files (dedupe vs existing + do-not-contact)
    const existing = new Set(readLeads().map((l) => l.id));
    const dnc = new Set(readJson<{ list: string[] }>("data/do-not-contact.json").list);
    let added = 0,
      skipped = 0;
    for (const r of audited) {
      const business = String(r.business || "").trim();
      if (!business) {
        skipped++;
        continue;
      }
      const id = safeId(`${city || "tx"}-${business.replace(/\s+/g, "-")}`);
      if (existing.has(id) || dnc.has(id)) {
        skipped++;
        continue;
      }
      const lead: Lead = {
        id,
        business,
        city: city || "tx",
        niche: String(r.niche || niche),
        zip: zi.zip,
        address: str(r.address),
        phone: str(r.phone),
        website: str(r.website) || null,
        gbp_url: str(r.gbp_url),
        contact_source: "google-places-api",
        audit: {
          web_score: Number(r.web_score ?? 0),
          problems: Array.isArray(r.problems) ? r.problems.map(String) : [],
          checks: (r.checks as Record<string, boolean>) || undefined,
          reviews: num(r.reviews),
          rating: num(r.rating),
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

    // 4. mark the territory
    const t = readJson<{ $comment: string; zips: Record<string, unknown> }>("data/territories.json");
    t.zips[zi.zip] = {
      ...(t.zips[zi.zip] as object),
      status: undefined,
      scraped_at: today(),
      last_niche: niche,
      found: candidates.length,
    };
    writeJson("data/territories.json", t);
    appendLog(`worked ZIP ${zi.zip} (${zi.city}) for ${niche}: ${candidates.length} found, ${added} imported, ${skipped} skipped`);

    const hot = audited.filter((r) => Number(r.web_score ?? 100) < 40).length;
    return NextResponse.json({ ok: true, zip: zi.zip, city: zi.city, found: candidates.length, added, skipped, hot });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "NO_KEY") {
      return NextResponse.json(
        {
          error:
            "Google Places API key missing. Get one at console.cloud.google.com (enable Places API), put GOOGLE_PLACES_API_KEY=... in the repo's .env file, and try again. Manual fallback: run the two commands shown below and import the result.",
          manual: [
            `node scripts/scrape.mjs "${niche}" ${zi.zip} --city=${city || "houston"} > candidates.json`,
            "node scripts/audit.mjs candidates.json > audited.json",
          ],
        },
        { status: 424 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  }
}

function str(v: unknown): string | undefined {
  const s = v == null ? "" : String(v).trim();
  return s || undefined;
}
function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) && String(v).trim() !== "" ? n : undefined;
}
