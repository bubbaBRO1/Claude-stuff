'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import PageHeader from '../components/layout/PageHeader';
import StepTimer from '../components/routine/StepTimer';
import StreakBadge from '../components/routine/StreakBadge';
import type { RoutineWithStreak } from '../types/routine';

export default function RoutinePage() {
  const [routine, setRoutine] = useState<RoutineWithStreak | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const confettiRef = useRef<() => void>(null);

  useEffect(() => {
    fetch('/api/routines').then(r => r.json()).then(setRoutine);
  }, []);

  useEffect(() => {
    if (routine?.completedToday) setCompleted(true);
  }, [routine]);

  const toggleStep = useCallback((id: string, durationSec: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (activeTimer === id) setActiveTimer(null);
      } else {
        next.add(id);
        if (durationSec > 0) setActiveTimer(id);
      }
      return next;
    });
  }, [activeTimer]);

  const allChecked = routine ? routine.steps.filter(s => s.isActive).every(s => checked.has(s.id)) : false;

  const handleComplete = async () => {
    if (!allChecked) return;
    const res = await fetch('/api/routines/complete', { method: 'POST' });
    const data = await res.json();
    setCompleted(true);
    setConfetti(true);
    setRoutine(prev => prev ? { ...prev, streak: data.streak, completedToday: true } : prev);
    // Trigger confetti
    const confettiLib = (await import('canvas-confetti')).default;
    confettiLib({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#8b5cf6', '#ec4899', '#f59e0b'] });
    setTimeout(() => setConfetti(false), 3000);
  };

  if (!routine) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-4xl animate-float">☀️</div>
    </div>
  );

  const activeSteps = routine.steps.filter(s => s.isActive);
  const progress = activeSteps.length > 0 ? (checked.size / activeSteps.length) * 100 : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Morning Routine"
        subtitle={`${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
        right={<StreakBadge streak={routine.streak} />}
      />

      {completed ? (
        <div className="card card-glow p-8 text-center space-y-3">
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-xl font-bold gradient-text">Routine Complete!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            You&apos;re on a <span className="gradient-text-gold font-bold">{routine.streak}-day streak</span>. Keep it up!
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Come back tomorrow to continue your streak</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Link href="/confidence" className="btn-secondary py-3 text-center text-sm">💪 Habits</Link>
            <Link href="/scan" className="btn-primary py-3 text-center text-sm">📷 Scan Face</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {checked.size}/{activeSteps.length} steps
              </span>
              <span className="text-sm font-bold gradient-text">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'var(--gradient)' }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {activeSteps.map((step) => {
              const isChecked = checked.has(step.id);
              const isTimerActive = activeTimer === step.id && isChecked;
              return (
                <button
                  key={step.id}
                  className="w-full text-left card p-4 flex items-center gap-3 transition-all"
                  style={{
                    borderColor: isChecked ? 'rgba(139,92,246,0.5)' : 'var(--border)',
                    background: isChecked ? 'rgba(139,92,246,0.08)' : 'var(--bg-card)',
                  }}
                  onClick={() => toggleStep(step.id, step.durationSec)}
                >
                  <span
                    className="text-xl flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all"
                    style={{
                      background: isChecked ? 'var(--gradient)' : 'var(--border)',
                    }}
                  >
                    {isChecked ? '✓' : step.icon}
                  </span>
                  <div className="flex-1">
                    <p
                      className="font-medium text-sm"
                      style={{
                        color: 'var(--text-primary)',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        opacity: isChecked ? 0.6 : 1,
                      }}
                    >
                      {step.title}
                    </p>
                    {step.durationSec > 0 && !isChecked && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {Math.floor(step.durationSec / 60) > 0 ? `${Math.floor(step.durationSec / 60)} min` : `${step.durationSec} sec`}
                      </p>
                    )}
                  </div>
                  {isTimerActive && (
                    <StepTimer
                      durationSec={step.durationSec}
                      running={isTimerActive}
                      onComplete={() => setActiveTimer(null)}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Complete button */}
          <button
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${allChecked ? 'btn-primary animate-glow' : ''}`}
            style={!allChecked ? {
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              cursor: 'not-allowed',
              borderRadius: '0.75rem',
              padding: '1rem',
              fontWeight: 700,
              fontSize: '1.125rem',
            } : {}}
            onClick={handleComplete}
            disabled={!allChecked}
          >
            {allChecked ? '🎉 Complete Routine!' : `${activeSteps.length - checked.size} steps remaining`}
          </button>
        </>
      )}

      <Link href="/routine/setup" className="btn-secondary w-full py-3 text-center text-sm block">
        ⚙️ Customize Routine
      </Link>
    </div>
  );
}
