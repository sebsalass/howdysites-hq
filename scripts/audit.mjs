#!/usr/bin/env node
// Website Report Score — audits business websites and scores them 0-100.
// 100 = great website. 0 = no website at all. LOW scores are our best leads.
//
// Usage:
//   node scripts/audit.mjs input.csv > audited.json
//   node scripts/audit.mjs input.json > audited.json
//
// Input: CSV (header row) or JSON array with at least {business, city}; useful
// extras: zip, niche, website, phone, email, reviews, rating, gbp_url.
// Output: same rows + web_score, problems, checks — paste into the dashboard's
// Import page, or pipe to a file and import that.
//
// Scoring rubric (additive, max 100):
//   loads over HTTPS ........ 30   real website that responds
//   valid HTTPS (no error) .. 15   padlock works
//   mobile viewport meta .... 15   readable on a phone
//   click-to-call or form ... 10   can a customer act?
//   fast enough (<2.5s) ..... 10   first response time
//   has <title> .............  5   basic care
//   has meta description ....  5   basic care
//   recent copyright year ...  5   maintained since 2024+
//   not a parked domain .....  5   actually theirs
// Special cases: no website = 0. Facebook/Instagram/Linktree-only = 10.
// Site listed but unreachable = 5.

import { readFileSync } from "fs";

const SOCIAL = /facebook\.com|instagram\.com|linktr\.ee|linkin\.bio|yelp\.com|business\.site/i;
const PARKED = /domain (is )?(parked|for sale)|godaddy.*parked|sedoparking|buy this domain/i;
const TIMEOUT_MS = 12000;

async function auditWebsite(rawUrl) {
  const checks = {
    has_website: false, loads: false, https: false, mobile_viewport: false,
    contact_action: false, fast: false, has_title: false, has_description: false,
    recent_copyright: false, not_parked: false,
  };
  const problems = [];

  if (!rawUrl || !String(rawUrl).trim()) {
    return { web_score: 0, problems: ["no-website"], checks };
  }
  checks.has_website = true;

  let url = String(rawUrl).trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  if (SOCIAL.test(url)) {
    return { web_score: 10, problems: ["social-only"], checks };
  }

  const started = Date.now();
  let res, html = "";
  try {
    res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "Mozilla/5.0 (compatible; HowdySitesAudit/1.0)" },
    });
    html = (await res.text()).slice(0, 400_000);
  } catch {
    // https failed — try plain http before calling it dead
    try {
      res = await fetch(url.replace(/^https:/, "http:"), {
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "user-agent": "Mozilla/5.0 (compatible; HowdySitesAudit/1.0)" },
      });
      html = (await res.text()).slice(0, 400_000);
      problems.push("no-ssl");
    } catch {
      return { web_score: 5, problems: ["dead-site"], checks };
    }
  }
  const elapsed = Date.now() - started;

  if (!res.ok) return { web_score: 5, problems: ["dead-site"], checks };
  checks.loads = true;
  checks.https = res.url.startsWith("https://") && !problems.includes("no-ssl");
  if (!checks.https && !problems.includes("no-ssl")) problems.push("no-ssl");

  checks.mobile_viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  if (!checks.mobile_viewport) problems.push("not-mobile");

  checks.contact_action = /href=["']tel:|<form[\s>]/i.test(html);
  if (!checks.contact_action) problems.push("no-contact-action");

  checks.fast = elapsed < 2500;
  if (!checks.fast) problems.push("slow");

  checks.has_title = /<title[^>]*>[^<]{3,}/i.test(html);
  checks.has_description = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,}/i.test(html);
  if (!checks.has_title || !checks.has_description) problems.push("no-seo-basics");

  const years = [...html.matchAll(/(?:©|&copy;|copyright)\s*(\d{4})/gi)].map((m) => Number(m[1]));
  checks.recent_copyright = years.length === 0 || Math.max(...years) >= new Date().getFullYear() - 2;
  if (!checks.recent_copyright) problems.push("outdated");

  checks.not_parked = !PARKED.test(html);
  if (!checks.not_parked) problems.push("parked-domain");

  // harvest a contact email while we're here (Places API never returns one)
  const emails = [...html.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)]
    .map((m) => m[0].toLowerCase())
    .filter((e) => !/\.(png|jpg|jpeg|gif|svg|webp|css|js)$/.test(e) && !/example\.|sentry|wixpress|godaddy/.test(e));
  const found_email = emails[0] || "";

  const web_score =
    (checks.loads ? 30 : 0) + (checks.https ? 15 : 0) + (checks.mobile_viewport ? 15 : 0) +
    (checks.contact_action ? 10 : 0) + (checks.fast ? 10 : 0) + (checks.has_title ? 5 : 0) +
    (checks.has_description ? 5 : 0) + (checks.recent_copyright ? 5 : 0) + (checks.not_parked ? 5 : 0);

  return { web_score, problems, checks, found_email };
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).filter(Boolean).map((line) => {
    const cells = splitLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i]?.trim() ?? ""]));
  });
}
function splitLine(line) {
  const out = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur); return out;
}

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/audit.mjs <businesses.csv|businesses.json>");
  process.exit(1);
}
const raw = readFileSync(file, "utf8");
const rows = raw.trim().startsWith("[") ? JSON.parse(raw) : parseCsv(raw);

const CONCURRENCY = 8;
const out = [];
let done = 0;
async function worker(queue) {
  while (queue.length) {
    const row = queue.shift();
    const audit = await auditWebsite(row.website);
    const { found_email, ...rest } = audit;
    out.push({ ...row, ...rest, email: row.email || found_email || "" });
    done++;
    process.stderr.write(`\raudited ${done}/${rows.length}  (${row.business ?? row.name ?? "?"}: ${audit.web_score})        `);
  }
}
const queue = [...rows];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
process.stderr.write("\n");

out.sort((a, b) => a.web_score - b.web_score); // best leads (worst sites) first
console.log(JSON.stringify(out, null, 2));
