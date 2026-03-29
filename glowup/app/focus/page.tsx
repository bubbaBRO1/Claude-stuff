'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { useToast } from '../components/layout/ToastProvider';
import { XPPopup } from '../components/ui/XPPopup';
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
  const [xpTrigger, setXpTrigger] = useState(0);
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
      setXpTrigger(t => t + 1);
      toast(`Focus session complete! +${XP_REWARDS.focus_session} XP ⚡`, 'xp');
      import('canvas-confetti').then(({ default: confetti }) =>
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } })
      );
    } else {
      toast('Break complete! Ready to focus again?', 'success');
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

  return (
    <PageTransition>
      <div className="space-y-6 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black gradient-text">Focus Timer</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Deep work sessions. {sessionCount > 0 && `${sessionCount} done today`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold gradient-text-gold">{totalMins}m</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>today</div>
          </div>
        </div>

        {/* Timer ring */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <XPPopup amount={XP_REWARDS.focus_session} trigger={xpTrigger} />
            <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="10" />
              <circle
                cx="100" cy="100" r="80"
                fill="none"
                stroke="url(#focus-grad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              <defs>
                <linearGradient id="focus-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
              <span className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
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
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedPreset === i && !customMin
                      ? 'text-white'
                      : ''
                  }`}
                  style={{
                    background: selectedPreset === i && !customMin ? 'var(--gradient)' : 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: selectedPreset === i && !customMin ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {!running && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Custom min"
                value={customMin}
                onChange={e => setCustomMin(e.target.value)}
                className="w-28 px-3 py-2 rounded-xl text-sm text-center"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                min={1}
                max={120}
              />
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            {!running ? (
              <button onClick={startTimer} className="btn-primary px-8">
                Start {sessionType === 'work' ? '🧠' : '☕'}
              </button>
            ) : (
              <>
                <button onClick={stopTimer} className="btn-secondary px-6">Pause</button>
                <button onClick={resetTimer} className="btn-secondary px-4">Reset</button>
              </>
            )}
          </div>
        </div>

        {/* Session history */}
        {sessions.length > 0 && (
          <div className="card p-4 space-y-3">
            <h3 className="font-bold text-sm">Today's Sessions</h3>
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{s.type === 'work' ? '🧠' : '☕'}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {s.type === 'work' ? 'Focus' : s.type === 'short-break' ? 'Short break' : 'Long break'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--text-muted)' }}>{s.durationMin}m</span>
                    {s.completedAt && <span className="text-xs text-emerald-500">✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card p-4 hero-gradient">
          <h3 className="font-bold text-sm mb-2">🧠 Focus Tips</h3>
          <ul className="space-y-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>• Put your phone face down during sessions</li>
            <li>• Complete 4 pomodoros, then take a long break</li>
            <li>• Single task — one thing at a time</li>
            <li>• Earn <span className="font-semibold" style={{ color: 'var(--accent-gold)' }}>+{XP_REWARDS.focus_session} XP</span> per work session</li>
          </ul>
        </div>
      </div>
    </PageTransition>
  );
}
