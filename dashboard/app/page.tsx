import Link from "next/link";
import { readLeads, readJson } from "@/lib/data";

export const dynamic = "force-dynamic";

type Targets = { weekly_quotas: Record<string, number>; phase: number };

export default function Overview() {
  const leads = readLeads();
  const targets = readJson<Targets>("config/targets.json");
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);

  const clients = leads.filter((l) => l.status === "closed-won");
  const mrr = clients.reduce((s, l) => s + (l.client?.care_mrr || 0), 0);
  const buildRevenue = clients.reduce((s, l) => s + (l.client?.build_fee || 0), 0);

  const newThisWeek = leads.filter((l) => (l.created_at || "") >= weekAgo).length;
  const touchesThisWeek = leads.flatMap((l) => l.touches).filter((t) => t.date >= weekAgo && t.channel !== "status").length;
  const demosThisWeek = leads.filter((l) => l.touches.some((t) => t.date >= weekAgo && t.note.includes("demo-sent"))).length;
  const closesThisWeek = clients.filter((l) => l.touches.some((t) => t.date >= weekAgo && t.note.endsWith("closed-won"))).length;

  const stale = leads.filter(
    (l) =>
      !["closed-won", "closed-lost", "do-not-contact", "new"].includes(l.status) &&
      (l.touches[l.touches.length - 1]?.date || "") < weekAgo
  );

  const q = targets.weekly_quotas;
  const weekRows: [string, number, number][] = [
    ["Leads added", newThisWeek, q.new_leads],
    ["Outreach touches", touchesThisWeek, q.outreach_touches],
    ["Demos sent", demosThisWeek, q.demos_sent],
    ["Closes", closesThisWeek, q.closes],
  ];

  const byStatus = Object.entries(
    leads.reduce<Record<string, number>>((m, l) => ((m[l.status] = (m[l.status] || 0) + 1), m), {})
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-100">Overview — Phase {targets.phase}</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Care MRR" value={`$${mrr.toLocaleString()}`} accent="text-emerald-400" />
        <Stat label="Build revenue (all time)" value={`$${buildRevenue.toLocaleString()}`} />
        <Stat label="Clients" value={String(clients.length)} />
        <Stat label="Leads in pipeline" value={String(leads.length - clients.length)} />
      </div>

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">This week vs. quota</h2>
        <div className="space-y-2">
          {weekRows.map(([label, actual, quota]) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <span className="w-40 text-slate-400">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-[#1a2130]">
                <div
                  className={actual >= quota ? "h-full bg-emerald-500" : "h-full bg-sky-600"}
                  style={{ width: `${Math.min(100, (actual / Math.max(quota, 1)) * 100)}%` }}
                />
              </div>
              <span className="w-20 text-right tabular-nums text-slate-300">
                {actual} / {quota}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Pipeline by status</h2>
          {byStatus.length === 0 ? (
            <p className="text-sm text-slate-500">
              No leads yet. <Link className="text-sky-400" href="/import">Import your first batch</Link>.
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {byStatus.map(([s, n]) => (
                <li key={s} className="flex justify-between">
                  <span className="text-slate-400">{s}</span>
                  <span className="tabular-nums">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">
            Going stale <span className="text-slate-500">(active, no touch in 7 days)</span>
          </h2>
          {stale.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing stale.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {stale.slice(0, 8).map((l) => (
                <li key={l.id}>
                  <Link href={`/leads/${l.id}`} className="text-amber-400 hover:underline">
                    {l.business}
                  </Link>{" "}
                  <span className="text-slate-500">— {l.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = "text-slate-100" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}
