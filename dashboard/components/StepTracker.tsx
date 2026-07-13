"use client";
import { stepState } from "@/lib/steps";
import type { Lead } from "@/lib/data";

// Six dots = the mockup process. Compact for kanban cards, full for detail pages.
export default function StepTracker({ lead, compact = false }: { lead: Lead; compact?: boolean }) {
  const { steps, current, doneCount } = stepState(lead);

  if (compact) {
    return (
      <div className="flex items-center gap-1" title={`Next: ${current}`}>
        {steps.map((s) => (
          <span
            key={s.key}
            title={`${s.label}${s.done ? " — done" : ""}`}
            className={`h-1.5 w-1.5 rounded-full ${s.done ? "bg-emerald-500" : "bg-[#2a3446]"}`}
          />
        ))}
        <span className="ml-1 text-[10px] text-slate-500">{doneCount}/6</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center">
          {i > 0 && <span className={`mx-1 h-0.5 w-4 ${s.done ? "bg-emerald-600" : "bg-[#2a3446]"}`} />}
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
              s.done
                ? "border-emerald-700 bg-emerald-950 text-emerald-300"
                : s.label === current
                  ? "border-amber-600 bg-amber-950 text-amber-300"
                  : "border-[#2a3446] text-slate-500"
            }`}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
