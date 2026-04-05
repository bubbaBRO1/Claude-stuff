"use client";
import { useState } from "react";
import type { GeneratedLead } from "@/types";
import LeadGenForm from "@/components/leadgen/LeadGenForm";
import LeadGenResults from "@/components/leadgen/LeadGenResults";

export default function LeadGenPage() {
  const [results, setResults] = useState<{
    leads: GeneratedLead[];
    industry: string;
    location: string;
  } | null>(null);

  return (
    <div className="flex flex-col h-screen">
      {/* header */}
      <div className="px-6 py-4 border-b border-zinc-800">
        <h1 className="text-xs font-bold tracking-widest uppercase text-zinc-200">
          ◆ AI Lead Generation
        </h1>
        <p className="text-[11px] text-zinc-600 mt-0.5">
          Describe your target market and Max will find potential leads
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">
        <LeadGenForm
          onResults={(leads, industry, location) =>
            setResults({ leads, industry, location })
          }
        />

        {results && (
          <LeadGenResults
            leads={results.leads}
            industry={results.industry}
            location={results.location}
            onLeadAdded={() => {}}
          />
        )}
      </div>
    </div>
  );
}
