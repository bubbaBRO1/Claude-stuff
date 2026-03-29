'use client';

import { useEffect, useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { useToast } from '../components/layout/ToastProvider';
import { XPPopup } from '../components/ui/XPPopup';
import { XP_REWARDS } from '../lib/xp';

interface SleepLog {
  id: string;
  dateKey: string;
  hours: number;
  quality: number;
}

interface WaterLog {
  id: string;
  dateKey: string;
  glasses: number;
}

const WATER_GOAL = 8;

export default function HealthPage() {
  const { toast } = useToast();
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [todaySleep, setTodaySleep] = useState<SleepLog | null>(null);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [todayWater, setTodayWater] = useState(0);
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState(3);
  const [savingSleep, setSavingSleep] = useState(false);
  const [sleepXpTrigger, setSleepXpTrigger] = useState(0);
  const [waterXpTrigger, setWaterXpTrigger] = useState(0);

  async function loadData() {
    const [sleepRes, waterRes] = await Promise.all([
      fetch('/api/health/sleep').then(r => r.json()),
      fetch('/api/health/water').then(r => r.json()),
    ]);
    setSleepLogs(sleepRes.logs ?? []);
    setTodaySleep(sleepRes.todayLog);
    setWaterLogs(waterRes.logs ?? []);
    setTodayWater(waterRes.todayLog?.glasses ?? 0);
  }

  useEffect(() => { loadData(); }, []);

  async function saveSleep() {
    const h = parseFloat(sleepHours);
    if (isNaN(h) || h < 1 || h > 24) return;
    setSavingSleep(true);
    await fetch('/api/health/sleep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours: h, quality: sleepQuality }),
    });
    const isNew = !todaySleep;
    if (isNew) {
      await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: XP_REWARDS.sleep_log, reason: 'sleep_log' }),
      });
      setSleepXpTrigger(t => t + 1);
      toast(`Sleep logged! +${XP_REWARDS.sleep_log} XP ⚡`, 'xp');
    } else {
      toast('Sleep log updated!', 'success');
    }
    await loadData();
    setSleepHours('');
    setSavingSleep(false);
  }

  async function addGlass() {
    const prevGlasses = todayWater;
    await fetch('/api/health/water/increment', { method: 'POST' });
    const newGlasses = prevGlasses + 1;
    setTodayWater(newGlasses);
    if (newGlasses === WATER_GOAL) {
      await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: XP_REWARDS.water_target, reason: 'water_target' }),
      });
      setWaterXpTrigger(t => t + 1);
      toast(`Daily water goal hit! +${XP_REWARDS.water_target} XP 💧`, 'xp');
    }
  }

  const sleepAvg = sleepLogs.length > 0
    ? (sleepLogs.reduce((s, l) => s + l.hours, 0) / sleepLogs.length).toFixed(1)
    : '—';

  return (
    <PageTransition>
      <div className="space-y-6 py-2">
        <h1 className="text-2xl font-black gradient-text">Health Tracker</h1>

        {/* Water section */}
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">💧 Water Intake</h3>
            <div className="relative">
              <WaterXpAnchor trigger={waterXpTrigger} amount={XP_REWARDS.water_target} />
              <span className="text-xl font-black gradient-text">{todayWater}/{WATER_GOAL}</span>
            </div>
          </div>

          {/* Glass indicators */}
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: WATER_GOAL }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-10 rounded-lg border-2 flex items-end overflow-hidden transition-all"
                style={{
                  borderColor: i < todayWater ? '#3b82f6' : 'var(--border)',
                  background: i < todayWater ? 'rgba(59,130,246,0.15)' : 'transparent',
                }}
              >
                {i < todayWater && (
                  <div className="w-full h-full flex items-center justify-center text-base">💧</div>
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(todayWater / WATER_GOAL * 100, 100)}%`,
                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
              }}
            />
          </div>

          <button
            onClick={addGlass}
            disabled={todayWater >= WATER_GOAL}
            className="btn-primary w-full text-sm"
            style={todayWater >= WATER_GOAL ? { opacity: 0.5 } : {}}
          >
            {todayWater >= WATER_GOAL ? '🎉 Goal reached!' : '+ Add a glass'}
          </button>
        </div>

        {/* Sleep section */}
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">😴 Sleep Log</h3>
            <div className="relative">
              <SleepXpAnchor trigger={sleepXpTrigger} amount={XP_REWARDS.sleep_log} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                avg {sleepAvg}h
              </span>
            </div>
          </div>

          {todaySleep ? (
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(139,92,246,0.08)' }}>
              <div className="text-3xl font-black gradient-text">{todaySleep.hours}h</div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Quality: {'⭐'.repeat(todaySleep.quality)}
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Logged today</p>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No sleep logged today</p>
          )}

          <div className="space-y-3">
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Hours (e.g. 7.5)"
                value={sleepHours}
                onChange={e => setSleepHours(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                min={1}
                max={24}
                step={0.5}
              />
            </div>
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Quality</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(q => (
                  <button
                    key={q}
                    onClick={() => setSleepQuality(q)}
                    className="text-xl transition-transform"
                    style={{ opacity: q <= sleepQuality ? 1 : 0.3, transform: q <= sleepQuality ? 'scale(1.1)' : 'scale(1)' }}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={saveSleep}
              disabled={savingSleep || !sleepHours}
              className="btn-primary w-full text-sm"
              style={savingSleep || !sleepHours ? { opacity: 0.5 } : {}}
            >
              {savingSleep ? 'Saving...' : todaySleep ? 'Update Sleep' : 'Log Sleep 😴'}
            </button>
          </div>
        </div>

        {/* Sleep history */}
        {sleepLogs.length > 1 && (
          <div className="card p-4 space-y-3">
            <h3 className="font-bold text-sm">Sleep History</h3>
            <div className="space-y-2">
              {sleepLogs.slice(0, 7).map(log => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>{log.dateKey}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{log.hours}h</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {'⭐'.repeat(log.quality)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function WaterXpAnchor({ trigger, amount }: { trigger: number; amount: number }) {
  return (
    <div className="relative inline-block">
      <XPPopup amount={amount} trigger={trigger} />
    </div>
  );
}

function SleepXpAnchor({ trigger, amount }: { trigger: number; amount: number }) {
  return (
    <div className="relative inline-block">
      <XPPopup amount={amount} trigger={trigger} />
    </div>
  );
}
