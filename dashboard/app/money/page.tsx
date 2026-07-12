"use client";
import { useEffect, useMemo, useState } from "react";

type Pricing = {
  tiers: Record<string, { label: string; build_fee: number; care_monthly: number }>;
  funnel_assumptions: {
    contactable_rate: number;
    reply_rate: number;
    reply_to_demo_rate: number;
    demo_to_close_rate: number;
  };
  costs: { hosting_per_client_monthly: number };
};

export default function Money() {
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [leadsPerWeek, setLeadsPerWeek] = useState(100);
  const [tierMix, setTierMix] = useState("standard");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/config?file=pricing")
      .then((r) => r.json())
      .then((p: Pricing) => setPricing(p));
  }, []);

  const f = pricing?.funnel_assumptions;

  const calc = useMemo(() => {
    if (!pricing || !f) return null;
    const tier = pricing.tiers[tierMix];
    const contacted = leadsPerWeek * f.contactable_rate;
    const replies = contacted * f.reply_rate;
    const demos = replies * f.reply_to_demo_rate;
    const closesPerWeek = demos * f.demo_to_close_rate;
    const closesPerMonth = closesPerWeek * 4.33;
    const months = Array.from({ length: 12 }, (_, i) => {
      const clients = Math.round(closesPerMonth * (i + 1));
      return {
        month: i + 1,
        clients,
        mrr: Math.round(clients * (tier.care_monthly - pricing.costs.hosting_per_client_monthly)),
        buildRev: Math.round(closesPerMonth * tier.build_fee),
      };
    });
    return { contacted, replies, demos, closesPerWeek, closesPerMonth, months, tier };
  }, [pricing, f, leadsPerWeek, tierMix]);

  if (!pricing || !f || !calc) return <p className="text-sm text-slate-500">Loading pricing.json…</p>;

  function setF(key: keyof Pricing["funnel_assumptions"], v: number) {
    setPricing({ ...pricing!, funnel_assumptions: { ...f!, [key]: v } });
    setSaved("");
  }

  async function save() {
    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: "pricing", data: pricing }),
    });
    setSaved(res.ok ? "saved to config/pricing.json — hit Sync to share" : "save failed");
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-xl font-bold text-slate-100">Money — model calculator</h1>
      <p className="text-sm text-slate-400">
        Sliders read and write <code>config/pricing.json</code> funnel assumptions. As real data comes in, replace guesses with actuals.
      </p>

      <div className="card space-y-4 p-4">
        <Slider label={`Leads scraped per week: ${leadsPerWeek}`} min={20} max={500} step={10} value={leadsPerWeek} onChange={setLeadsPerWeek} />
        <Slider label={`Contactable rate: ${pct(f.contactable_rate)}`} min={0.3} max={1} step={0.05} value={f.contactable_rate} onChange={(v) => setF("contactable_rate", v)} />
        <Slider label={`Reply rate: ${pct(f.reply_rate)}`} min={0.01} max={0.4} step={0.01} value={f.reply_rate} onChange={(v) => setF("reply_rate", v)} />
        <Slider label={`Reply to demo: ${pct(f.reply_to_demo_rate)}`} min={0.1} max={1} step={0.05} value={f.reply_to_demo_rate} onChange={(v) => setF("reply_to_demo_rate", v)} />
        <Slider label={`Demo to close: ${pct(f.demo_to_close_rate)}`} min={0.05} max={0.9} step={0.05} value={f.demo_to_close_rate} onChange={(v) => setF("demo_to_close_rate", v)} />
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Average tier sold:</label>
          <select value={tierMix} onChange={(e) => setTierMix(e.target.value)}>
            {Object.entries(pricing.tiers).map(([k, t]) => (
              <option key={k} value={k}>
                {t.label} (${t.build_fee} + ${t.care_monthly}/mo)
              </option>
            ))}
          </select>
          <button className="btn btn-primary ml-auto" onClick={save}>
            Save assumptions
          </button>
          {saved && <span className="text-xs text-emerald-400">{saved}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Contacted / week" value={calc.contacted.toFixed(0)} />
        <Stat label="Demos / week" value={calc.demos.toFixed(1)} />
        <Stat label="Closes / week" value={calc.closesPerWeek.toFixed(1)} />
        <Stat label="Build revenue / month" value={`$${calc.months[0].buildRev.toLocaleString()}`} />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1f2633] text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-2">Month</th>
              <th className="px-4 py-2">Care clients</th>
              <th className="px-4 py-2">Care MRR (net of hosting)</th>
              <th className="px-4 py-2">MRR / founder (3-way)</th>
            </tr>
          </thead>
          <tbody>
            {calc.months.map((m) => (
              <tr key={m.month} className="border-b border-[#161c28] tabular-nums">
                <td className="px-4 py-1.5 text-slate-400">{m.month}</td>
                <td className="px-4 py-1.5">{m.clients}</td>
                <td className="px-4 py-1.5 text-emerald-400">${m.mrr.toLocaleString()}</td>
                <td className="px-4 py-1.5 text-slate-300">${Math.round(m.mrr / 3).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600">Assumes zero churn — Phase 2 adds churn once there is real data. Build revenue is per-month, not cumulative.</p>
    </div>
  );
}

function Slider({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-300">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full" />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-bold tabular-nums text-slate-100">{value}</div>
    </div>
  );
}

function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}
