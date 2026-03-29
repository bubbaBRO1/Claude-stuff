'use client';

import { useEffect, useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { useToast } from '../components/layout/ToastProvider';

export default function SettingsPage() {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [reminderTime, setReminderTime] = useState('07:00');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [waterGoal, setWaterGoal] = useState('8');

  useEffect(() => {
    setDisplayName(localStorage.getItem('glowup_name') ?? '');
    setReminderTime(localStorage.getItem('glowup_reminder') ?? '07:00');
    setTheme((localStorage.getItem('glowup_theme') as 'dark' | 'light') ?? 'dark');
    setWaterGoal(localStorage.getItem('glowup_water_goal') ?? '8');
  }, []);

  function save() {
    localStorage.setItem('glowup_name', displayName);
    localStorage.setItem('glowup_reminder', reminderTime);
    localStorage.setItem('glowup_theme', theme);
    localStorage.setItem('glowup_water_goal', waterGoal);
    document.documentElement.setAttribute('data-theme', theme);
    toast('Settings saved!', 'success');
  }

  function clearData() {
    if (!confirm('This will delete ALL your data (scans, routines, habits, XP). This cannot be undone.')) return;
    fetch('/api/session', { method: 'DELETE' })
      .then(() => {
        localStorage.clear();
        document.cookie = 'glowup_session=; max-age=0; path=/';
        window.location.href = '/';
      })
      .catch(() => toast('Failed to clear data', 'error'));
  }

  return (
    <PageTransition>
      <div className="space-y-6 py-2">
        <h1 className="text-2xl font-black gradient-text">Settings</h1>

        <div className="card p-4 space-y-4">
          <h3 className="font-bold text-sm">Profile</h3>
          <div className="space-y-2">
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Display Name</label>
            <input
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div className="card p-4 space-y-4">
          <h3 className="font-bold text-sm">Appearance</h3>
          <div className="flex gap-3">
            {(['dark', 'light'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all capitalize"
                style={{
                  background: theme === t ? 'var(--gradient)' : 'var(--bg-card)',
                  border: `1px solid ${theme === t ? 'transparent' : 'var(--border)'}`,
                  color: theme === t ? 'white' : 'var(--text-secondary)',
                }}
              >
                {t === 'dark' ? '🌙' : '☀️'} {t}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4 space-y-4">
          <h3 className="font-bold text-sm">Daily Goals</h3>
          <div className="space-y-2">
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Water Goal (glasses)</label>
            <input
              type="number"
              value={waterGoal}
              onChange={e => setWaterGoal(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              min={1}
              max={20}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Daily Reminder Time</label>
            <input
              type="time"
              value={reminderTime}
              onChange={e => setReminderTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <button onClick={save} className="btn-primary w-full">
          Save Settings ✓
        </button>

        <div className="card p-4 space-y-3" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <h3 className="font-bold text-sm" style={{ color: '#ef4444' }}>Danger Zone</h3>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Permanently delete all your data including scans, routines, habits, and XP progress.
          </p>
          <button
            onClick={clearData}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
          >
            Clear All Data
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
