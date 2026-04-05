import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const campaigns = await db.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { deliveries: true } },
    },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, industry, originalPrompt, enhancedPrompt, subject } = body;

  if (!name || !originalPrompt || !enhancedPrompt) {
    return NextResponse.json({ error: "name, originalPrompt, enhancedPrompt required" }, { status: 400 });
  }

  const campaign = await db.campaign.create({
    data: {
      name,
      industry: industry || null,
      originalPrompt,
      enhancedPrompt,
      subject: subject || null,
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
