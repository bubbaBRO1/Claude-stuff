"use client";
import { useState, useEffect } from "react";
import type { Campaign } from "@/types";
import Badge, { statusColor } from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import Link from "next/link";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data: Campaign[]) => {
        setCampaigns(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 py-4 border-b border-zinc-800">
        <h1 className="text-xs font-bold tracking-widest uppercase text-zinc-200">
          ◎ Campaigns <span className="text-zinc-600 ml-2">{campaigns.length}</span>
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-4xl mb-4">◎</div>
            <p className="text-zinc-500 text-sm">No campaigns yet.</p>
            <p className="text-zinc-700 text-xs mt-1">
              Compose a message in Chat, enhance it, and fire a campaign.
            </p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Campaign", "Industry", "Status", "Deliveries", "Sent At", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-zinc-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="px-4 py-3 text-zinc-200 font-medium max-w-[200px] truncate">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{c.industry ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge color={statusColor(c.status)}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {c._count?.deliveries ?? 0}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {c.sentAt ? new Date(c.sentAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="text-[#00ff88]/70 hover:text-[#00ff88] text-[10px] uppercase tracking-wider"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
