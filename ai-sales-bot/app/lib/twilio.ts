import twilio from "twilio";

let _client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!_client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN");
    _client = twilio(sid, token);
  }
  return _client;
}

export async function sendSMS(to: string, body: string): Promise<{ sid: string }> {
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) throw new Error("Missing TWILIO_FROM_NUMBER");

  const client = getClient();
  const msg = await client.messages.create({ to, from, body });
  return { sid: msg.sid };
}

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}
