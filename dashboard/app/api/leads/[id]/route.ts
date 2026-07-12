import { NextRequest, NextResponse } from "next/server";
import { readLead, writeLead, today, STATUSES, readJson, writeJson } from "@/lib/data";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const lead = readLead(id);
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(lead);
}

// PATCH: { status? , touch?: {by, channel, note}, fields?: {...}, client?: {...} }
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const lead = readLead(id);
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = await req.json();

  if (body.status) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "bad status" }, { status: 400 });
    }
    if (body.status !== lead.status) {
      lead.touches.push({
        date: today(),
        by: body.by || "dashboard",
        channel: "status",
        note: `${lead.status} -> ${body.status}`,
      });
      lead.status = body.status;
      if (body.status === "do-not-contact") {
        const dnc = readJson<{ list: string[] }>("data/do-not-contact.json");
        if (!dnc.list.includes(lead.id)) dnc.list.push(lead.id);
        writeJson("data/do-not-contact.json", dnc);
      }
    }
  }
  if (body.touch) {
    lead.touches.push({ date: today(), ...body.touch });
  }
  if (body.fields) {
    Object.assign(lead, body.fields, { id: lead.id });
  }
  if (body.client) {
    lead.client = { ...(lead.client || {}), ...body.client };
  }
  writeLead(lead);
  return NextResponse.json(lead);
}
