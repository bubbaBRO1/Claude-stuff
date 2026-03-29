'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { useToast } from '../components/layout/ToastProvider';
import { XP_REWARDS } from '../lib/xp';

const PRESETS = [
  { label: '25 min', min: 25, type: 'work' },
  { label: '5 min', min: 5, type: 'short-break' },
  { label: '15 min', min: 15, type: 'long-break' },
];

interface Session {
  id: string;
  durationMin: number;
  type: string;
  completedAt: string | null;
  createdAt: string;
}

export default function FocusPage() {
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customMin, setCustomMin] = useState('');
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [sessionCount, setSessionCount] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [totalMins, setTotalMins] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const durationMin = customMin
    ? parseInt(customMin, 10)
    : PRESETS[selectedPreset].min;
  const sessionType = customMin ? 'work' : PRESETS[selectedPreset].type;

  useEffect(() => {
    fetch('/api/focus').then(r => r.json()).then(d => {
      setSessions(d.sessions ?? []);
      setTotalMins(d.totalMins ?? 0);
    }).catch(() => {});
  }, [sessionCount]);

  useEffect(() => {
    if (!customMin) {
      setSecondsLeft(PRESETS[selectedPreset].min * 60);
      setTotalSeconds(PRESETS[selectedPreset].min * 60);
    }
  }, [selectedPreset, customMin]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  const completeSession = useCallback(async () => {
    stopTimer();
    const now = new Date().toISOString();
    await fetch('/api/focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationMin, type: sessionType, completedAt: now }),
    });
    if (sessionType === 'work') {
      await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: XP_REWARDS.focus_session, reason: 'focus_session' }),
      });
      toast(`Focus session done! +${XP_REWARDS.focus_session} XP`, 'xp');
      import('canvas-confetti').then(({ default: confetti }) =>
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#10b981', '#06b6d4', '#eab308'] })
      );
    } else {
      toast('Break complete! Ready for more?', 'success');
    }
    setSessionCount(c => c + 1);
    setSecondsLeft(totalSeconds);
  }, [durationMin, sessionType, totalSeconds, stopTimer, toast]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          completeSession();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, completeSession]);

  function startTimer() {
    if (isNaN(durationMin) || durationMin < 1) return;
    const secs = durationMin * 60;
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setRunning(true);
  }

  function resetTimer() {
    stopTimer();
    setSecondsLeft(totalSeconds);
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const circumference = 2 * Math.PI * 80;

  const workSessions = sessions.filter(s => s.type === 'work' && s.completedAt).length;

  return (
    <PageTransition>
      <div className="space-y-5 py-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black gradient-text">Focus</h1>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Deep work, earn your screen time
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-black gradient-text-gold">{totalMins}m</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>today</div>
          </div>
        </div>

        {/* Your Streak */}
        {workSessions > 0 && (
          <div className="card-rank p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">🔥</span>
              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                Today&apos;s Sessions
              </span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(workSessions, 8) }).map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 700 }}
                >
                  ✓
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timer Ring */}
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="100" cy="100" r="80" fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
              <circle
                cx="100" cy="100" r="80"
                fill="none"
                stroke="url(#focus-grad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
                className={running ? 'animate-ring-glow' : ''}
              />
              <defs>
                <linearGradient id="focus-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
              <span className="text-[10px] mt-1 font-medium" style={{ color: running ? 'var(--accent)' : 'var(--text-muted)' }}>
                {running ? (sessionType === 'work' ? 'Focusing...' : 'On break') : 'Ready'}
              </span>
            </div>
          </div>

          {/* Preset tabs */}
          {!running && (
            <div className="flex gap-2">
              {PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  onClick={() => { setSelectedPreset(i); setCustomMin(''); }}
                  className={`chip ${selectedPreset === i && !customMin ? 'chip-active' : ''}`}
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {!running && (
            <input
              type="number"
              placeholder="Custom (min)"
              value={customMin}
              onChange={e => setCustomMin(e.target.value)}
              className="input text-center"
              style={{ maxWidth: 160 }}
              min={1}
              max={120}
            />
          )}

          {/* Controls */}
          <div className="flex gap-3">
            {!running ? (
              <button onClick={startTimer} className="btn-primary px-10 py-3 text-sm font-bold">
                Start {sessionType === 'work' ? '🧠' : '☕'}
              </button>
            ) : (
              <>
                <button onClick={stopTimer} className="btn-secondary px-6 py-2.5 text-sm">Pause</button>
                <button onClick={resetTimer} className="btn-secondary px-5 py-2.5 text-sm">Reset</button>
              </>
            )}
          </div>
        </div>

        {/* Session history */}
        {sessions.length > 0 && (
          <div className="card p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Today&apos;s Log
            </h3>
            <div className="space-y-1.5">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between text-xs py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{s.type === 'work' ? '🧠' : '☕'}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {s.type === 'work' ? 'Focus' : s.type === 'short-break' ? 'Short break' : 'Long break'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--text-muted)' }}>{s.durationMin}m</span>
                    {s.completedAt && <span style={{ color: 'var(--accent)' }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="card p-4 hero-gradient space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
            Focus Tips
          </h3>
          <ul className="space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex gap-2"><span>•</span> Put your phone face down during sessions</li>
            <li className="flex gap-2"><span>•</span> Complete 4 pomodoros, then take a long break</li>
            <li className="flex gap-2"><span>•</span> Single task — one thing at a time</li>
            <li className="flex gap-2"><span>•</span> Earn <span className="font-bold" style={{ color: 'var(--accent-gold)' }}>+{XP_REWARDS.focus_session} XP</span> per work session</li>
          </ul>
        </div>
      </div>
    </PageTransition>
  );
}
