"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Lead = {
  id: string;
  business: string;
  city: string;
  niche: string;
  status: string;
  assigned_to?: string;
  audit?: { score: number; reviews?: number };
  touches: { date: string; channel: string }[];
};

const COLUMNS = ["new", "contacted", "replied", "demo-sent", "negotiating", "closed-won", "closed-lost"];

export default function Pipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [city, setCity] = useState("");
  const [niche, setNiche] = useState("");
  const [who, setWho] = useState("");
  const [dragId, setDragId] = useState("");

  const load = () => fetch("/api/leads").then((r) => r.json()).then(setLeads);
  useEffect(() => {
    load();
  }, []);

  async function move(id: string, status: string) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
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
  const opts = (key: "city" | "niche" | "assigned_to") =>
    [...new Set(leads.map((l) => l[key]).filter(Boolean))].sort() as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-100">Pipeline</h1>
        <Filter value={city} set={setCity} options={opts("city")} label="city" />
        <Filter value={niche} set={setNiche} options={opts("niche")} label="niche" />
        <Filter value={who} set={setWho} options={opts("assigned_to")} label="assignee" />
        <span className="ml-auto text-xs text-slate-500">{shown.length} leads · drag cards or use the menu</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const cards = shown.filter((l) => l.status === col);
          return (
            <div
              key={col}
              className="w-60 shrink-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dragId && move(dragId, col)}
            >
              <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                <span>{col}</span>
                <span>{cards.length}</span>
              </div>
              <div className="space-y-2 min-h-40 rounded bg-[#0e121b] p-2">
                {cards.map((l) => {
                  const last = l.touches[l.touches.length - 1]?.date || "";
                  const staleCard = col !== "new" && !col.startsWith("closed") && last < weekAgo;
                  return (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={() => setDragId(l.id)}
                      className={`card cursor-grab p-2.5 text-sm ${staleCard ? "border-amber-600" : ""}`}
                    >
                      <Link href={`/leads/${l.id}`} className="font-medium text-slate-100 hover:text-sky-400">
                        {l.business}
                      </Link>
                      <div className="mt-1 flex justify-between text-xs text-slate-500">
                        <span>
                          {l.city} · {l.niche}
                        </span>
                        <span title="audit score">{l.audit?.score ?? "–"}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="text-slate-600">{l.assigned_to || "unassigned"}</span>
                        <select
                          value={col}
                          onChange={(e) => move(l.id, e.target.value)}
                          className="!p-0.5 text-[11px]"
                        >
                          {[...COLUMNS, "do-not-contact"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
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
