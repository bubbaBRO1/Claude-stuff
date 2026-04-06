"use client";
import { useState } from "react";
import type { Lead } from "@/types";
import type { CallScript } from "@/lib/caller";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";

interface Props {
  lead: Lead;
  onClose: () => void;
}

type Outcome = "pending" | "connected" | "voicemail" | "no-answer" | "closed";

const outcomes: { value: Outcome; label: string; color: string }[] = [
  { value: "pending", label: "Not called yet", color: "text-zinc-500" },
  { value: "connected", label: "Connected", color: "text-blue-400" },
  { value: "voicemail", label: "Left voicemail", color: "text-yellow-400" },
  { value: "no-answer", label: "No answer", color: "text-zinc-400" },
  { value: "closed", label: "Closed deal", color: "text-[#00ff88]" },
];

export default function CallModal({ lead, onClose }: Props) {
  const { toast } = useToast();
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<CallScript | null>(null);
  const [callLogId, setCallLogId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>("pending");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"setup" | "script">("setup");

  const generateScript = async () => {
    if (!product.trim()) {
      toast("Describe your product/service first", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          productContext: product,
          industry: lead.industry ?? "business services",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScript(data.script);
      setCallLogId(data.callLogId);
      setStep("script");
    } catch (err) {
      toast(String(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const saveLog = async () => {
    if (!callLogId) return;
    setSaving(true);
    try {
      await fetch("/api/call", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callLogId, outcome, notes }),
      });
      toast("Call logged!", "success");
      onClose();
    } catch {
      toast("Failed to save log", "error");
    } finally {
      setSaving(false);
    }
  };

  const phone = lead.phone ?? "";
  const cleanPhone = phone.replace(/\D/g, "");
  const dialLink = cleanPhone ? `tel:+1${cleanPhone}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111113] border border-zinc-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* header */}
        <div className="px-5 py-4 border-b border-zinc-700/60 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold tracking-widest uppercase text-zinc-200">
              📞 Call Script — {lead.name}
            </h2>
            {lead.company && (
              <p className="text-[11px] text-zinc-500 mt-0.5">{lead.company}</p>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200">
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* click-to-dial */}
          {dialLink ? (
            <a
              href={dialLink}
              className="flex items-center justify-center gap-3 bg-[#00ff88]/10 border border-[#00ff88]/30 hover:bg-[#00ff88]/20 rounded-lg px-5 py-4 transition-all group"
            >
              <span className="text-2xl">📱</span>
              <div>
                <p className="text-[#00ff88] font-mono text-lg font-bold tracking-wider">
                  {lead.phone}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  Tap to dial
                </p>
              </div>
            </a>
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg px-5 py-3 text-xs text-zinc-600 text-center">
              No phone number on this lead — add one in Edit
            </div>
          )}

          {/* step 1: setup */}
          {step === "setup" && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
                  What are you selling?
                </label>
                <input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. AI-powered scheduling software for dental offices"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#00ff88]/50"
                />
              </div>
              <Button onClick={generateScript} loading={loading} className="w-full">
                ⚡ Generate Call Script
              </Button>
            </div>
          )}

          {/* step 2: script */}
          {step === "script" && script && (
            <div className="flex flex-col gap-4">
              {[
                { label: "Opener", key: "opener", color: "text-[#00ff88]" },
                { label: "Hook", key: "hook", color: "text-blue-400" },
                { label: "Pitch", key: "pitch", color: "text-purple-400" },
                { label: "CTA", key: "cta", color: "text-yellow-400" },
              ].map(({ label, key, color }) => (
                <div key={key}>
                  <p className={`text-[10px] uppercase tracking-widest mb-1.5 ${color}`}>
                    {label}
                  </p>
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded p-3 text-sm text-zinc-200 leading-relaxed">
                    {script[key as keyof CallScript] as string}
                  </div>
                </div>
              ))}

              {script.objections?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-red-400/70 mb-2">
                    Objection Handlers
                  </p>
                  <div className="flex flex-col gap-2">
                    {script.objections.map((o, i) => (
                      <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded p-3">
                        <p className="text-xs text-red-400/80 mb-1">"{o.objection}"</p>
                        <p className="text-xs text-zinc-300">→ {o.response}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* call outcome log */}
              <div className="border-t border-zinc-800 pt-4 flex flex-col gap-3">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                  Log this call
                </p>
                <div className="flex flex-wrap gap-2">
                  {outcomes.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setOutcome(o.value)}
                      className={`px-3 py-1.5 rounded text-xs border transition-all ${
                        outcome === o.value
                          ? `border-[#00ff88]/40 bg-[#00ff88]/10 ${o.color}`
                          : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Call notes (what was said, next steps…)"
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#00ff88]/50 resize-none"
                />
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep("setup")} className="flex-1">
                    ← Regenerate
                  </Button>
                  <Button onClick={saveLog} loading={saving} className="flex-1">
                    Save Call Log
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
