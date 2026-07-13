"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import StepTracker from "@/components/StepTracker";
import { stepState } from "@/lib/steps";
import type { Lead } from "@/lib/data";

const COLUMNS = ["new", "contacted", "replied", "demo-sent", "negotiating", "closed-won", "closed-lost"];
const FOUNDERS = ["sebas", "michael", "parker"];

export default function Pipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<"status" | "advisor">("status");
  const [city, setCity] = useState("");
  const [niche, setNiche] = useState("");
  const [who, setWho] = useState("");
  const [dragId, setDragId] = useState("");

  const load = () => fetch("/api/leads").then((r) => r.json()).then(setLeads);
  useEffect(() => {
    load();
  }, []);

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  }

  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const shown = leads.filter(
    (l) =>
      l.status !== "do-not-contact" &&
      (!city || l.city === city) &&
      (!niche || l.niche === niche) &&
      (!who || l.assigned_to === who)
  );
  const opts = (key: "city" | "niche") => [...new Set(leads.map((l) => l[key]).filter(Boolean))].sort() as string[];

  function Card({ l, showStatus = false }: { l: Lead; showStatus?: boolean }) {
    const last = l.touches[l.touches.length - 1]?.date || "";
    const staleCard = l.status !== "new" && !l.status.startsWith("closed") && last < weekAgo;
    return (
      <div
        draggable={view === "status"}
        onDragStart={() => setDragId(l.id)}
        className={`card p-2.5 text-sm ${view === "status" ? "cursor-grab" : ""} ${staleCard ? "border-amber-600" : ""}`}
      >
        <div className="flex items-baseline justify-between gap-2">
          <Link href={`/leads/${l.id}`} className="font-medium text-slate-100 hover:text-sky-400">
            {l.business}
          </Link>
          {showStatus && <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-500">{l.status}</span>}
        </div>
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>
            {l.city} · {l.niche}
          </span>
          <span title="audit score">{l.audit?.score ?? "–"}</span>
        </div>
        <div className="mt-1.5">
          <StepTracker lead={l} compact />
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-1 text-xs">
          <select
            value={l.assigned_to || ""}
            onChange={(e) => patch(l.id, { fields: { assigned_to: e.target.value || null } })}
            className="!p-0.5 text-[11px]"
            title="advisor"
          >
            <option value="">no advisor</option>
            {FOUNDERS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
          <select
            value={l.status}
            onChange={(e) => patch(l.id, { status: e.target.value })}
            className="!p-0.5 text-[11px]"
            title="status"
          >
            {[...COLUMNS, "do-not-contact"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-slate-100">Pipeline</h1>
        <div className="flex overflow-hidden rounded border border-[#334155] text-xs">
          {(["status", "advisor"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 font-medium ${view === v ? "bg-[#1d4ed8] text-white" : "bg-[#12161f] text-slate-400"}`}
            >
              {v === "status" ? "By status" : "By advisor"}
            </button>
          ))}
        </div>
        <Filter value={city} set={setCity} options={opts("city")} label="city" />
        <Filter value={niche} set={setNiche} options={opts("niche")} label="niche" />
        {view === "status" && (
          <select value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="">all advisors</option>
            {FOUNDERS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        )}
        <span className="ml-auto text-xs text-slate-500">{shown.length} leads</span>
      </div>

      {view === "status" ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const cards = shown.filter((l) => l.status === col);
            return (
              <div
                key={col}
                className="w-64 shrink-0"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dragId && patch(dragId, { status: col })}
              >
                <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <span>{col}</span>
                  <span>{cards.length}</span>
                </div>
                <div className="min-h-40 space-y-2 rounded bg-[#0e121b] p-2">
                  {cards.map((l) => (
                    <Card key={l.id} l={l} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...FOUNDERS, ""].map((f) => {
            const cards = shown
              .filter((l) => (f ? l.assigned_to === f : !l.assigned_to))
              .sort((a, b) => stepState(b).doneCount - stepState(a).doneCount);
            const active = cards.filter((l) => !l.status.startsWith("closed"));
            return (
              <div key={f || "unassigned"}>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-sm font-bold capitalize text-slate-100">{f || "Unassigned"}</span>
                  <span className="text-xs text-slate-500">
                    {active.length} active · {cards.length} total
                  </span>
                </div>
                <div className="min-h-40 space-y-2 rounded bg-[#0e121b] p-2">
                  {cards.length === 0 ? (
                    <p className="p-2 text-xs text-slate-600">{f ? "No clients assigned." : "Everything has an advisor."}</p>
                  ) : (
                    cards.map((l) => <Card key={l.id} l={l} showStatus />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-600">
        Dots on each card = the mockup process: Advisor → Google Business → Description → Emergent → QR → Email. They fill in
        automatically as the work happens (assign an advisor, save the GBP link, draft the brief, save the demo, draft the email).
      </p>
    </div>
  );
}

function Filter({
  value,
  set,
  options,
  label,
}: {
  value: string;
  set: (v: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <select value={value} onChange={(e) => set(e.target.value)}>
      <option value="">all {label}s</option>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}
