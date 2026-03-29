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
      <div className="space-y-6 py-2">
        <div>
          <h1 className="text-2xl font-black gradient-text">Achievements</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {earned.length}/{achievements.length} unlocked
          </p>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4 flex gap-3">
                <div className="skeleton w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && earned.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold" style={{ color: 'var(--accent-gold)' }}>✨ Unlocked</h2>
            {earned.map(a => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        )}

        {!loading && locked.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>🔒 Locked</h2>
            {locked.map(a => (
              <AchievementCard key={a.id} achievement={a} locked />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function AchievementCard({ achievement: a, locked }: { achievement: Achievement; locked?: boolean }) {
  return (
    <div
      className={`card p-4 flex items-center gap-4 transition-all ${
        !locked ? 'card-glow' : ''
      }`}
      style={!locked ? { borderColor: 'rgba(245,158,11,0.4)', boxShadow: '0 0 16px rgba(245,158,11,0.15)' } : { opacity: 0.5 }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{
          background: locked
            ? 'var(--bg-card)'
            : 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(139,92,246,0.15))',
          border: `1px solid ${locked ? 'var(--border)' : 'rgba(245,158,11,0.3)'}`,
          filter: locked ? 'grayscale(1)' : 'none',
        }}
      >
        {a.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm">{a.title}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{a.description}</div>
      </div>
      <div
        className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{
          background: locked ? 'var(--bg-card)' : 'rgba(245,158,11,0.15)',
          color: locked ? 'var(--text-muted)' : 'var(--accent-gold)',
          border: `1px solid ${locked ? 'var(--border)' : 'rgba(245,158,11,0.3)'}`,
        }}
      >
        +{a.xpReward} XP
      </div>
    </div>
  );
}
