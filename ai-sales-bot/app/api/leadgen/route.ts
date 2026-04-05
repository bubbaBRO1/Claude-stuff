import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import type { GeneratedLead } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { industry, location, count = 8 } = body;

  if (!industry || !location) {
    return NextResponse.json({ error: "industry and location required" }, { status: 400 });
  }

  const prompt = `Generate a list of ${count} realistic B2B sales leads for:
- Industry: ${industry}
- Location: ${location}

For each lead, prioritize decision-makers (VP, Director, Head of, C-Suite).

Respond ONLY with a valid JSON array in this exact format:
[
  {
    "name": "Sarah Chen",
    "company": "Apex Roofing Co",
    "title": "VP of Operations",
    "email": "s.chen@apexroofing.com",
    "phone": "+15125550192",
    "industry": "Commercial Roofing",
    "score": 87,
    "notes": "Decision-maker, recently expanded to multi-state ops"
  }
]

Score is 0–100 based on how likely they are to buy (decision-making authority, company size, timing signals). Generate exactly ${count} leads. Make them realistic and varied.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array in response");

    const leads: GeneratedLead[] = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ leads, industry, location });
  } catch (err) {
    console.error("leadgen error:", err);
    return NextResponse.json({ error: "Lead generation failed" }, { status: 500 });
  }
}
