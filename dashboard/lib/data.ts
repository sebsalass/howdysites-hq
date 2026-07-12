import fs from "fs";
import path from "path";

// The repo is the database: dashboard/ lives inside agency-hq/, so the repo root is one level up.
export const REPO = path.resolve(process.cwd(), "..");
const LEADS_DIR = path.join(REPO, "data", "leads");

export type Touch = { date: string; by: string; channel: string; note: string };

export type Client = {
  tier: string;
  build_fee: number;
  care_mrr: number;
  launch_date?: string;
  site_repo?: string;
  care_log?: Touch[];
};

export type Lead = {
  id: string;
  business: string;
  city: string;
  niche: string;
  address?: string;
  phone?: string;
  email?: string;
  owner_name?: string;
  contact_source?: string;
  website?: string | null;
  gbp_url?: string;
  demo_url?: string;
  audit?: {
    score: number;
    problems: string[];
    reviews?: number;
    rating?: number;
    audited_at?: string;
  };
  status: string;
  assigned_to?: string;
  value_tier?: string;
  created_at?: string;
  touches: Touch[];
  client?: Client | null;
};

export const STATUSES = [
  "new",
  "contacted",
  "replied",
  "demo-sent",
  "negotiating",
  "closed-won",
  "closed-lost",
  "do-not-contact",
] as const;

export function readLeads(): Lead[] {
  if (!fs.existsSync(LEADS_DIR)) return [];
  return fs
    .readdirSync(LEADS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(LEADS_DIR, f), "utf8")) as Lead)
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

export function readLead(id: string): Lead | null {
  const file = path.join(LEADS_DIR, `${safeId(id)}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeLead(lead: Lead) {
  fs.mkdirSync(LEADS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(LEADS_DIR, `${safeId(lead.id)}.json`),
    JSON.stringify(lead, null, 2) + "\n"
  );
}

export function safeId(id: string) {
  return id.replace(/[^a-z0-9-]/gi, "").toLowerCase();
}

export function readJson<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(REPO, rel), "utf8"));
}

export function writeJson(rel: string, data: unknown) {
  fs.writeFileSync(path.join(REPO, rel), JSON.stringify(data, null, 2) + "\n");
}

export function readDoc(rel: string): string {
  return fs.readFileSync(path.join(REPO, rel), "utf8");
}

export function listDocs(): string[] {
  return fs
    .readdirSync(path.join(REPO, "docs"))
    .filter((f) => f.endsWith(".md"))
    .sort();
}

export function appendLog(entry: string) {
  const file = path.join(REPO, "memory", "log.md");
  const today = new Date().toISOString().slice(0, 10);
  fs.appendFileSync(file, `\n## ${today} — dashboard\n\n- ${entry}\n`);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
