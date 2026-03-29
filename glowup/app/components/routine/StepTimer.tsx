'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  durationSec: number;
  running: boolean;
  onComplete: () => void;
}

export default function StepTimer({ durationSec, running, onComplete }: Props) {
  const [remaining, setRemaining] = useState(durationSec);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(durationSec);
  }, [durationSec]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          onComplete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, onComplete]);

  const pct = durationSec > 0 ? ((durationSec - remaining) / durationSec) * 100 : 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  if (durationSec === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Mini progress arc */}
      <svg width={28} height={28} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={14} cy={14} r={10} fill="none" stroke="var(--border)" strokeWidth={3} />
        <circle
          cx={14} cy={14} r={10}
          fill="none"
          stroke={remaining <= 5 ? '#ef4444' : 'var(--accent)'}
          strokeWidth={3}
          strokeDasharray={`${2 * Math.PI * 10} ${2 * Math.PI * 10}`}
          strokeDashoffset={2 * Math.PI * 10 * (1 - pct / 100)}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs font-mono font-bold" style={{ color: remaining <= 5 ? '#ef4444' : 'var(--accent)' }}>
        {mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${remaining}s`}
      </span>
    </div>
  );
}
