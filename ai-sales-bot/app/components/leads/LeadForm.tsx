"use client";
import { useState } from "react";
import type { Lead, LeadStatus } from "@/types";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";

interface Props {
  lead?: Lead | null;
  onClose: () => void;
  onSaved: (lead: Lead) => void;
}

export default function LeadForm({ lead, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: lead?.name ?? "",
    phone: lead?.phone ?? "",
    email: lead?.email ?? "",
    company: lead?.company ?? "",
    industry: lead?.industry ?? "",
    status: (lead?.status ?? "new") as LeadStatus,
    notes: lead?.notes ?? "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) {
      toast("Name is required", "error");
      return;
    }
    setSaving(true);
    try {
      const url = lead ? `/api/leads/${lead.id}` : "/api/leads";
      const method = lead ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(lead ? "Lead updated" : "Lead added", "success");
      onSaved(data);
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: "name", label: "Name *", type: "text" },
    { key: "company", label: "Company", type: "text" },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "email", label: "Email", type: "email" },
    { key: "industry", label: "Industry", type: "text" },
  ];

  return (
    <Modal open onClose={onClose} title={lead ? "Edit Lead" : "Add Lead"}>
      <div className="flex flex-col gap-3">
        {fields.map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
              {label}
            </label>
            <input
              type={type}
              value={form[key as keyof typeof form] as string}
              onChange={(e) => set(key, e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#00ff88]/50"
            />
          </div>
        ))}

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#00ff88]/50"
          >
            {(["new", "contacted", "interested", "closed"] as LeadStatus[]).map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#00ff88]/50 resize-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={save} loading={saving} className="flex-1">
            {lead ? "Save Changes" : "Add Lead"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
