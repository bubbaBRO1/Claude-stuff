"use client";
import { useState, useEffect } from "react";
import type { Lead, EnhanceResult } from "@/types";
import Button from "../ui/Button";
import Badge, { statusColor } from "../ui/Badge";
import { useToast } from "../ui/Toast";

interface Props {
  enhancedResult: EnhanceResult | null;
  industry: string;
  onClose: () => void;
  onSent: (campaignId: string) => void;
}

export default function SendPanel({ enhancedResult, industry, onClose, onSent }: Props) {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [channels, setChannels] = useState<{ sms: boolean; email: boolean }>({ sms: true, email: true });
  const [campaignName, setCampaignName] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data: Lead[]) => {
        setLeads(data);
        setSelected(new Set(data.map((l) => l.id)));
        setLoading(false);
      });
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(selected.size === leads.length ? new Set() : new Set(leads.map((l) => l.id)));
  };

  const send = async () => {
    if (!enhancedResult) return;
    if (!selected.size) {
      toast("Select at least one lead", "error");
      return;
    }
    if (!campaignName.trim()) {
      toast("Give this campaign a name", "error");
      return;
    }

    setSending(true);
    try {
      // 1. create campaign
      const campRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          industry,
          originalPrompt: enhancedResult.smsMessage,
          enhancedPrompt: enhancedResult.smsMessage,
          subject: enhancedResult.subject,
        }),
      });
      const camp = await campRes.json();

      // 2. send
      const sendRes = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: camp.id,
          leadIds: Array.from(selected),
          channels: [
            ...(channels.sms ? ["sms"] : []),
            ...(channels.email ? ["email"] : []),
          ],
        }),
      });
      const results = await sendRes.json();

      toast(`Sent ${results.sent} messages! (${results.failed} failed, ${results.skipped} skipped)`, "success");
      onSent(camp.id);
    } catch {
      toast("Send failed — check your API keys in .env.local", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111113] border border-zinc-700 rounded-lg w-full max-w-xl max-h-[80vh] flex flex-col">
        <div className="px-5 py-4 border-b border-zinc-700/60 flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-widest uppercase text-zinc-200">
            Fire Campaign
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <input
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Campaign name (e.g. April Roofing Blast)"
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#00ff88]/50"
          />

          <div className="flex gap-4 text-xs">
            <label className="flex items-center gap-2 text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={channels.sms}
                onChange={(e) => setChannels((c) => ({ ...c, sms: e.target.checked }))}
                className="accent-[#00ff88]"
              />
              SMS
            </label>
            <label className="flex items-center gap-2 text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={channels.email}
                onChange={(e) => setChannels((c) => ({ ...c, email: e.target.checked }))}
                className="accent-[#00ff88]"
              />
              Email
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                Leads ({selected.size}/{leads.length} selected)
              </span>
              <button onClick={toggleAll} className="text-[10px] text-[#00ff88] hover:underline">
                {selected.size === leads.length ? "Deselect all" : "Select all"}
              </button>
            </div>
            {loading ? (
              <div className="text-xs text-zinc-600 py-4 text-center">Loading leads…</div>
            ) : leads.length === 0 ? (
              <div className="text-xs text-zinc-600 py-4 text-center">
                No leads yet — add some in the Leads tab
              </div>
            ) : (
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {leads.map((lead) => (
                  <label
                    key={lead.id}
                    className="flex items-center gap-3 p-2.5 rounded hover:bg-zinc-800/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(lead.id)}
                      onChange={() => toggle(lead.id)}
                      className="accent-[#00ff88]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-zinc-200 truncate">{lead.name}</div>
                      <div className="text-[10px] text-zinc-600 truncate">
                        {lead.company} {lead.phone && `· ${lead.phone}`}
                      </div>
                    </div>
                    <Badge color={statusColor(lead.status)}>{lead.status}</Badge>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-zinc-700/60">
          <Button
            className="w-full"
            size="lg"
            onClick={send}
            loading={sending}
            disabled={!selected.size || !campaignName.trim()}
          >
            ⚡ Launch Campaign
          </Button>
        </div>
      </div>
    </div>
  );
}
