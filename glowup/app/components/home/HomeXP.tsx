'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getRank, getNextRank, REASON_LABELS } from '../../lib/xp';

interface XPData {
  totalXP: number;
  level: number;
  currentXP: number;
  xpNeeded: number;
  progress: number;
  todayXP: number;
  todayLogs: { id: string; amount: number; reason: string; createdAt: string }[];
}

export function HomeXP() {
  const [data, setData] = useState<XPData | null>(null);

  useEffect(() => {
    fetch('/api/xp').then(r => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return (
    <div className="card p-4 space-y-3">
      <div className="skeleton h-10 w-full" />
      <div className="skeleton h-2 w-full" />
    </div>
  );

  const rank = getRank(data.level);
  const next = getNextRank(data.level);

  return (
    <Link href="/rank" className="block">
      <div className="card p-4 space-y-3" style={{ borderColor: `${rank.color}20` }}>
        {/* Top row: rank info + XP today */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
            style={{
              background: `${rank.color}12`,
              border: `1px solid ${rank.color}25`,
              boxShadow: rank.glow ? `0 0 12px ${rank.color}20` : 'none',
            }}
          >
            {rank.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm" style={{ color: rank.color }}>{rank.name}</span>
              <span className={`rank-badge ${rank.cssClass}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                Lv.{data.level}
              </span>
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {data.totalXP.toLocaleString()} XP total
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="chip chip-gold" style={{ fontSize: '10px' }}>
              +{data.todayXP} today
            </div>
          </div>
        </div>

        {/* XP progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {data.currentXP}/{data.xpNeeded} XP
            </span>
            {next && (
              <span className="text-[10px]" style={{ color: next.color }}>
                {next.icon} {next.name}
              </span>
            )}
          </div>
          <div className="progress-bar" style={{ height: 5 }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${rank.color}, ${next?.color ?? rank.color})` }}
              initial={{ width: 0 }}
              animate={{ width: `${data.progress * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        </div>

        {/* Recent XP logs */}
        {data.todayLogs.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {data.todayLogs.slice(0, 4).map(log => (
              <span key={log.id} className="chip flex-shrink-0" style={{ fontSize: '9px' }}>
                {REASON_LABELS[log.reason]?.split(' ')[0] ?? '⚡'} +{log.amount}
              </span>
            ))}
            {data.todayLogs.length > 4 && (
              <span className="chip flex-shrink-0" style={{ fontSize: '9px' }}>
                +{data.todayLogs.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
