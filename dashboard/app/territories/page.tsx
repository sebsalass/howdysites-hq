"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Dot = { zip: string; city: string; lat: number; lng: number; status: string };
type Row = { zip: string; city: string; status: string; total: number; noSite: number; hot: number; avg: number | null; clients: number };
type Rec = { zip: string; city: string; miles: number };
type Data = {
  focus: { zip: string; city: string; status: string } | null;
  recommendations: Rec[];
  metro: string;
  metros: string[];
  map: Dot[];
  rows: Row[];
};

const STATUS_COLORS: Record<string, string> = {
  unexplored: "#2a3446",
  queued: "#8b5cf6",
  scraped: "#d97706",
  contacted: "#0ea5e9",
  clients: "#10b981",
  exhausted: "#7f1d1d",
};
const STATUS_LABELS: Record<string, string> = {
  unexplored: "explorable",
  queued: "queued",
  scraped: "scraped",
  contacted: "contacted",
  clients: "clients won",
  exhausted: "exhausted",
};
export default function Territories() {
  const [data, setData] = useState<Data | null>(null);
  const [zip, setZip] = useState("");
  const [metro, setMetro] = useState("houston");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: "ok" | "err"; text: string; manual?: string[]; emailable?: string[] } | null>(null);
  const [sendMsg, setSendMsg] = useState("");

  const load = useCallback((focus: string, m: string) => {
    fetch(`/api/territories?focus=${focus}&metro=${m}`)
      .then((r) => r.json())
      .then((d: Data) => {
        setData(d);
        setMetro(d.metro);
      });
  }, []);
  useEffect(() => {
    load("", "houston");
  }, [load]);

  async function workZip() {
    if (!/^\d{5}$/.test(zip)) {
      setResult({ kind: "err", text: "Enter a 5-digit Texas ZIP." });
      return;
    }
    setBusy(true);
    setResult(null);
    load(zip, metro); // show focus + recommendations immediately
    const res = await fetch("/api/territories/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zip }),
    });
    const d = await res.json();
    setBusy(false);
    if (res.ok) {
      setResult({
        kind: "ok",
        text: `ZIP ${d.zip} (${d.city}): ${d.found} businesses found across all our niches, ${d.added} imported, ${d.hot} hot (score < 40), ${d.emailable?.length ?? 0} hot with an email address.`,
        emailable: d.emailable,
      });
    } else {
      setResult({ kind: "err", text: d.error, manual: d.manual });
    }
    load(zip, metro);
  }

  async function sendIntros() {
    if (!result?.emailable?.length) return;
    setSendMsg("sending…");
    const res = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds: result.emailable, kind: "audit", by: "sebastian" }),
    });
    const d = await res.json();
    setSendMsg(res.ok ? `${d.sent} sent (${d.sentToday}/${d.dailyCap} used today)` : d.error);
  }

  async function mark(z: string, status: string) {
    await fetch("/api/territories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zip: z, status }),
    });
    load(zip || z, metro);
  }

  if (!data) return <p className="text-sm text-slate-500">Loading territory data…</p>;

  // project the metro's zips into the SVG viewport
  const dots = data.map;
  const lats = dots.map((d) => d.lat);
  const lngs = dots.map((d) => d.lng);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const W = 720, H = 460, PAD = 16;
  const px = (d: Dot) => PAD + ((d.lng - minLng) / (maxLng - minLng || 1)) * (W - 2 * PAD);
  const py = (d: Dot) => PAD + ((maxLat - d.lat) / (maxLat - minLat || 1)) * (H - 2 * PAD);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-100">Territories</h1>

      {/* Work a ZIP */}
      <section className="card space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value.trim())}
            onKeyDown={(e) => e.key === "Enter" && !busy && workZip()}
            placeholder="77494"
            className="w-24 text-center font-mono"
            maxLength={5}
          />
          <button className="btn btn-primary" onClick={workZip} disabled={busy}>
            {busy ? "Working the ZIP… (scrape + audit, up to 2 min)" : "Work this ZIP"}
          </button>
          {data.focus && (
            <span className="text-sm text-slate-400">
              {data.focus.zip} = {data.focus.city} · currently {STATUS_LABELS[data.focus.status]}
            </span>
          )}
        </div>
        {result && (
          <div className={`text-sm ${result.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}>
            {result.text}
            {result.manual && (
              <pre className="mt-2 overflow-x-auto rounded bg-[#0f131b] p-2 text-xs text-slate-300">{result.manual.join("\n")}</pre>
            )}
          </div>
        )}
        {result?.kind === "ok" && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-slate-500">
              Leads are on the <Link href="/pipeline" className="text-sky-400">Pipeline</Link>, worst websites first. Hit Sync to share.
            </p>
            {(result.emailable?.length ?? 0) > 0 && (
              <button className="btn btn-primary" onClick={sendIntros}>
                Send intro email to {result.emailable!.length} hot leads
              </button>
            )}
            {sendMsg && <span className="text-xs text-slate-300">{sendMsg}</span>}
          </div>
        )}
      </section>

      {/* Next 5 */}
      {data.recommendations.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">
            Next 5 — nearest unexplored ZIPs from {data.focus?.zip}
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.recommendations.map((r) => (
              <div key={r.zip} className="flex items-center gap-2 rounded border border-[#283042] bg-[#0f131b] px-2.5 py-1.5 text-sm">
                <button className="font-mono font-semibold text-sky-400 hover:underline" onClick={() => setZip(r.zip)} title="Load into the work box">
                  {r.zip}
                </button>
                <span className="text-slate-400">
                  {r.city} · {r.miles} mi
                </span>
                <button className="text-xs text-violet-400 hover:underline" onClick={() => mark(r.zip, "queued")}>
                  queue
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Map */}
      <section className="card p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="flex overflow-hidden rounded border border-[#334155] text-xs">
            {data.metros.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMetro(m);
                  load(zip, m);
                }}
                className={`px-3 py-1.5 font-medium capitalize ${metro === m ? "bg-[#1d4ed8] text-white" : "bg-[#12161f] text-slate-400"}`}
              >
                {m.replace("-", " ")}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-3 text-[11px]">
            {Object.entries(STATUS_LABELS).map(([k, label]) => (
              <span key={k} className="flex items-center gap-1 text-slate-400">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[k] }} />
                {label}
              </span>
            ))}
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded bg-[#0b0e14]" role="img" aria-label="ZIP territory map">
          {dots.map((d) => {
            const worked = d.status !== "unexplored";
            const isFocus = data.focus?.zip === d.zip;
            return (
              <circle
                key={d.zip}
                cx={px(d)}
                cy={py(d)}
                r={isFocus ? 7 : worked ? 5 : 2.5}
                fill={STATUS_COLORS[d.status]}
                stroke={isFocus ? "#fff" : "none"}
                strokeWidth={isFocus ? 1.5 : 0}
                className="cursor-pointer"
                onClick={() => {
                  setZip(d.zip);
                  load(d.zip, metro);
                }}
              >
                <title>{`${d.zip} ${d.city} — ${STATUS_LABELS[d.status]}`}</title>
              </circle>
            );
          })}
        </svg>
        <p className="mt-2 text-[11px] text-slate-600">
          Every dot is a ZIP ({dots.length} in this metro). Click a dot to load it into the work box. Small gray dots are open
          territory; big colored dots are where we&apos;ve been.
        </p>
      </section>

      {/* Worked table */}
      {data.rows.length > 0 && (
        <section className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2633] text-left text-xs uppercase tracking-wide text-slate-500">
                {["ZIP", "City", "Status", "Businesses", "No website", "Hot", "Avg score", "Clients", ""].map((h) => (
                  <th key={h} className="px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.zip} className="border-b border-[#161c28] tabular-nums">
                  <td className="px-4 py-2 font-mono font-medium text-slate-100">{r.zip}</td>
                  <td className="px-4 py-2 text-slate-400">{r.city}</td>
                  <td className="px-4 py-2">
                    <span className="rounded px-1.5 py-0.5 text-xs" style={{ background: STATUS_COLORS[r.status] + "33", color: STATUS_COLORS[r.status] }}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2">{r.total}</td>
                  <td className="px-4 py-2 text-red-400">{r.noSite}</td>
                  <td className="px-4 py-2 text-amber-400">{r.hot}</td>
                  <td className="px-4 py-2">{r.avg ?? "—"}</td>
                  <td className="px-4 py-2 text-emerald-400">{r.clients}</td>
                  <td className="px-4 py-2 text-xs">
                    {r.status === "queued" ? (
                      <button className="text-slate-500 hover:underline" onClick={() => mark(r.zip, "clear")}>unqueue</button>
                    ) : r.status === "scraped" || r.status === "contacted" ? (
                      <button className="text-red-500 hover:underline" onClick={() => mark(r.zip, "exhausted")}>mark exhausted</button>
                    ) : r.status === "exhausted" ? (
                      <button className="text-slate-500 hover:underline" onClick={() => mark(r.zip, "clear")}>reopen</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
