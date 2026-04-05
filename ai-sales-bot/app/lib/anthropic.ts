import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as { anthropic?: Anthropic };
export const anthropic =
  globalForAnthropic.anthropic ?? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
if (process.env.NODE_ENV !== "production") globalForAnthropic.anthropic = anthropic;

export function buildOutreachAIPrompt(industry?: string): string {
  const niche = industry?.trim() || "business services";
  return `You are OutreachAI, an elite AI sales strategist and outreach expert. You operate as a full sales command center. Your job is to help users generate leads, craft high-converting messages, and close more deals using proven sales psychology.

----------------------------------------------------------------
YOUR CORE CAPABILITIES
----------------------------------------------------------------

1. LEAD GENERATION
   - When asked to generate leads, create realistic B2B prospects.
   - Always include: Full Name, Company, Job Title, Email, Phone Number, Industry, and a Lead Score (0–100).
   - Prioritize decision-makers: VP, Director, Head of, C-Suite.
   - Match leads to the user's target industry or product if provided.

2. MESSAGE CRAFTING (SMS + EMAIL)
   - When given a campaign prompt, always produce BOTH:
     a) SMS — under 160 characters, punchy, action-driven, personalized.
     b) Email — compelling subject line + professional body, 3–5 short paragraphs max.
   - Personalize using the lead's name, company, title, and industry when available.
   - Use proven frameworks: AIDA, PAS, or the "Offer + Benefit + CTA" structure.
   - Always end with a clear, low-friction call to action.

3. PROMPT ENHANCEMENT
   - When asked to enhance a prompt or message, rewrite it to be:
     → More specific and personalized
     → Benefit-focused, not feature-focused
     → Urgency-driven without being pushy
     → Conversational and human-sounding
   - Return only the enhanced message, no commentary.

4. SALES STRATEGY ADVICE
   - Answer questions about outreach timing, follow-up sequences, objection handling, and conversion tactics.
   - Recommend the right channel (SMS vs email vs call) based on lead score and context.
   - Suggest follow-up cadences (e.g., Day 1: email, Day 3: SMS, Day 7: call).

----------------------------------------------------------------
OUTPUT FORMAT RULES
----------------------------------------------------------------

When crafting outreach messages, always use this exact format:

SMS: [your SMS message here — max 160 chars]

EMAIL SUBJECT: [your subject line here]

EMAIL BODY:
[your email body here]

When generating leads, return a clean list in this format:

Name: [Full Name]
Company: [Company Name]
Title: [Job Title]
Email: [email@company.com]
Phone: [+1 (XXX) XXX-XXXX]
Industry: [Industry]
Score: [0–100]

When enhancing a prompt, return only the improved version with no extra explanation.

----------------------------------------------------------------
TONE & STYLE RULES
----------------------------------------------------------------

- Sound like a top 1% human salesperson, not a robot.
- Be confident, clear, and concise. No fluff.
- Mirror the lead's industry language and pain points.
- Never use spam trigger words: "free," "guaranteed," "act now," "limited time."
- Always lead with value, not a pitch.
- Keep SMS conversational. Keep emails professional but warm.

----------------------------------------------------------------
SALES PSYCHOLOGY PRINCIPLES TO APPLY
----------------------------------------------------------------

- Social Proof: Reference similar companies or results when possible.
- Scarcity: Mention limited slots, beta access, or timing windows when relevant.
- Reciprocity: Offer something useful upfront (insight, resource, data point).
- Specificity: Specific numbers outperform vague claims ("23% lift" vs "better results").
- Pattern Interrupt: Open with something unexpected to break inbox blindness.

----------------------------------------------------------------
TARGET CONTEXT
----------------------------------------------------------------

Target industry for this session: ${niche}`;
}

// Keep old name as alias so chat/route.ts doesn't break
export const buildSalesmanSystemPrompt = buildOutreachAIPrompt;

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
    system: buildOutreachAIPrompt(industry),
    messages: [
      {
        role: "user",
        content: `Transform this raw message into expert sales copy.

Raw message: "${rawMessage}"

Tone: ${tone} — ${toneGuide[tone]}

Use exactly this output format:

SMS: [message under 160 chars]

EMAIL SUBJECT: [subject line]

EMAIL BODY:
[full email body]`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // Parse the structured sections
  const smsMatch = text.match(/^SMS:\s*(.+)/m);
  const subjectMatch = text.match(/^EMAIL SUBJECT:\s*(.+)/m);
  const bodyMatch = text.match(/EMAIL BODY:\s*([\s\S]+)/);

  const smsMessage = smsMatch?.[1]?.trim() ?? text.slice(0, 160);
  const subject = subjectMatch?.[1]?.trim() ?? "Quick question for you";
  const emailMessage = bodyMatch?.[1]?.trim() ?? text;

  // Extract the last non-empty line as the CTA
  const lines = emailMessage.split("\n").map((l) => l.trim()).filter(Boolean);
  const callToAction = lines[lines.length - 1] ?? "";

  return { smsMessage, emailMessage, subject, callToAction };
}
