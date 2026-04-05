import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendSMS, formatPhone } from "@/lib/twilio";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    campaignId,
    leadIds,
    channels = ["sms", "email"],
  }: { campaignId: string; leadIds: string[]; channels: string[] } = body;

  if (!campaignId || !leadIds?.length) {
    return NextResponse.json({ error: "campaignId and leadIds required" }, { status: 400 });
  }

  const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const leads = await db.lead.findMany({ where: { id: { in: leadIds } } });

  const results = { sent: 0, failed: 0, skipped: 0 };
  const deliveries: Promise<void>[] = [];

  for (const lead of leads) {
    if (channels.includes("sms") && lead.phone) {
      deliveries.push(
        (async () => {
          const deliveryRecord = await db.delivery.create({
            data: { leadId: lead.id, campaignId, channel: "sms", status: "pending" },
          });
          try {
            await sendSMS(formatPhone(lead.phone!), campaign.enhancedPrompt);
            await db.delivery.update({
              where: { id: deliveryRecord.id },
              data: { status: "sent", sentAt: new Date() },
            });
            results.sent++;
          } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            await db.delivery.update({
              where: { id: deliveryRecord.id },
              data: { status: "failed", error },
            });
            results.failed++;
          }
        })()
      );
    } else if (channels.includes("sms") && !lead.phone) {
      results.skipped++;
    }

    if (channels.includes("email") && lead.email) {
      deliveries.push(
        (async () => {
          const deliveryRecord = await db.delivery.create({
            data: { leadId: lead.id, campaignId, channel: "email", status: "pending" },
          });
          try {
            await sendEmail({
              to: lead.email!,
              subject: campaign.subject ?? "Quick question for you",
              text: campaign.enhancedPrompt,
            });
            await db.delivery.update({
              where: { id: deliveryRecord.id },
              data: { status: "sent", sentAt: new Date() },
            });
            results.sent++;
          } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            await db.delivery.update({
              where: { id: deliveryRecord.id },
              data: { status: "failed", error },
            });
            results.failed++;
          }
        })()
      );
    } else if (channels.includes("email") && !lead.email) {
      results.skipped++;
    }
  }

  await Promise.all(deliveries);

  const finalStatus = results.failed > 0 && results.sent > 0 ? "partial" : results.sent > 0 ? "sent" : "draft";
  await db.campaign.update({
    where: { id: campaignId },
    data: { status: finalStatus, sentAt: new Date() },
  });

  return NextResponse.json(results);
}
