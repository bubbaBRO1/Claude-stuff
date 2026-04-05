"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Campaign, Delivery } from "@/types";
import Badge, { statusColor } from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import Link from "next/link";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<(Campaign & { deliveries: Delivery[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCampaign(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return <div className="p-6 text-zinc-500">Campaign not found.</div>;
  }

  const sent = campaign.deliveries.filter((d) => d.status === "sent").length;
  const failed = campaign.deliveries.filter((d) => d.status === "failed").length;
  const smsSent = campaign.deliveries.filter((d) => d.channel === "sms" && d.status === "sent").length;
  const emailSent = campaign.deliveries.filter((d) => d.channel === "email" && d.status === "sent").length;

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
        <Link href="/campaigns" className="text-zinc-600 hover:text-zinc-300 text-xs">
          ← Campaigns
        </Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-xs font-bold tracking-widest uppercase text-zinc-200 truncate">
          {campaign.name}
        </h1>
        <Badge color={statusColor(campaign.status)} className="ml-auto">
          {campaign.status}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
        {/* stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Sent", value: sent, color: "text-[#00ff88]" },
            { label: "Failed", value: failed, color: "text-red-400" },
            { label: "SMS", value: smsSent, color: "text-blue-400" },
            { label: "Email", value: emailSent, color: "text-purple-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
              <p className="text-[10px] uppercase tracking-widest text-zinc-600">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* message */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Message sent</p>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-300 whitespace-pre-wrap">
            {campaign.enhancedPrompt}
          </div>
        </div>

        {/* deliveries */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Deliveries</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Lead", "Channel", "Status", "Sent At", "Error"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-zinc-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaign.deliveries.map((d) => (
                <tr key={d.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/40">
                  <td className="px-3 py-2 text-zinc-300">{d.lead?.name ?? d.leadId.slice(0, 8)}</td>
                  <td className="px-3 py-2 text-zinc-500 uppercase">{d.channel}</td>
                  <td className="px-3 py-2">
                    <Badge color={statusColor(d.status)}>{d.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-zinc-600">
                    {d.sentAt ? new Date(d.sentAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-red-400/80 max-w-[200px] truncate">
                    {d.error ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
