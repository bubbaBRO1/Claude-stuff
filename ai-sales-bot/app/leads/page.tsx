"use client";
import { useState, useEffect, useCallback } from "react";
import type { Lead } from "@/types";
import LeadTable from "@/components/leads/LeadTable";
import LeadForm from "@/components/leads/LeadForm";
import CallModal from "@/components/leads/CallModal";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [callLead, setCallLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = search ? `?q=${encodeURIComponent(search)}` : "";
    const data = await fetch(`/api/leads${params}`).then((r) => r.json());
    setLeads(data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = () => {
    setShowForm(false);
    setEditLead(null);
    load();
  };

  return (
    <div className="flex flex-col h-screen">
      {/* header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-4">
        <h1 className="text-xs font-bold tracking-widest uppercase text-zinc-200">
          Leads <span className="text-zinc-600 ml-2">{leads.length}</span>
        </h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads…"
          className="flex-1 max-w-xs bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#00ff88]/50"
        />
        <Button onClick={() => { setEditLead(null); setShowForm(true); }} size="sm">
          + Add Lead
        </Button>
      </div>

      {/* table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 flex flex-col gap-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <LeadTable
            leads={leads}
            onEdit={(lead) => { setEditLead(lead); setShowForm(true); }}
            onCall={(lead) => setCallLead(lead)}
            onRefresh={load}
          />
        )}
      </div>

      {/* add / edit modal */}
      {showForm && (
        <LeadForm
          lead={editLead}
          onClose={() => { setShowForm(false); setEditLead(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* call modal */}
      {callLead && (
        <CallModal
          lead={callLead}
          onClose={() => { setCallLead(null); load(); }}
        />
      )}
    </div>
  );
}
