"use client";
import type { EnhanceResult, SalesmanTone } from "@/types";
import Button from "../ui/Button";

interface Props {
  original: string;
  result: EnhanceResult | null;
  loading: boolean;
  industry: string;
  tone: SalesmanTone;
  onIndustryChange: (v: string) => void;
  onToneChange: (v: SalesmanTone) => void;
  onEnhance: () => void;
  onSend: (result: EnhanceResult) => void;
}

const tones: SalesmanTone[] = ["consultative", "friendly", "aggressive", "urgent"];

export default function EnhancedPreview({
  original,
  result,
  loading,
  industry,
  tone,
  onIndustryChange,
  onToneChange,
  onEnhance,
  onSend,
}: Props) {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* controls */}
      <div className="flex gap-2 flex-wrap">
        <input
          value={industry}
          onChange={(e) => onIndustryChange(e.target.value)}
          placeholder="Industry (e.g. roofing, SaaS)"
          className="flex-1 min-w-32 bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#00ff88]/50"
        />
        <select
          value={tone}
          onChange={(e) => onToneChange(e.target.value as SalesmanTone)}
          className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#00ff88]/50"
        >
          {tones.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
        <Button onClick={onEnhance} loading={loading} disabled={!original.trim()}>
          ⚡ Enhance
        </Button>
      </div>

      {/* before */}
      <div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">Raw message</p>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded p-3 text-xs text-zinc-400 min-h-12 whitespace-pre-wrap">
          {original || <span className="text-zinc-700">Type a message in the chat…</span>}
        </div>
      </div>

      {/* after */}
      {result && (
        <>
          <div>
            <p className="text-[10px] text-[#00ff88]/70 uppercase tracking-widest mb-1.5">
              SMS copy <span className="text-zinc-600">({result.smsMessage.length} chars)</span>
            </p>
            <div className="bg-[#00ff88]/5 border border-[#00ff88]/20 rounded p-3 text-xs text-zinc-200 whitespace-pre-wrap">
              {result.smsMessage}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-[#00ff88]/70 uppercase tracking-widest mb-1.5">
              Email copy
            </p>
            <div className="bg-zinc-900/60 border border-zinc-700 rounded p-3 text-xs text-zinc-300 whitespace-pre-wrap">
              <span className="text-zinc-500 block mb-1">Subject: {result.subject}</span>
              {result.emailMessage}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest">CTA:</span>
            <span className="text-xs text-[#00ff88]">{result.callToAction}</span>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full mt-auto"
            onClick={() => onSend(result)}
          >
            ◎ Send to Leads
          </Button>
        </>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#00ff88] text-sm animate-pulse">Max is writing your copy…</div>
        </div>
      )}
    </div>
  );
}
