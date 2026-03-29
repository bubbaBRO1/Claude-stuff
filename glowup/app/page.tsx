import Link from 'next/link';
import { prisma } from './lib/db';
import { getSessionId } from './lib/session';
import { calcStreak, toDateKey } from './lib/streak';
import { getDailyAffirmation } from './lib/affirmations';
import { XPBreakdown } from './components/home/XPBreakdown';
import { DailyGoals } from './components/home/DailyGoals';
import { SessionInit } from './components/home/SessionInit';

export default async function HomePage() {
  const sessionId = await getSessionId();

  // No session yet — show welcome + init session via client component
  if (!sessionId) {
    return (
      <div className="space-y-6 py-8 text-center">
        <div className="text-6xl animate-float">✨</div>
        <h1 className="text-3xl font-black gradient-text">Welcome to GlowUp</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          AI face analysis, daily routines, productivity tools, and XP gamification to help you look and feel your best.
        </p>
        <SessionInit />
      </div>
    );
  }

  const latestAnalysis = await prisma.analysis.findFirst({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
  });

  const routine = await prisma.routine.findFirst({
    where: { sessionId },
    include: { logs: { orderBy: { dateKey: 'desc' }, take: 100 } },
  });
  const streak = routine ? calcStreak(routine.logs.map(l => l.dateKey)) : 0;
  const completedToday = routine?.logs.some(l => l.dateKey === toDateKey()) ?? false;

  const habitCount = await prisma.habit.count({ where: { sessionId, isActive: true } });
  const today = toDateKey();
  const habitsCompleted = await prisma.habitLog.count({
    where: { habit: { sessionId }, dateKey: today },
  });

  const todaySleep = await prisma.sleepLog.findUnique({
    where: { sessionId_dateKey: { sessionId, dateKey: today } },
  });
  const todayWater = await prisma.waterLog.findUnique({
    where: { sessionId_dateKey: { sessionId, dateKey: today } },
  });

  const affirmation = getDailyAffirmation();

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold gradient-text">GlowUp ✨</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings" className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            ⚙️
          </Link>
          <Link href="/scan" className="btn-primary px-4 py-2 text-sm">Scan Face</Link>
        </div>
      </div>

      {/* Affirmation */}
      <div
        className="card p-4 hero-gradient"
      >
        <p className="text-xs mb-1 font-medium" style={{ color: 'var(--accent)' }}>💬 Today&apos;s Affirmation</p>
        <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          &ldquo;{affirmation}&rdquo;
        </p>
      </div>

      {/* XP Breakdown */}
      <XPBreakdown />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/routine" className="card p-4 space-y-2 block">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-xl font-bold gradient-text-gold">{streak}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Day Streak</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: completedToday ? '#10b981' : 'var(--text-muted)' }}>
            {completedToday ? '✓ Completed today' : 'Routine awaits'}
          </p>
        </Link>

        <Link href="/confidence" className="card p-4 space-y-2 block">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💪</span>
            <div>
              <p className="text-xl font-bold gradient-text">{habitsCompleted}/{habitCount}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Habits Today</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {habitCount === 0 ? 'Set up habits' : `${Math.round((habitsCompleted / Math.max(habitCount, 1)) * 100)}% complete`}
          </p>
        </Link>

        {/* Sleep & Water mini stats */}
        <Link href="/health" className="card p-3 space-y-1 block">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">😴</span>
            <div>
              <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {todaySleep ? `${todaySleep.hours}h` : '—'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sleep</p>
            </div>
          </div>
        </Link>

        <Link href="/health" className="card p-3 space-y-1 block">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">💧</span>
            <div>
              <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {todayWater ? `${todayWater.glasses}/8` : '0/8'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Water</p>
            </div>
          </div>
        </Link>

        {latestAnalysis && (
          <Link href={`/scan/results/${latestAnalysis.id}`} className="card p-4 space-y-2 block col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last Scan</p>
                <p className="text-2xl font-bold gradient-text">{latestAnalysis.overallScore}/10</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Potential: <span className="gradient-text-gold font-bold">{latestAnalysis.potentialScore}/10</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl">📊</div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {new Date(latestAnalysis.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Daily Goals */}
      <DailyGoals />

      {/* Quick Actions */}
      <div>
        <h2 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
        <div className="space-y-2">
          {[
            { href: '/scan', icon: '📷', title: 'Scan Your Face', sub: 'Get your appearance rating + tips', color: '#8b5cf6' },
            { href: '/routine', icon: '☀️', title: 'Morning Routine', sub: completedToday ? 'Completed today ✓' : 'Start your day right', color: '#f59e0b' },
            { href: '/focus', icon: '🧠', title: 'Focus Timer', sub: 'Deep work + earn XP', color: '#3b82f6' },
            { href: '/health', icon: '🏥', title: 'Health Tracker', sub: 'Sleep, water & wellness', color: '#10b981' },
            { href: '/achievements', icon: '🏆', title: 'Achievements', sub: 'Unlock badges and rewards', color: '#f59e0b' },
            { href: '/shop', icon: '🛍️', title: 'Product Shop', sub: 'Curated upgrades for you', color: '#ec4899' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="card p-4 flex items-center gap-4 block"
            >
              <span
                className="text-2xl w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}20` }}
              >
                {item.icon}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.sub}</p>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>›</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
