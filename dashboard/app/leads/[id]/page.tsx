"use client";
import { use, useEffect, useState } from "react";
import type { Lead } from "@/lib/data";
import { draftEmail, draftMockupBrief } from "@/lib/templates";

export default function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lead, setLead] = useState<Lead | null>(null);
  const [by, setBy] = useState("sebas");
  const [channel, setChannel] = useState("email");
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  const load = () => fetch(`/api/leads/${id}`).then((r) => (r.ok ? r.json() : null)).then(setLead);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!lead) return <p className="text-sm text-slate-500">Lead not found.</p>;

  async function logTouch() {
    if (!note.trim()) return;
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ touch: { by, channel, note } }),
    });
    setNote("");
    load();
  }

  async function markClient() {
    const tier = prompt("Tier? (starter/standard/pro)", lead!.value_tier || "standard");
    if (!tier) return;
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed-won", by, client: { tier } }),
    });
    load();
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setDraft(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const email = draftEmail(lead, cap(by));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">{lead.business}</h1>
          <p className="text-sm text-slate-500">
            {lead.city} · {lead.niche} · status <span className="text-slate-300">{lead.status}</span>
            {lead.assigned_to && <> · assigned to {lead.assigned_to}</>}
          </p>
        </div>

        <div className="card p-4 text-sm">
          <Row k="Owner" v={lead.owner_name} />
          <Row k="Phone" v={lead.phone} />
          <Row k="Email" v={lead.email} />
          <Row k="Address" v={lead.address} />
          <Row k="Website" v={lead.website || "none (jackpot)"} />
          <Row
            k="Audit"
            v={
              lead.audit
                ? `score ${lead.audit.score} · ${lead.audit.reviews ?? "?"} reviews at ${lead.audit.rating ?? "?"} stars · ${(lead.audit.problems || []).join(", ")}`
                : "not audited"
            }
          />
          <Row k="Contact source" v={lead.contact_source} />
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => copy(`Subject: ${email.subject}\n\n${email.body}`)}>
            Draft outreach email
          </button>
          <button className="btn" onClick={() => copy(draftMockupBrief(lead))}>
            Draft mockup brief
          </button>
          {lead.status !== "closed-won" && (
            <button className="btn btn-primary" onClick={markClient}>
              Mark closed-won
            </button>
          )}
          {copied && <span className="self-center text-xs text-emerald-400">copied to clipboard</span>}
        </div>

        {draft && (
          <textarea readOnly value={draft} rows={12} className="w-full font-mono text-xs" />
        )}
      </div>

      <div className="space-y-4">
        <div className="card p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Log a touch</h2>
          <div className="flex flex-wrap gap-2">
            <select value={by} onChange={(e) => setBy(e.target.value)}>
              {["sebas", "michael", "parker"].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
            <select value={channel} onChange={(e) => setChannel(e.target.value)}>
              {["email", "call", "text", "in-person", "note"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && logTouch()}
              placeholder="what happened"
              className="flex-1 min-w-40"
            />
            <button className="btn btn-primary" onClick={logTouch}>
              Log
            </button>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Touch history</h2>
          {lead.touches.length === 0 ? (
            <p className="text-sm text-slate-500">No touches yet — this lead is cold.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {[...lead.touches].reverse().map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-slate-500 tabular-nums">{t.date}</span>
                  <span className="text-slate-400">{t.by}</span>
                  <span className="text-slate-600">{t.channel}</span>
                  <span className="text-slate-300">{t.note}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="flex gap-2 py-0.5">
      <span className="w-28 shrink-0 text-slate-500">{k}</span>
      <span className="text-slate-200">{v || "—"}</span>
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
