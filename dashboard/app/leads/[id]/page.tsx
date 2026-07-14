"use client";
import { use, useEffect, useState } from "react";
import type { Lead } from "@/lib/data";
import { draftEmail, draftMockupBrief, draftMockupEmail } from "@/lib/templates";
import QrCode from "@/components/QrCode";
import StepTracker from "@/components/StepTracker";
import { displayName } from "@/lib/steps";
import { opportunities, type Pricing } from "@/lib/opportunities";

export default function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lead, setLead] = useState<Lead | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [by, setBy] = useState("sebastian");
  const [channel, setChannel] = useState("email");
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [gbpInput, setGbpInput] = useState("");
  const [demoInput, setDemoInput] = useState("");
  const [sendMsg, setSendMsg] = useState("");

  const load = () =>
    fetch(`/api/leads/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((l: Lead | null) => {
        setLead(l);
        setGbpInput(l?.gbp_url || "");
        setDemoInput(l?.demo_url || "");
      });
  useEffect(() => {
    load();
    fetch("/api/config?file=pricing").then((r) => r.json()).then(setPricing);
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

  async function saveLinks() {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { gbp_url: gbpInput.trim() || null, demo_url: demoInput.trim() || null } }),
    });
    load();
  }

  async function sendNow(kind: "audit" | "mockup") {
    setSendMsg("sending…");
    const res = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds: [id], kind, by }),
    });
    const d = await res.json();
    setSendMsg(res.ok ? (d.results[0].ok ? `sent to ${lead!.email}` : d.results[0].reason) : d.error);
    load();
  }

  // Copy the mockup brief, then open Emergent — paste the brief there, let it build
  // and host the demo, then save the demo link back here to send to the prospect.
  function sendToEmergent() {
    copy(draftMockupBrief(lead!));
    window.open("https://app.emergent.sh/home", "_blank");
  }

  const email = draftEmail(lead, cap(by));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">{lead.business}</h1>
          <p className="text-sm text-slate-500">
            {lead.city} · {lead.niche} · status <span className="text-slate-300">{lead.status}</span>
            {lead.assigned_to && <> · advisor: {displayName(lead.assigned_to)}</>}
          </p>
          <div className="mt-3">
            <StepTracker lead={lead} />
          </div>
        </div>

        <div className="card p-4 text-sm">
          <Row k="Owner" v={lead.owner_name} />
          <Row k="Phone" v={lead.phone} />
          <Row k="Email" v={lead.email} />
          <Row k="Address" v={lead.address} />
          <Row k="Website" v={lead.website || "none (jackpot)"} href={lead.website || undefined} />
          <Row k="Google Business" v={lead.gbp_url ? "open profile" : "not on file"} href={lead.gbp_url} />
          <Row k="Demo site" v={lead.demo_url ? "view demo" : "not built yet"} href={lead.demo_url} />
          <Row k="ZIP" v={lead.zip} />
          <Row
            k="Reviews"
            v={lead.audit ? `${lead.audit.reviews ?? "?"} reviews at ${lead.audit.rating ?? "?"} stars` : "—"}
          />
          <Row k="Contact source" v={lead.contact_source} />
        </div>

        {lead.audit && (
          <div className="card p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-slate-300">Website report</h2>
              <span
                className={`text-2xl font-bold tabular-nums ${
                  lead.audit.web_score < 40 ? "text-red-400" : lead.audit.web_score < 70 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {lead.audit.web_score}/100
              </span>
            </div>
            {lead.audit.checks ? (
              <ul className="grid grid-cols-2 gap-x-4 text-xs">
                {Object.entries(lead.audit.checks).map(([k, v]) => (
                  <li key={k} className={`py-0.5 ${v ? "text-emerald-500" : "text-red-400"}`}>
                    {v ? "PASS" : "FAIL"} <span className="text-slate-400">{k.replace(/_/g, " ")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">
                {(lead.audit.problems || []).join(", ") || "No check breakdown on file — run scripts/audit.mjs for the full report card."}
              </p>
            )}
            <p className="mt-2 text-[11px] text-slate-600">100 = great website. 0 = no website. Low score = hot lead — quote it in the outreach email.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => copy(`Subject: ${email.subject}\n\n${email.body}`)}>
            Draft outreach email
          </button>
          <button className="btn" onClick={() => copy(draftMockupBrief(lead))}>
            Draft mockup brief
          </button>
          <button className="btn" onClick={sendToEmergent} title="Copies the mockup brief, then opens Emergent — paste it there to build a hosted demo">
            Build demo in Emergent
          </button>
          {lead.demo_url && (
            <button
              className="btn"
              onClick={() => {
                const e = draftMockupEmail(lead, cap(by));
                copy(`Subject: ${e.subject}\n\n${e.body}`);
              }}
            >
              Draft mockup email
            </button>
          )}
          {lead.email && (
            <button className="btn" onClick={() => sendNow("audit")}>
              Send intro email now
            </button>
          )}
          {lead.email && lead.demo_url && (
            <button className="btn" onClick={() => sendNow("mockup")}>
              Send mockup email now
            </button>
          )}
          {lead.status !== "closed-won" && (
            <button className="btn btn-primary" onClick={markClient}>
              Mark closed-won
            </button>
          )}
          {copied && <span className="self-center text-xs text-emerald-400">copied to clipboard</span>}
          {sendMsg && <span className="self-center text-xs text-sky-400">{sendMsg}</span>}
        </div>

        {draft && (
          <textarea readOnly value={draft} rows={12} className="w-full font-mono text-xs" />
        )}

        <div className="card space-y-2 p-4">
          <h2 className="text-sm font-semibold text-slate-300">Links</h2>
          <label className="block text-xs text-slate-500">
            Google Business Profile URL
            <input value={gbpInput} onChange={(e) => setGbpInput(e.target.value)} placeholder="https://maps.google.com/…" className="mt-1 w-full" />
          </label>
          <label className="block text-xs text-slate-500">
            Demo site URL (from Emergent)
            <input value={demoInput} onChange={(e) => setDemoInput(e.target.value)} placeholder="https://….emergent.host/…" className="mt-1 w-full" />
          </label>
          <button className="btn" onClick={saveLinks}>
            Save links
          </button>
          {lead.demo_url && <QrCode url={lead.demo_url} filename={`${lead.id}-demo-qr.png`} />}
        </div>
      </div>

      <div className="space-y-4">
        <div className="card p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">
            Opportunities <span className="font-normal text-slate-500">— what to pitch, from the data</span>
          </h2>
          {!pricing ? (
            <p className="text-sm text-slate-500">Loading pricing…</p>
          ) : (
            <ul className="space-y-3">
              {opportunities(lead, pricing).map((o, i) => (
                <li key={i} className="text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={o.kind === "core" ? "font-medium text-slate-100" : "font-medium text-sky-300"}>
                      {o.title}
                    </span>
                    <span className="shrink-0 tabular-nums text-emerald-400">{o.price}</span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{o.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Log a touch</h2>
          <div className="flex flex-wrap gap-2">
            <select value={by} onChange={(e) => setBy(e.target.value)}>
              {["sebastian", "michael", "parker"].map((f) => (
                <option key={f} value={f}>{displayName(f)}</option>
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
                  <span className="text-slate-400">{displayName(t.by)}</span>
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

function Row({ k, v, href }: { k: string; v?: string | null; href?: string }) {
  return (
    <div className="flex gap-2 py-0.5">
      <span className="w-28 shrink-0 text-slate-500">{k}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
          {v}
        </a>
      ) : (
        <span className="text-slate-200">{v || "—"}</span>
      )}
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
