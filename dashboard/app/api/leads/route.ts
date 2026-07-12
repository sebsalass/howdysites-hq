import { NextRequest, NextResponse } from "next/server";
import { readLeads, writeLead, safeId, today, type Lead } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(readLeads());
}

// Create a single lead by hand.
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.business || !body.city || !body.niche) {
    return NextResponse.json({ error: "business, city, niche required" }, { status: 400 });
  }
  const id = safeId(body.id || `${body.city}-${body.business.replace(/\s+/g, "-")}`);
  const lead: Lead = {
    status: "new",
    touches: [],
    client: null,
    ...body,
    id,
    created_at: today(),
  };
  writeLead(lead);
  return NextResponse.json(lead, { status: 201 });
}
