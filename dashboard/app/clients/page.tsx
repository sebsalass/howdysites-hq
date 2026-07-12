import Link from "next/link";
import { readLeads, readJson } from "@/lib/data";

export const dynamic = "force-dynamic";

type Pricing = { tiers: Record<string, { build_fee: number; care_monthly: number }> };

export default function Clients() {
  const pricing = readJson<Pricing>("config/pricing.json");
  const clients = readLeads().filter((l) => l.status === "closed-won");

  const rows = clients.map((l) => {
    const tier = l.client?.tier || l.value_tier || "standard";
    const t = pricing.tiers[tier];
    return {
      id: l.id,
      business: l.business,
      city: l.city,
      tier,
      build: l.client?.build_fee ?? t?.build_fee ?? 0,
      mrr: l.client?.care_mrr ?? t?.care_monthly ?? 0,
      launch: l.client?.launch_date || "not launched",
      repo: l.client?.site_repo || "",
    };
  });
  const totalMrr = rows.reduce((s, r) => s + r.mrr, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-4">
        <h1 className="text-xl font-bold text-slate-100">Clients</h1>
        <span className="text-sm text-emerald-400">
          {rows.length} clients · ${totalMrr.toLocaleString()}/mo care MRR
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">
          No clients yet. Close a deal on the <Link href="/pipeline" className="text-sky-400">pipeline</Link> and it shows up here.
        </p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2633] text-left text-xs uppercase tracking-wide text-slate-500">
                {["Business", "City", "Tier", "Build fee", "Care MRR", "Launch", "Site repo"].map((h) => (
                  <th key={h} className="px-4 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[#161c28]">
                  <td className="px-4 py-2">
                    <Link href={`/leads/${r.id}`} className="text-slate-100 hover:text-sky-400">
                      {r.business}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-400">{r.city}</td>
                  <td className="px-4 py-2 text-slate-400">{r.tier}</td>
                  <td className="px-4 py-2 tabular-nums">${r.build.toLocaleString()}</td>
                  <td className="px-4 py-2 tabular-nums text-emerald-400">${r.mrr}/mo</td>
                  <td className="px-4 py-2 text-slate-400">{r.launch}</td>
                  <td className="px-4 py-2 text-slate-500">{r.repo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-600">
        Set build fee, care MRR, launch date, and site repo on the lead detail page (they live in the lead file&apos;s client object).
      </p>
    </div>
  );
}
