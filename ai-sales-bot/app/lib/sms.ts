/**
 * Unified SMS sender.
 *
 * Provider priority (set SMS_PROVIDER in .env.local):
 *   "textbelt"  — TextBelt (FREE: 1 SMS/day with key="textbelt", no account needed)
 *                 For more, buy a key at textbelt.com (~$0.006/SMS, no subscription)
 *   "twilio"    — Twilio (free $15.50 trial at twilio.com, ~2,000 SMS)
 *
 * Defaults to "textbelt" if SMS_PROVIDER is not set.
 */

import { formatPhone } from "./twilio";

export { formatPhone };

async function sendViaTwilio(to: string, body: string): Promise<void> {
  const { default: twilio } = await import("twilio");
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) throw new Error("Missing Twilio env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)");
  const client = twilio(sid, token);
  await client.messages.create({ to, from, body });
}

async function sendViaTextBelt(to: string, body: string): Promise<void> {
  // key="textbelt" = 1 free SMS per day (no signup)
  // Buy a key at textbelt.com for more (~$0.006/SMS)
  const key = process.env.TEXTBELT_KEY ?? "textbelt";
  const res = await fetch("https://textbelt.com/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: to, message: body, key }),
  });
  const data = (await res.json()) as { success: boolean; error?: string; quotaRemaining?: number };
  if (!data.success) {
    throw new Error(data.error ?? "TextBelt send failed");
  }
}

export async function sendSMS(to: string, body: string): Promise<void> {
  const provider = (process.env.SMS_PROVIDER ?? "textbelt").toLowerCase();
  const phone = formatPhone(to);

  if (provider === "twilio") {
    await sendViaTwilio(phone, body);
  } else {
    await sendViaTextBelt(phone, body);
  }
}
