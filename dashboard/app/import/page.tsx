"use client";
import { useState } from "react";

const EXAMPLE = `business,city,niche,phone,email,website,audit_score,reviews,rating,problems
Smith HVAC,houston,hvac,713-555-0101,info@example.com,,92,47,4.6,no-website
Lone Star Roofing,dallas,roofing,214-555-0102,,http://lonestarroof.example,74,120,4.4,not-mobile;no-ssl`;

export default function Import() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setResult("");
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setResult(res.ok ? `Imported ${data.added} leads, skipped ${data.skipped} (duplicates / do-not-contact / missing fields).` : data.error);
    setBusy(false);
    if (res.ok) setText("");
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Import leads</h1>
      <p className="text-sm text-slate-400">
        Paste a JSON array or CSV (header row required) from the scrape/audit scripts. Dedupes against existing
        leads and the do-not-contact list automatically. Required columns: <code>business</code>, <code>city</code>.
        Useful extras: <code>niche, phone, email, website, audit_score, reviews, rating, problems</code>.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={14}
        placeholder={EXAMPLE}
        className="w-full font-mono text-xs"
      />
      <div className="flex items-center gap-3">
        <button className="btn btn-primary" onClick={run} disabled={busy || !text.trim()}>
          {busy ? "Importing…" : "Import"}
        </button>
        <button className="btn" onClick={() => setText(EXAMPLE)}>
          Load example format
        </button>
        {result && <span className="text-sm text-slate-300">{result}</span>}
      </div>
      <p className="text-xs text-slate-600">
        After importing, hit Sync (top right) so the rest of the team gets the new leads.
      </p>
    </div>
  );
}
