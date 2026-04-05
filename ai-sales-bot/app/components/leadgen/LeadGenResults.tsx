"use client";
import { useState } from "react";
import type { GeneratedLead } from "@/types";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";

interface Props {
  leads: GeneratedLead[];
  industry: string;
  location: string;
  onLeadAdded: () => void;
}

export default function LeadGenResults({ leads, industry, location, onLeadAdded }: Props) {
  const { toast } = useToast();
  const [adding, setAdding] = useState<Record<number, boolean>>({});
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [addingAll, setAddingAll] = useState(false);

  const addLead = async (lead: GeneratedLead, idx: number) => {
    setAdding((prev) => ({ ...prev, [idx]: true }));
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          phone: lead.phone || null,
          email: lead.email || null,
          company: lead.company,
          industry,
          notes: lead.notes || null,
          source: "ai-generated",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setAdded((prev) => new Set([...prev, idx]));
      toast(`${lead.name} added!`, "success");
      onLeadAdded();
    } catch {
      toast("Failed to add lead", "error");
    } finally {
      setAdding((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const addAll = async () => {
    setAddingAll(true);
    let count = 0;
    for (let i = 0; i < leads.length; i++) {
      if (!added.has(i)) {
        await addLead(leads[i], i);
        count++;
      }
    }
    toast(`Added ${count} leads!`, "success");
    setAddingAll(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400">
          Found <span className="text-[#00ff88]">{leads.length}</span> leads in{" "}
          <span className="text-zinc-200">{industry}</span> ·{" "}
          <span className="text-zinc-200">{location}</span>
        </p>
        <Button variant="outline" size="sm" onClick={addAll} loading={addingAll}>
          Add All
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {leads.map((lead, idx) => (
          <div
            key={idx}
            className={`bg-zinc-900/60 border rounded-lg p-4 flex flex-col gap-2 transition-all ${
              added.has(idx)
                ? "border-[#00ff88]/30 bg-[#00ff88]/5"
                : "border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-100 truncate">{lead.name}</p>
                <p className="text-xs text-zinc-500 truncate">{lead.company}</p>
              </div>
              {added.has(idx) ? (
                <span className="text-[10px] text-[#00ff88] uppercase tracking-widest flex-shrink-0">
                  Added ✓
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addLead(lead, idx)}
                  loading={adding[idx]}
                  className="flex-shrink-0"
                >
                  + Add
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-0.5 text-[11px]">
              {lead.phone && (
                <span className="text-zinc-500">📱 {lead.phone}</span>
              )}
              {lead.email && (
                <span className="text-zinc-500 truncate">✉ {lead.email}</span>
              )}
              {lead.website && (
                <span className="text-zinc-600 truncate">🌐 {lead.website}</span>
              )}
            </div>

            {lead.notes && (
              <p className="text-[11px] text-zinc-600 border-t border-zinc-800 pt-2 mt-1">
                {lead.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
