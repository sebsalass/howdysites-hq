#!/usr/bin/env node
// Scrape businesses by ZIP code via the Google Places API (Text Search).
// Needs GOOGLE_PLACES_API_KEY in the environment or in a .env file at repo root.
//
// Usage:
//   node scripts/scrape.mjs "hvac" 77502 77506 77011 > candidates.json
//   node scripts/scrape.mjs "roofing" 75217 --city=dallas > candidates.json
//
// Then score them:  node scripts/audit.mjs candidates.json > audited.json
// Then import audited.json on the dashboard's Import page.
//
// Compliance: official Google API, business data only. We store our own derived
// records (name/address/phone/website/rating), not Google's proprietary content.

import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// tiny .env loader — no deps
if (!process.env.GOOGLE_PLACES_API_KEY && existsSync(join(ROOT, ".env"))) {
  for (const line of readFileSync(join(ROOT, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m) process.env[m[1]] ??= m[2];
  }
}
const KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!KEY) {
  console.error("GOOGLE_PLACES_API_KEY missing — put it in .env at the repo root (see .env.example).");
  process.exit(1);
}

const args = process.argv.slice(2);
let niches = [args[0]];
if (args[0] === "all") {
  const targets = JSON.parse(readFileSync(join(ROOT, "config/targets.json"), "utf8"));
  niches = targets.niches.map((n) => n.label.split("/")[0].trim());
}
const zips = args.filter((a) => /^\d{5}$/.test(a));
const city = (args.find((a) => a.startsWith("--city=")) || "").replace("--city=", "");
if (!niches[0] || zips.length === 0) {
  console.error('usage: node scripts/scrape.mjs "<niche>|all" <zip> [zip...] [--city=houston]');
  process.exit(1);
}

const FIELDS = [
  "places.displayName", "places.formattedAddress", "places.nationalPhoneNumber",
  "places.websiteUri", "places.rating", "places.userRatingCount", "places.googleMapsUri",
].join(",");

async function searchZip(zip, niche) {
  const results = [];
  let pageToken;
  do {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY,
        "X-Goog-FieldMask": FIELDS + ",nextPageToken",
      },
      body: JSON.stringify({ textQuery: `${niche} in ${zip}`, pageSize: 20, ...(pageToken ? { pageToken } : {}) }),
    });
    if (!res.ok) {
      console.error(`zip ${zip}: API error ${res.status} — ${(await res.text()).slice(0, 200)}`);
      break;
    }
    const data = await res.json();
    for (const p of data.places || []) {
      results.push({
        business: p.displayName?.text,
        niche,
        zip,
        city,
        address: p.formattedAddress,
        phone: p.nationalPhoneNumber || "",
        website: p.websiteUri || "",
        rating: p.rating ?? "",
        reviews: p.userRatingCount ?? "",
        gbp_url: p.googleMapsUri || "",
        contact_source: "google-places-api",
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken && results.length < 60);
  return results;
}

const all = [];
for (const zip of zips) {
  for (const niche of niches) {
    const r = await searchZip(zip, niche);
    console.error(`zip ${zip} / ${niche}: ${r.length} businesses`);
    all.push(...r);
  }
}

// dedupe by name+address across overlapping zips
const seen = new Set();
const deduped = all.filter((b) => {
  const k = `${b.business}|${b.address}`.toLowerCase();
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});
console.error(`total: ${deduped.length} unique businesses across ${zips.length} zips`);
console.log(JSON.stringify(deduped, null, 2));
