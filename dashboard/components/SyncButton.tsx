"use client";
import { useEffect, useState } from "react";

type Status = { branch?: string; dirty?: number; ahead?: number; behind?: number; error?: string };

export default function SyncButton() {
  const [status, setStatus] = useState<Status>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const refresh = () => fetch("/api/sync").then((r) => r.json()).then(setStatus).catch(() => {});
  useEffect(() => {
    refresh();
  }, []);

  async function sync() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/sync", { method: "POST" });
    const data = await res.json();
    setMsg(res.ok ? "synced" : data.error || "sync failed");
    setBusy(false);
    refresh();
  }

  const stale = (status.behind || 0) > 0;
  const unpushed = (status.ahead || 0) > 0 || (status.dirty || 0) > 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">
        {stale && <span className="text-amber-400">{status.behind} behind · </span>}
        {unpushed && <span className="text-sky-400">{status.dirty || 0} unsaved / {status.ahead || 0} unpushed</span>}
        {!stale && !unpushed && status.branch && <span className="text-emerald-500">in sync</span>}
      </span>
      <button className="btn" onClick={sync} disabled={busy}>
        {busy ? "Syncing…" : "Sync"}
      </button>
      {msg && <span className="text-xs text-slate-400">{msg}</span>}
    </div>
  );
}
