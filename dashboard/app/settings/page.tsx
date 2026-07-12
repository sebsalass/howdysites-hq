"use client";
import { useEffect, useState } from "react";

export default function Settings() {
  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-xl font-bold text-slate-100">Settings</h1>
      <p className="text-sm text-slate-400">
        Direct editors for the two canonical config files. Valid JSON only — the docs in Playbooks explain every field.
        After saving, hit Sync so the team gets the change.
      </p>
      <JsonEditor file="pricing" title="config/pricing.json — tiers, terms, funnel assumptions, costs" />
      <JsonEditor file="targets" title="config/targets.json — cities, niches, lead quality bar, weekly quotas" />
    </div>
  );
}

function JsonEditor({ file, title }: { file: string; title: string }) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/config?file=${file}`)
      .then((r) => r.json())
      .then((d) => setText(JSON.stringify(d, null, 2)));
  }, [file]);

  async function save() {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      setMsg(`invalid JSON: ${e}`);
      return;
    }
    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file, data }),
    });
    setMsg(res.ok ? "saved" : "save failed");
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-slate-300">{title}</h2>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setMsg("");
        }}
        rows={16}
        className="w-full font-mono text-xs"
        spellCheck={false}
      />
      <div className="flex items-center gap-3">
        <button className="btn btn-primary" onClick={save}>
          Save {file}.json
        </button>
        {msg && <span className={`text-xs ${msg === "saved" ? "text-emerald-400" : "text-red-400"}`}>{msg}</span>}
      </div>
    </section>
  );
}
