'use client';

import { useEffect, useState } from 'react';
import { XPBar } from '../ui/XPBar';
import { REASON_LABELS } from '../../lib/xp';

interface XPData {
  totalXP: number;
  level: number;
  currentXP: number;
  xpNeeded: number;
  progress: number;
  todayXP: number;
  todayLogs: { id: string; amount: number; reason: string; createdAt: string }[];
}

export function XPBreakdown() {
  const [data, setData] = useState<XPData | null>(null);

  useEffect(() => {
    fetch('/api/xp').then(r => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return (
    <div className="card p-4 space-y-3">
      <div className="skeleton h-5 w-1/3" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-4 w-full" />
    </div>
  );

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">⚡ XP & Level</h3>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent-gold)' }}>
          +{data.todayXP} today
        </span>
      </div>

      <XPBar
        level={data.level}
        currentXP={data.currentXP}
        xpNeeded={data.xpNeeded}
        progress={data.progress}
      />

      {data.todayLogs.length > 0 && (
        <div className="space-y-1.5">
          {data.todayLogs.slice(0, 5).map(log => (
            <div key={log.id} className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>
                {REASON_LABELS[log.reason] ?? log.reason}
              </span>
              <span className="font-semibold" style={{ color: 'var(--accent-gold)' }}>
                +{log.amount}
              </span>
            </div>
          ))}
          {data.todayLogs.length > 5 && (
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              +{data.todayLogs.length - 5} more events
            </div>
          )}
        </div>
      )}

      {data.todayLogs.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          No XP earned yet today. Complete actions to earn XP!
        </p>
      )}
    </div>
  );
}
