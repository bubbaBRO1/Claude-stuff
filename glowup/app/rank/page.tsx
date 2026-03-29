'use client';

import { useEffect, useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { RANKS, getRank, getNextRank, calcLevel } from '../lib/xp';

interface XPData {
  totalXP: number;
  level: number;
  currentXP: number;
  xpNeeded: number;
  progress: number;
}

export default function RankPage() {
  const [data, setData] = useState<XPData | null>(null);

  useEffect(() => {
    fetch('/api/xp').then(r => r.json()).then(setData).catch(() => {});
  }, []);

  const level = data?.level ?? 1;
  const rank = getRank(level);
  const nextRank = getNextRank(level);

  return (
    <PageTransition>
      <div className="space-y-6 py-2">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-black gradient-text">Rank Ladder</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Climb the ranks. Prove your dedication.
          </p>
        </div>

        {/* Current rank shield */}
        <div className="flex flex-col items-center py-4">
          <div className="animate-shield-pulse">
            <div
              className="w-28 h-32 rounded-2xl flex flex-col items-center justify-center gap-1"
              style={{
                background: `radial-gradient(ellipse at center, ${rank.color}15 0%, transparent 70%)`,
                border: `2px solid ${rank.color}40`,
                boxShadow: rank.glow ? `0 0 40px ${rank.color}25, 0 0 80px ${rank.color}10` : 'none',
              }}
            >
              <span className="text-4xl">{rank.icon}</span>
              <span className="text-xs font-black" style={{ color: rank.color }}>{rank.name}</span>
            </div>
          </div>
          <div className="mt-3 text-center">
            <div className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
              {data ? data.totalXP.toLocaleString() : '—'}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Total XP</div>
          </div>
          <div className={`rank-badge mt-2 ${rank.cssClass}`}>
            {rank.icon} {rank.name} — Level {level}
          </div>
        </div>

        {/* Progress to next rank */}
        {nextRank && data && (
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>Next: <span className="font-bold" style={{ color: nextRank.color }}>{nextRank.icon} {nextRank.name}</span></span>
              <span style={{ color: 'var(--text-muted)' }}>Level {nextRank.minLevel}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${Math.min(((level - getRank(level).minLevel) / (nextRank.minLevel - getRank(level).minLevel)) * 100, 100)}%`,
                  background: `linear-gradient(90deg, ${rank.color}, ${nextRank.color})`,
                }}
              />
            </div>
            <div className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              {nextRank.minLevel - level} levels to go
            </div>
          </div>
        )}

        {/* Rank Ladder */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>All Ranks</h3>
          <div className="space-y-1.5 stagger">
            {[...RANKS].reverse().map((r) => {
              const isCurrentOrAbove = level >= r.minLevel;
              const isCurrent = rank.name === r.name;
              return (
                <div
                  key={r.name}
                  className="card p-3 flex items-center gap-3 transition-all"
                  style={{
                    opacity: isCurrentOrAbove ? 1 : 0.4,
                    borderColor: isCurrent ? `${r.color}50` : 'var(--border)',
                    background: isCurrent ? `${r.color}08` : 'var(--bg-card)',
                    boxShadow: isCurrent ? `0 0 16px ${r.color}15` : 'none',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{
                      background: `${r.color}12`,
                      border: `1px solid ${r.color}25`,
                    }}
                  >
                    {r.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: isCurrent ? r.color : 'var(--text-primary)' }}>
                        {r.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${r.color}20`, color: r.color }}>
                          NOW
                        </span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Level {r.minLevel}+
                    </span>
                  </div>
                  <div className="text-right">
                    {isCurrentOrAbove ? (
                      <span className="text-xs font-bold" style={{ color: '#10b981' }}>✓</span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>🔒</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
