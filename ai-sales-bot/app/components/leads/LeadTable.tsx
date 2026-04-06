"use client";
import { useState } from "react";
import type { Lead } from "@/types";
import Badge, { statusColor } from "../ui/Badge";
import { useToast } from "../ui/Toast";

interface Props {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onCall: (lead: Lead) => void;
  onRefresh: () => void;
}

export default function LeadTable({ leads, onEdit, onCall, onRefresh }: Props) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);

  const deleteLead = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/leads/${id}`, { method: "DELETE" });
      toast("Lead deleted", "success");
      onRefresh();
    } catch {
      toast("Delete failed", "error");
    } finally {
      setDeleting(null);
    }
  };

  if (!leads.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-4xl mb-4">◉</div>
        <p className="text-zinc-500 text-sm">No leads yet.</p>
        <p className="text-zinc-700 text-xs mt-1">Add leads manually or generate them with AI.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-800">
            {["Name", "Company", "Phone", "Email", "Industry", "Status", "Actions"].map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-left text-[10px] uppercase tracking-widest text-zinc-600 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
            >
              <td className="px-3 py-2.5 text-zinc-200 font-medium">{lead.name}</td>
              <td className="px-3 py-2.5 text-zinc-400">{lead.company ?? "—"}</td>
              <td className="px-3 py-2.5 text-zinc-400">{lead.phone ?? "—"}</td>
              <td className="px-3 py-2.5 text-zinc-400 max-w-[160px] truncate">{lead.email ?? "—"}</td>
              <td className="px-3 py-2.5 text-zinc-500">{lead.industry ?? "—"}</td>
              <td className="px-3 py-2.5">
                <Badge color={statusColor(lead.status)}>{lead.status}</Badge>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onCall(lead)}
                    className="text-zinc-600 hover:text-[#00ff88] p-1 rounded transition-colors"
                    title="Call — generate AI script + dial"
                  >
                    📞
                  </button>
                  <button
                    onClick={() => onEdit(lead)}
                    className="text-zinc-600 hover:text-zinc-200 p-1 rounded transition-colors"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteLead(lead.id)}
                    disabled={deleting === lead.id}
                    className="text-zinc-700 hover:text-red-400 p-1 rounded transition-colors disabled:opacity-40"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
