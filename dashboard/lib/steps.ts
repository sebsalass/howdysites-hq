import type { Lead } from "./data";

// The six-step mockup process (Sebas's sketch, 7.12):
// advisor -> google business -> description -> emergent -> qr -> email.
// Each step is DERIVED from lead data, so the tracker is always honest —
// nobody has to remember to tick boxes.
export const MOCKUP_STEPS = [
  { key: "advisor", label: "Advisor" },
  { key: "gbp", label: "Google Business" },
  { key: "description", label: "Description" },
  { key: "emergent", label: "Emergent" },
  { key: "qr", label: "QR" },
  { key: "email", label: "Email" },
] as const;

export type StepKey = (typeof MOCKUP_STEPS)[number]["key"];

type StepLead = Pick<Lead, "assigned_to" | "gbp_url" | "demo_url" | "status"> & {
  touches: { note?: string; channel?: string }[];
};

export function stepDone(lead: StepLead, key: StepKey): boolean {
  const notes = (lead.touches || []).map((t) => t.note?.toLowerCase() || "");
  switch (key) {
    case "advisor":
      return !!lead.assigned_to;
    case "gbp":
      return !!lead.gbp_url;
    case "description":
      return notes.some((n) => n.includes("brief"));
    case "emergent":
      return !!lead.demo_url;
    case "qr":
      return !!lead.demo_url; // QR renders the moment a demo URL exists
    case "email":
      return (
        notes.some((n) => n.includes("mockup email")) ||
        ["demo-sent", "negotiating", "closed-won"].includes(lead.status)
      );
  }
}

export function stepState(lead: StepLead) {
  const steps = MOCKUP_STEPS.map((s) => ({ ...s, done: stepDone(lead, s.key) }));
  const current = steps.find((s) => !s.done);
  return { steps, current: current?.label ?? "Complete", doneCount: steps.filter((s) => s.done).length };
}
