'use client';

import { useEffect, useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  earned: boolean;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/achievements')
      .then(r => r.json())
      .then(d => { setAchievements(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const earned = achievements.filter(a => a.earned);
  const locked = achievements.filter(a => !a.earned);

  return (
    <PageTransition>
      <div className="space-y-5 py-2">
        <div>
          <h1 className="text-xl font-black gradient-text">Achievements</h1>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {earned.length}/{achievements.length} unlocked
          </p>
        </div>

        {/* Progress */}
        {!loading && achievements.length > 0 && (
          <div className="card p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
              <span className="font-bold gradient-text">{Math.round((earned.length / achievements.length) * 100)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${(earned.length / achievements.length) * 100}%` }} />
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card p-4 flex gap-3">
                <div className="skeleton w-11 h-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && earned.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-gold)' }}>
              Unlocked
            </h2>
            <div className="stagger">
              {earned.map(a => <AchievementCard key={a.id} achievement={a} />)}
            </div>
          </div>
        )}

        {!loading && locked.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Locked
            </h2>
            <div className="space-y-2">
              {locked.map(a => <AchievementCard key={a.id} achievement={a} locked />)}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function AchievementCard({ achievement: a, locked }: { achievement: Achievement; locked?: boolean }) {
  return (
    <div
      className="card p-3.5 flex items-center gap-3 transition-all"
      style={{
        opacity: locked ? 0.45 : 1,
        borderColor: !locked ? 'rgba(234,179,8,0.2)' : 'var(--border)',
        background: !locked ? 'rgba(234,179,8,0.03)' : 'var(--bg-card)',
        boxShadow: !locked ? '0 0 12px rgba(234,179,8,0.08)' : 'none',
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{
          background: locked ? 'var(--bg-tertiary)' : 'rgba(234,179,8,0.1)',
          border: `1px solid ${locked ? 'var(--border)' : 'rgba(234,179,8,0.2)'}`,
          filter: locked ? 'grayscale(1)' : 'none',
        }}
      >
        {a.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-xs">{a.title}</div>
        <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.description}</div>
      </div>
      <span className={`chip ${locked ? '' : 'chip-gold'}`} style={{ fontSize: '9px' }}>
        +{a.xpReward} XP
      </span>
    </div>
  );
}
