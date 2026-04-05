import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const campaign = await db.campaign.findUnique({
    where: { id },
    include: {
      deliveries: {
        include: { lead: true },
        orderBy: { sentAt: "desc" },
      },
    },
  });

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...campaign,
    deliveries: campaign.deliveries.map((d) => ({
      ...d,
      lead: d.lead ? { ...d.lead, tags: JSON.parse(d.lead.tags as string) } : null,
    })),
  });
}
