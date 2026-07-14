import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson, readLeads } from "@/lib/data";
import { allZips, metroOf, metroZips, recommendNext, zipInfo, zipStatuses, METRO_IDS } from "@/lib/zips";

export const dynamic = "force-dynamic";

// GET ?focus=77494&metro=houston
// -> focus info, next-5 recommendations, per-metro map dots, worked-zip table rows
export async function GET(req: NextRequest) {
  const focus = req.nextUrl.searchParams.get("focus") || "";
  let metro = req.nextUrl.searchParams.get("metro") || "";
  const statuses = zipStatuses();

  const fi = focus ? zipInfo(focus) : undefined;
  if (!metro && fi) metro = metroOf(fi) || "houston";
  if (!METRO_IDS.includes(metro)) metro = "houston";

  const leads = readLeads();
  const byZip = new Map<string, typeof leads>();
  for (const l of leads) {
    if (!l.zip) continue;
    if (!byZip.has(l.zip)) byZip.set(l.zip, []);
    byZip.get(l.zip)!.push(l);
  }
  const marks = readJson<{ zips: Record<string, { status?: string }> }>("data/territories.json").zips;
  const workedZipSet = new Set([...byZip.keys(), ...Object.keys(marks)]);

  const rows = [...workedZipSet]
    .map((zip) => {
      const ls = byZip.get(zip) || [];
      const scored = ls.filter((l) => l.audit);
      return {
        zip,
        city: zipInfo(zip)?.city || [...new Set(ls.map((l) => l.city))].join(", "),
        status: statuses.get(zip) || "unexplored",
        total: ls.length,
        noSite: ls.filter((l) => (l.audit?.web_score ?? 100) === 0).length,
        hot: ls.filter((l) => (l.audit?.web_score ?? 100) < 40).length,
        avg: scored.length ? Math.round(scored.reduce((s, l) => s + (l.audit!.web_score ?? 0), 0) / scored.length) : null,
        clients: ls.filter((l) => l.status === "closed-won").length,
      };
    })
    .sort((a, b) => b.hot - a.hot);

  const map = metroZips(metro).map((z) => ({
    zip: z.zip,
    city: z.city,
    lat: z.lat,
    lng: z.lng,
    status: statuses.get(z.zip) || "unexplored",
  }));

  return NextResponse.json({
    focus: fi ? { ...fi, status: statuses.get(fi.zip) || "unexplored" } : null,
    recommendations: focus ? recommendNext(focus, 5) : [],
    metro,
    metros: METRO_IDS,
    map,
    rows,
    totalZipsTx: allZips().length,
  });
}

// POST { zip, status: "queued" | "exhausted" | "clear" } — explicit marks
export async function POST(req: NextRequest) {
  const { zip, status } = await req.json();
  if (!zipInfo(zip)) return NextResponse.json({ error: "unknown TX zip" }, { status: 400 });
  const t = readJson<{ $comment: string; zips: Record<string, unknown> }>("data/territories.json");
  if (status === "clear") delete t.zips[zip];
  else if (status === "queued" || status === "exhausted") {
    t.zips[zip] = { ...(t.zips[zip] as object), status, marked_at: new Date().toISOString().slice(0, 10) };
  } else return NextResponse.json({ error: "bad status" }, { status: 400 });
  writeJson("data/territories.json", t);
  return NextResponse.json({ ok: true });
}
