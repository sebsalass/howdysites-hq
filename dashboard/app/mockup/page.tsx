"use client";
import { useState } from "react";
import Link from "next/link";
import type { Lead } from "@/lib/data";
import { draftMockupBrief, draftMockupEmail } from "@/lib/templates";
import QrCode from "@/components/QrCode";
import { displayName } from "@/lib/steps";

const CITIES = ["houston", "dallas", "san-antonio"];
const NICHES = ["hvac", "roofing", "plumbing", "landscaping", "auto-detailing", "cleaning", "restaurants", "barbershops", "other"];

// The mockup pipeline: Google Business link in → lead + Emergent brief out →
// demo URL back in → QR + client email out. Emergent has no API, so the two
// paste steps are the human part; everything else is automatic.
export default function MockupPipeline() {
  const [gbpUrl, setGbpUrl] = useState("");
  const [business, setBusiness] = useState("");
  const [city, setCity] = useState("houston");
  const [niche, setNiche] = useState("hvac");
  const [by, setBy] = useState("sebastian");
  const [lead, setLead] = useState<Lead | null>(null);
  const [demoUrl, setDemoUrl] = useState("");
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  // Google Maps URLs carry the business name: maps.google.com/maps/place/Name+Of+Biz/...
  function parseGbp(url: string) {
    setGbpUrl(url);
    const m = url.match(/\/place\/([^/@?]+)/);
    if (m && !business) {
      setBusiness(decodeURIComponent(m[1]).replace(/\+/g, " "));
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  }

  async function createAndBrief() {
    setError("");
    if (!business.trim()) {
      setError("Business name is required — paste a Google Maps place link or type it.");
      return;
    }
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business: business.trim(),
        city,
        niche,
        gbp_url: gbpUrl.trim() || undefined,
        assigned_to: by,
        contact_source: "google-business-profile",
        website: null,
      }),
    });
    if (!res.ok) {
      setError((await res.json()).error || "failed to create lead");
      return;
    }
    const created: Lead = await res.json();
    copy(draftMockupBrief(created), "brief");
    window.open("https://app.emergent.sh/home", "_blank");
    const r2 = await fetch(`/api/leads/${created.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ touch: { by, channel: "note", note: "mockup brief drafted" } }),
    });
    setLead(r2.ok ? await r2.json() : created);
  }

  async function saveDemo() {
    if (!lead || !demoUrl.trim()) return;
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: { demo_url: demoUrl.trim() },
        touch: { by, channel: "note", note: "demo built in Emergent" },
      }),
    });
    if (res.ok) setLead(await res.json());
  }

  const email = lead?.demo_url ? draftMockupEmail(lead, by.charAt(0).toUpperCase() + by.slice(1)) : null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Mockup pipeline</h1>
        <p className="mt-1 text-sm text-slate-400">
          Google Business link in — demo, QR code, and client email out. Two pastes, everything else is automatic.
        </p>
      </div>

      {/* Step 1 */}
      <section className="card space-y-3 p-4">
        <h2 className="text-sm font-semibold text-slate-300">
          <Step n={1} done={!!lead} /> Paste the Google Business / Maps link
        </h2>
        {!lead ? (
          <>
            <input
              value={gbpUrl}
              onChange={(e) => parseGbp(e.target.value)}
              placeholder="https://www.google.com/maps/place/…"
              className="w-full"
            />
            <div className="flex flex-wrap gap-2">
              <input value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Business name" className="flex-1 min-w-40" />
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select value={niche} onChange={(e) => setNiche(e.target.value)}>
                {NICHES.map((n) => <option key={n}>{n}</option>)}
              </select>
              <select value={by} onChange={(e) => setBy(e.target.value)}>
                {["sebastian", "michael", "parker"].map((f) => <option key={f} value={f}>{displayName(f)}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={createAndBrief}>
              Create lead, copy brief, open Emergent
            </button>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <p className="text-xs text-slate-600">
              Creates the lead file, copies an Emergent-ready mockup brief to your clipboard, and opens Emergent in a new tab — just paste and let it build.
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-400">
            Lead created: <Link href={`/leads/${lead.id}`} className="text-sky-400">{lead.business}</Link>. Brief copied
            {copied === "brief" && <span className="text-emerald-400"> (on your clipboard now)</span>} — paste it into Emergent and let it generate.{" "}
            <button className="text-sky-400 underline" onClick={() => copy(draftMockupBrief(lead), "brief")}>Copy brief again</button>
          </p>
        )}
      </section>

      {/* Step 2 */}
      <section className={`card space-y-3 p-4 ${!lead ? "opacity-40" : ""}`}>
        <h2 className="text-sm font-semibold text-slate-300">
          <Step n={2} done={!!lead?.demo_url} /> Paste the demo URL Emergent gives you
        </h2>
        <div className="flex gap-2">
          <input
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            placeholder="https://….emergent.host/…"
            className="flex-1"
            disabled={!lead}
          />
          <button className="btn btn-primary" onClick={saveDemo} disabled={!lead || !demoUrl.trim()}>
            Save demo
          </button>
        </div>
      </section>

      {/* Step 3: QR + email */}
      {lead?.demo_url && (
        <>
          <section className="card space-y-3 p-4">
            <h2 className="text-sm font-semibold text-slate-300">
              <Step n={3} done /> QR code — scans straight to their new site
            </h2>
            <QrCode url={lead.demo_url} filename={`${lead.id}-demo-qr.png`} />
          </section>

          <section className="card space-y-3 p-4">
            <h2 className="text-sm font-semibold text-slate-300">
              <Step n={4} done /> Email draft for the owner
            </h2>
            <textarea readOnly value={`Subject: ${email!.subject}\n\n${email!.body}`} rows={13} className="w-full font-mono text-xs" />
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="btn btn-primary"
                onClick={async () => {
                  copy(`Subject: ${email!.subject}\n\n${email!.body}`, "email");
                  const r = await fetch(`/api/leads/${lead!.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ touch: { by, channel: "note", note: "mockup email drafted" } }),
                  });
                  if (r.ok) setLead(await r.json());
                }}
              >
                Copy email
              </button>
              {lead.email && (
                <a className="btn" href={`mailto:${lead.email}?subject=${encodeURIComponent(email!.subject)}&body=${encodeURIComponent(email!.body)}`}>
                  Open in mail app
                </a>
              )}
              {copied === "email" && <span className="text-xs text-emerald-400">copied — send it from the outreach mailbox</span>}
            </div>
            <p className="text-xs text-slate-600">
              Sending logs a touch: do it from the <Link href={`/leads/${lead.id}`} className="text-sky-400">lead page</Link> after the email goes out, then hit Sync.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function Step({ n, done }: { n: number; done: boolean }) {
  return (
    <span
      className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
        done ? "bg-emerald-600 text-white" : "bg-[#1e293b] text-slate-400"
      }`}
    >
      {n}
    </span>
  );
}
