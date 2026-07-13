import Link from "next/link";
import { readLeads } from "@/lib/data";

export const dynamic = "force-dynamic";

// The ZIP-code database view: which territories are richest in missing/bad
// websites. Fed by scripts/scrape.mjs + scripts/audit.mjs -> Import page.
export default function Territories() {
  const leads = readLeads();

  const byZip = new Map<string, typeof leads>();
  for (const l of leads) {
    const key = l.zip || "no zip";
    if (!byZip.has(key)) byZip.set(key, []);
    byZip.get(key)!.push(l);
  }

  const rows = [...byZip.entries()]
    .map(([zip, ls]) => {
      const scored = ls.filter((l) => l.audit);
      const avg = scored.length
        ? Math.round(scored.reduce((s, l) => s + (l.audit!.web_score ?? 0), 0) / scored.length)
        : null;
      return {
        zip,
        city: [...new Set(ls.map((l) => l.city))].join(", "),
        total: ls.length,
        noSite: ls.filter((l) => (l.audit?.web_score ?? 100) === 0).length,
        hot: ls.filter((l) => (l.audit?.web_score ?? 100) < 40).length,
        avg,
        clients: ls.filter((l) => l.status === "closed-won").length,
      };
    })
    .sort((a, b) => b.hot - a.hot);

  const totalHot = rows.reduce((s, r) => s + r.hot, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-4">
        <h1 className="text-xl font-bold text-slate-100">Territories</h1>
        <span className="text-sm text-slate-400">
          {leads.length} businesses across {byZip.size} ZIPs · <span className="text-red-400">{totalHot} hot leads</span> (score &lt; 40)
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="card max-w-2xl p-5 text-sm text-slate-400">
          <p className="mb-3 font-semibold text-slate-200">No territory data yet. The pipeline to fill this page:</p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              <code className="text-sky-300">node scripts/scrape.mjs &quot;hvac&quot; 77502 77506 --city=houston &gt; candidates.json</code>{" "}
              (needs the Google Places API key in <code>.env</code>)
            </li>
            <li>
              <code className="text-sky-300">node scripts/audit.mjs candidates.json &gt; audited.json</code> — scores every website 0–100
              (no API key needed; also works on business lists from anywhere, not just the scraper)
            </li>
            <li>
              Paste <code>audited.json</code> into the <Link href="/import" className="text-sky-400">Import page</Link> — every business
              becomes a lead with its ZIP, score, and report card.
            </li>
          </ol>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2633] text-left text-xs uppercase tracking-wide text-slate-500">
                {["ZIP", "City", "Businesses", "No website", "Hot (score < 40)", "Avg score", "Clients won"].map((h) => (
                  <th key={h} className="px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.zip} className="border-b border-[#161c28] tabular-nums">
                  <td className="px-4 py-2 font-medium text-slate-100">{r.zip}</td>
                  <td className="px-4 py-2 text-slate-400">{r.city}</td>
                  <td className="px-4 py-2">{r.total}</td>
                  <td className="px-4 py-2 text-red-400">{r.noSite}</td>
                  <td className="px-4 py-2 text-amber-400">{r.hot}</td>
                  <td className="px-4 py-2">{r.avg ?? "—"}</td>
                  <td className="px-4 py-2 text-emerald-400">{r.clients}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-600">
        Website report score: 100 = great website, 0 = no website. We hunt where the average is low — those ZIPs are full of
        businesses losing customers to their own web presence.
      </p>
    </div>
  );
}
