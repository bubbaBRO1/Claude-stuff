import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateCallScript } from "@/lib/caller";

// POST /api/call — generate AI call script + save call log
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { leadId, productContext = "our service", industry = "business services" } = body;

  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  try {
    const script = await generateCallScript(lead, productContext, lead.industry ?? industry);

    const callLog = await db.callLog.create({
      data: {
        leadId,
        script: script.raw,
        outcome: "pending",
      },
    });

    return NextResponse.json({ callLogId: callLog.id, script, lead });
  } catch (err) {
    console.error("call script error:", err);
    return NextResponse.json({ error: "Failed to generate call script" }, { status: 500 });
  }
}

// PATCH /api/call — update call outcome + notes
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { callLogId, outcome, notes } = body;

  if (!callLogId) return NextResponse.json({ error: "callLogId required" }, { status: 400 });

  const log = await db.callLog.update({
    where: { id: callLogId },
    data: {
      ...(outcome ? { outcome } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });

  // Auto-update lead status when a call connects
  if (outcome === "connected" || outcome === "closed") {
    await db.lead.update({
      where: { id: log.leadId },
      data: { status: outcome === "closed" ? "closed" : "contacted" },
    });
  }

  return NextResponse.json(log);
}

// GET /api/call?leadId=xxx — list call logs for a lead
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");

  const logs = await db.callLog.findMany({
    where: leadId ? { leadId } : {},
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(logs);
}
