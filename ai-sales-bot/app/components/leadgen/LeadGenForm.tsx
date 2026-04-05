"use client";
import { useState } from "react";
import type { GeneratedLead } from "@/types";
import Button from "../ui/Button";

interface Props {
  onResults: (leads: GeneratedLead[], industry: string, location: string) => void;
}

export default function LeadGenForm({ onResults }: Props) {
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [count, setCount] = useState(8);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!industry.trim() || !location.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/leadgen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, location, count }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onResults(data.leads, industry, location);
    } catch (e) {
      alert("Lead generation failed: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    "roofing companies in Austin TX",
    "real estate agents in Miami FL",
    "HVAC contractors in Denver CO",
    "digital marketing agencies in NYC",
  ];

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
            Industry / Niche
          </label>
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. roofing contractors"
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#00ff88]/50"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
            Location
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Austin TX"
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#00ff88]/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">
          Number of leads
        </label>
        <div className="flex gap-2">
          {[5, 8, 10, 20].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`px-3 py-1.5 rounded text-xs border transition-all ${
                count === n
                  ? "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88]"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={generate} loading={loading} disabled={!industry.trim() || !location.trim()} size="lg">
        ◆ Generate Leads
      </Button>

      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Examples</p>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => {
            const [ind, ...locParts] = ex.split(" in ");
            return (
              <button
                key={ex}
                onClick={() => {
                  setIndustry(ind);
                  setLocation(locParts.join(" in "));
                }}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 rounded px-2 py-1 transition-colors"
              >
                {ex}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
