import { anthropic, buildOutreachAIPrompt } from "./anthropic";

export interface CallScript {
  opener: string;
  hook: string;
  pitch: string;
  cta: string;
  objections: Array<{ objection: string; response: string }>;
  raw: string;
}

export async function generateCallScript(
  lead: { name: string; company?: string | null; industry?: string | null; notes?: string | null },
  productContext: string,
  industry: string
): Promise<CallScript> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 900,
    system: buildOutreachAIPrompt(industry),
    messages: [
      {
        role: "user",
        content: `Generate a personalized cold call script for this lead:

Name: ${lead.name}
Company: ${lead.company ?? "unknown"}
Industry: ${lead.industry ?? industry}
Notes: ${lead.notes ?? "none"}

Product/Service: ${productContext}

Respond ONLY with valid JSON in this exact format:
{
  "opener": "first 10 seconds — a pattern-interrupt opening line",
  "hook": "one question that surfaces their pain point",
  "pitch": "30-second value prop — specific, benefit-focused",
  "cta": "what you're asking for (specific, low-friction)",
  "objections": [
    { "objection": "I'm not interested", "response": "..." },
    { "objection": "We already have a solution", "response": "..." },
    { "objection": "Send me an email", "response": "..." }
  ]
}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return {
      opener: `Hi ${lead.name}, this is [Your Name]...`,
      hook: "Quick question — are you currently happy with how you handle [pain point]?",
      pitch: text.slice(0, 300),
      cta: "Would you be open to a 10-minute call this week?",
      objections: [],
      raw: text,
    };
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return { ...parsed, raw: text };
}
