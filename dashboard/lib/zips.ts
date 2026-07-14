import { readJson, readLeads } from "./data";

export type ZipInfo = { zip: string; city: string; county: string; lat: number; lng: number };

const METROS: Record<string, { lat: number; lng: number; label: string }> = {
  houston: { lat: 29.7604, lng: -95.3698, label: "Houston" },
  dallas: { lat: 32.7767, lng: -96.797, label: "Dallas" },
  "san-antonio": { lat: 29.4241, lng: -98.4936, label: "San Antonio" },
};
export const METRO_IDS = Object.keys(METROS);
const METRO_RADIUS_MI = 55;

let cache: ZipInfo[] | null = null;
export function allZips(): ZipInfo[] {
  if (!cache) cache = readJson<{ zips: ZipInfo[] }>("data/zips-tx.json").zips;
  return cache;
}

export function zipInfo(zip: string): ZipInfo | undefined {
  return allZips().find((z) => z.zip === zip);
}

export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function metroOf(z: { lat: number; lng: number }): string | null {
  let best: string | null = null;
  let bestD = METRO_RADIUS_MI;
  for (const [id, c] of Object.entries(METROS)) {
    const d = milesBetween(z, c);
    if (d < bestD) {
      bestD = d;
      best = id;
    }
  }
  return best;
}

export function metroZips(metro: string): ZipInfo[] {
  const c = METROS[metro];
  if (!c) return [];
  return allZips().filter((z) => milesBetween(z, c) <= METRO_RADIUS_MI);
}

export type ZipStatus = "clients" | "contacted" | "scraped" | "queued" | "exhausted" | "unexplored";

// Derived truth: lead files say what actually happened in a ZIP;
// territories.json only holds explicit marks (queued / exhausted).
export function zipStatuses(): Map<string, ZipStatus> {
  const marks = readJson<{ zips: Record<string, { status?: string }> }>("data/territories.json").zips;
  const map = new Map<string, ZipStatus>();
  for (const [z, m] of Object.entries(marks)) {
    if (m.status === "queued" || m.status === "exhausted") map.set(z, m.status);
  }
  for (const l of readLeads()) {
    if (!l.zip) continue;
    const cur = map.get(l.zip);
    const touched = l.touches.some((t) => t.channel !== "status" && !(t.note || "").includes("brief"));
    const next: ZipStatus =
      l.status === "closed-won" ? "clients" : touched || l.status !== "new" ? "contacted" : "scraped";
    const rank = { clients: 5, contacted: 4, scraped: 3, exhausted: 2, queued: 1, unexplored: 0 };
    if (!cur || rank[next] > rank[cur]) map.set(l.zip, next);
  }
  return map;
}

// Next-N recommendations: nearest ZIPs to the focus that nobody has worked yet.
export function recommendNext(focusZip: string, n = 5): (ZipInfo & { miles: number })[] {
  const focus = zipInfo(focusZip);
  if (!focus) return [];
  const statuses = zipStatuses();
  return allZips()
    .filter((z) => z.zip !== focusZip && !statuses.has(z.zip) && metroOf(z) !== null)
    .map((z) => ({ ...z, miles: Math.round(milesBetween(focus, z) * 10) / 10 }))
    .sort((a, b) => a.miles - b.miles)
    .slice(0, n);
}
