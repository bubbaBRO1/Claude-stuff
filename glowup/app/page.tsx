import Link from 'next/link';
import { prisma } from './lib/db';
import { getSessionId } from './lib/session';
import { calcStreak, toDateKey } from './lib/streak';
import { getDailyAffirmation } from './lib/affirmations';
import { calcLevel, getRank, getNextRank } from './lib/xp';
import { HomeXP } from './components/home/HomeXP';
import { DailyGoals } from './components/home/DailyGoals';
import { SessionInit } from './components/home/SessionInit';

export default async function HomePage() {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="animate-shield-pulse mb-6">
          <div
            className="w-24 h-28 rounded-2xl flex flex-col items-center justify-center"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.15) 0%, transparent 70%)',
              border: '2px solid rgba(16,185,129,0.3)',
              boxShadow: '0 0 40px rgba(16,185,129,0.15)',
            }}
          >
            <span className="text-4xl">⚡</span>
          </div>
        </div>
        <h1 className="text-3xl font-black gradient-text mb-2">GlowUp</h1>
        <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--text-secondary)' }}>
          Level up your looks, habits, and life. AI-powered coaching with XP gamification.
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

  const goalCount = await prisma.goal.count({ where: { sessionId, dateKey: today } });
  const goalsDone = await prisma.goal.count({ where: { sessionId, dateKey: today, completed: true } });

  const affirmation = getDailyAffirmation();

  // Compute daily progress
  const tasksDone = (completedToday ? 1 : 0) + habitsCompleted + goalsDone + (todaySleep ? 1 : 0) + ((todayWater?.glasses ?? 0) >= 8 ? 1 : 0);
  const tasksTotal = 1 + habitCount + goalCount + 1 + 1;
  const dayProgress = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;

  return (
    <div className="space-y-4 pb-4 stagger">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-black gradient-text">GlowUp</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <Link href="/scan" className="btn-primary px-3.5 py-1.5 text-xs font-bold">
            Scan Face
          </Link>
        </div>
      </div>

      {/* XP / Rank Header Card */}
      <HomeXP />

      {/* Today's Plan header */}
      <div className="card-rank p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Today&apos;s Plan</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Your daily roadmap</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-black gradient-text">{dayProgress}%</div>
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${dayProgress}%` }} />
        </div>

        {/* Quick stat chips */}
        <div className="flex gap-2 flex-wrap">
          <Link href="/routine" className={`chip ${completedToday ? 'chip-active' : ''}`}>
            {completedToday ? '✓' : '○'} Routine
          </Link>
          <Link href="/confidence" className={`chip ${habitsCompleted === habitCount && habitCount > 0 ? 'chip-active' : ''}`}>
            {habitsCompleted}/{habitCount} Habits
          </Link>
          <Link href="/health" className={`chip ${(todayWater?.glasses ?? 0) >= 8 ? 'chip-active' : ''}`}>
            💧 {todayWater?.glasses ?? 0}/8
          </Link>
          <Link href="/health" className={`chip ${todaySleep ? 'chip-active' : ''}`}>
            😴 {todaySleep ? `${todaySleep.hours}h` : '—'}
          </Link>
        </div>
      </div>

      {/* Streak + Score Row */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/routine" className="card p-3.5 block">
          <div className="flex items-center gap-2.5">
            <div className={`streak-ring ${streak > 0 ? 'animate-streak-fire' : ''}`}>
              <span className="text-lg">🔥</span>
            </div>
            <div>
              <p className="text-xl font-black gradient-text-gold">{streak}</p>
              <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Day Streak</p>
            </div>
          </div>
        </Link>

        {latestAnalysis ? (
          <Link href={`/scan/results/${latestAnalysis.id}`} className="card p-3.5 block">
            <div className="flex items-center gap-2.5">
              <div className="streak-ring" style={{ borderColor: 'var(--accent-purple)', background: 'rgba(139,92,246,0.08)' }}>
                <span className="text-lg font-black gradient-text">{latestAnalysis.overallScore}</span>
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {latestAnalysis.overallScore}/10
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Potential <span className="gradient-text-gold font-bold">{latestAnalysis.potentialScore}</span>
                </p>
              </div>
            </div>
          </Link>
        ) : (
          <Link href="/scan" className="card p-3.5 block">
            <div className="flex items-center gap-2.5">
              <div className="streak-ring" style={{ borderColor: 'var(--accent-purple)', background: 'rgba(139,92,246,0.08)' }}>
                <span className="text-lg">📷</span>
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>No Scan</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Tap to scan</p>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Affirmation */}
      <div className="card p-3.5 hero-gradient">
        <p className="text-[10px] font-bold mb-1 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
          Daily Affirmation
        </p>
        <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          &ldquo;{affirmation}&rdquo;
        </p>
      </div>

      {/* Daily Goals */}
      <DailyGoals />

      {/* Quick Actions */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Get Started
        </h3>
        {[
          { href: '/scan', icon: '📷', title: 'Scan Your Face', sub: 'AI-powered appearance analysis', color: '#10b981' },
          { href: '/routine', icon: '☀️', title: 'Morning Routine', sub: completedToday ? 'Completed today ✓' : 'Start your daily routine', color: '#eab308' },
          { href: '/focus', icon: '🧠', title: 'Focus Timer', sub: 'Deep work sessions + XP', color: '#06b6d4' },
          { href: '/coach', icon: '💡', title: 'Life Coach', sub: 'Personalized coaching & challenges', color: '#8b5cf6' },
          { href: '/health', icon: '❤️', title: 'Health Tracker', sub: 'Sleep, water & wellness', color: '#ef4444' },
          { href: '/achievements', icon: '🏆', title: 'Achievements', sub: 'Unlock badges and earn XP', color: '#f97316' },
          { href: '/shop', icon: '🛍️', title: 'Product Shop', sub: 'Curated products for your glow-up', color: '#ec4899' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="card p-3.5 flex items-center gap-3 block"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: `${item.color}10`, border: `1px solid ${item.color}18` }}
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.sub}</p>
            </div>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
