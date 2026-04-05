import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import type { GeneratedLead } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { industry, location, count = 8 } = body;

  if (!industry || !location) {
    return NextResponse.json({ error: "industry and location required" }, { status: 400 });
  }

  const prompt = `I need you to generate a list of ${count} realistic potential business leads for:
- Industry: ${industry}
- Location: ${location}

For each lead, provide:
- Business name
- Contact person name (first + last)
- A realistic phone number (US format)
- A realistic business email address
- Website URL
- Brief note about why they'd be a good prospect

Respond ONLY with a valid JSON array in this exact format:
[
  {
    "name": "John Smith",
    "company": "Smith Roofing LLC",
    "phone": "5125550123",
    "email": "john@smithroofing.com",
    "website": "smithroofing.com",
    "notes": "Growing company, recently expanded to commercial jobs"
  }
]

Generate exactly ${count} leads. Make them realistic and varied.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
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
