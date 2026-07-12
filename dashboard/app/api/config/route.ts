import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson, appendLog } from "@/lib/data";

export const dynamic = "force-dynamic";

const FILES: Record<string, string> = {
  pricing: "config/pricing.json",
  targets: "config/targets.json",
};

export async function GET(req: NextRequest) {
  const which = req.nextUrl.searchParams.get("file") || "pricing";
  const rel = FILES[which];
  if (!rel) return NextResponse.json({ error: "unknown file" }, { status: 400 });
  return NextResponse.json(readJson(rel));
}

// PUT body: { file: "pricing"|"targets", data: {...} }
export async function PUT(req: NextRequest) {
  const { file, data } = await req.json();
  const rel = FILES[file];
  if (!rel || typeof data !== "object" || data === null) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  writeJson(rel, data);
  appendLog(`updated ${rel} via dashboard settings`);
  return NextResponse.json({ ok: true });
}
