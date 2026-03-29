'use client';

import { useEffect, useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { useToast } from '../components/layout/ToastProvider';
import { useTheme } from '../components/layout/ThemeProvider';

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, toggle } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [waterGoal, setWaterGoal] = useState('8');

  useEffect(() => {
    setDisplayName(localStorage.getItem('glowup_name') ?? '');
    setWaterGoal(localStorage.getItem('glowup_water_goal') ?? '8');
  }, []);

  function save() {
    localStorage.setItem('glowup_name', displayName);
    localStorage.setItem('glowup_water_goal', waterGoal);
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
      <div className="space-y-5 py-2">
        <h1 className="text-xl font-black gradient-text">Settings</h1>

        {/* Profile */}
        <div className="card p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Profile</h3>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>Display Name</label>
            <input
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Appearance */}
        <div className="card p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Appearance</h3>
          <div className="flex gap-2">
            <button
              onClick={() => { if (theme !== 'dark') toggle(); }}
              className="flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              style={{
                background: theme === 'dark' ? 'rgba(16,185,129,0.1)' : 'var(--bg-tertiary)',
                border: `1px solid ${theme === 'dark' ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                color: theme === 'dark' ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Dark
            </button>
            <button
              onClick={() => { if (theme !== 'light') toggle(); }}
              className="flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              style={{
                background: theme === 'light' ? 'rgba(16,185,129,0.1)' : 'var(--bg-tertiary)',
                border: `1px solid ${theme === 'light' ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                color: theme === 'light' ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Light
            </button>
          </div>
        </div>

        {/* Goals */}
        <div className="card p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Daily Goals</h3>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>Water Goal (glasses)</label>
            <input
              type="number"
              value={waterGoal}
              onChange={e => setWaterGoal(e.target.value)}
              className="input"
              min={1}
              max={20}
            />
          </div>
        </div>

        <button onClick={save} className="btn-primary w-full py-3 text-sm font-bold">
          Save Settings
        </button>

        {/* Links */}
        <div className="card p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Navigation</h3>
          {[
            { href: '/scan/history', label: 'Scan History', icon: '📊' },
            { href: '/achievements', label: 'Achievements', icon: '🏆' },
            { href: '/rank', label: 'Rank Ladder', icon: '⚡' },
            { href: '/shop', label: 'Product Shop', icon: '🛍️' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 py-2 text-xs"
              style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
            >
              <span>{link.icon}</span>
              <span className="flex-1">{link.label}</span>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>

        {/* Danger */}
        <div className="card p-4 space-y-3" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#ef4444' }}>Danger Zone</h3>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Permanently delete all data including scans, routines, habits, and XP.
          </p>
          <button
            onClick={clearData}
            className="w-full py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
          >
            Clear All Data
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
