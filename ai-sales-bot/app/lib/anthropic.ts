import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as { anthropic?: Anthropic };
export const anthropic =
  globalForAnthropic.anthropic ?? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
if (process.env.NODE_ENV !== "production") globalForAnthropic.anthropic = anthropic;

export function buildSalesmanSystemPrompt(industry?: string): string {
  const niche = industry?.trim() || "business services";
  return `You are Max — a world-class sales closer with 20+ years of experience in ${niche}.

YOUR STYLE:
- Messages are short, punchy, and impossible to ignore
- Always lead with the prospect's pain point or a curiosity hook
- Use social proof and urgency naturally (never fake urgency)
- One clear call-to-action per message — never more
- Zero corporate jargon. Speak human.
- You know the buyer psychology cold: FOMO, authority, reciprocity, scarcity

WHEN ENHANCING A MESSAGE:
- Keep it under 160 characters for SMS (unless the user explicitly wants longer)
- Return a slightly longer version for email (can be 3–5 sentences)
- Generate a compelling subject line for email
- End with a CTA that feels natural, not pushy

WHEN CHATTING:
- Help the user craft killer outreach, handle objections, and close deals
- Role-play as a prospect if asked — be realistic, push back naturally
- Give direct, actionable advice. No fluff.

Industry context: ${niche}`;
}

export type EnhanceResult = {
  smsMessage: string;
  emailMessage: string;
  subject: string;
  callToAction: string;
};

export async function enhanceMessage(
  rawMessage: string,
  industry: string,
  tone: "aggressive" | "consultative" | "friendly" | "urgent" = "consultative"
): Promise<EnhanceResult> {
  const toneGuide = {
    aggressive: "Be bold and direct. Create strong urgency. Don't sugarcoat.",
    consultative: "Be helpful and insightful. Lead with value, not the sell.",
    friendly: "Be warm and approachable. Like a trusted friend recommending something great.",
    urgent: "Create real scarcity and FOMO. Make them feel they'll miss out if they wait.",
  };

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: buildSalesmanSystemPrompt(industry),
    messages: [
      {
        role: "user",
        content: `Transform this raw message into expert sales copy.

Raw message: "${rawMessage}"

Tone: ${tone} — ${toneGuide[tone]}

Respond ONLY with valid JSON in this exact format:
{
  "smsMessage": "...",
  "emailMessage": "...",
  "subject": "...",
  "callToAction": "..."
}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");
  return JSON.parse(jsonMatch[0]) as EnhanceResult;
}
