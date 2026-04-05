import { NextRequest, NextResponse } from "next/server";
import { enhanceMessage } from "@/lib/anthropic";
import type { SalesmanTone } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { rawMessage, industry = "business services", tone = "consultative" } = body;

  if (!rawMessage?.trim()) {
    return NextResponse.json({ error: "rawMessage is required" }, { status: 400 });
  }

  try {
    const result = await enhanceMessage(rawMessage, industry, tone as SalesmanTone);
    return NextResponse.json(result);
  } catch (err) {
    console.error("enhance error:", err);
    return NextResponse.json({ error: "AI enhancement failed" }, { status: 500 });
  }
}
