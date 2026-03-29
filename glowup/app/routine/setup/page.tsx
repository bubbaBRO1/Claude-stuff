'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '../../components/layout/PageHeader';
import type { RoutineStep } from '../../types/routine';

const ICONS = ['💧', '🧼', '🧴', '🦷', '💇', '👔', '⭐', '💪', '🧘', '📚', '☕', '🥗', '🏃', '🪥', '🧖'];

export default function SetupPage() {
  const router = useRouter();
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [name, setName] = useState('Morning Routine');
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('0');
  const [newIcon, setNewIcon] = useState('⭐');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/routines').then(r => r.json()).then(data => {
      setSteps(data.steps ?? []);
      setName(data.name ?? 'Morning Routine');
    });
  }, []);

  const addStep = () => {
    if (!newTitle.trim()) return;
    const step: RoutineStep = {
      id: `new-${Date.now()}`,
      order: steps.length,
      title: newTitle.trim(),
      icon: newIcon,
      durationSec: parseInt(newDuration) || 0,
      isActive: true,
    };
    setSteps(prev => [...prev, step]);
    setNewTitle('');
    setNewDuration('0');
    setAdding(false);
  };

  const removeStep = (id: string) => setSteps(prev => prev.filter(s => s.id !== id));
  const moveUp = (i: number) => { if (i === 0) return; const s = [...steps]; [s[i-1], s[i]] = [s[i], s[i-1]]; setSteps(s); };
  const moveDown = (i: number) => { if (i === steps.length - 1) return; const s = [...steps]; [s[i], s[i+1]] = [s[i+1], s[i]]; setSteps(s); };

  const save = async () => {
    setSaving(true);
    await fetch('/api/routines', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, steps }),
    });
    setSaving(false);
    router.push('/routine');
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Customize Routine" backHref="/routine" />

      <div className="card p-4 space-y-2">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Routine Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-sm"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={step.id} className="card p-3 flex items-center gap-3">
            <span className="text-lg">{step.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{step.title}</p>
              {step.durationSec > 0 && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{step.durationSec}s timer</p>
              )}
            </div>
            <div className="flex gap-1">
              <button onClick={() => moveUp(i)} className="p-1 text-xs rounded" style={{ color: 'var(--text-secondary)' }}>↑</button>
              <button onClick={() => moveDown(i)} className="p-1 text-xs rounded" style={{ color: 'var(--text-secondary)' }}>↓</button>
              <button onClick={() => removeStep(step.id)} className="p-1 text-xs rounded" style={{ color: '#ef4444' }}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="card p-4 space-y-3">
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>New Step</p>
          <input
            placeholder="Step name (e.g. Cold Shower)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Timer (seconds, 0 = none)</label>
              <input
                type="number"
                min="0"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm mt-1"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Icon</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setNewIcon(ic)}
                  className="text-xl p-1.5 rounded-lg"
                  style={{ background: newIcon === ic ? 'var(--accent)' : 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-secondary py-2" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn-primary py-2" onClick={addStep}>Add Step</button>
          </div>
        </div>
      ) : (
        <button className="btn-secondary w-full py-3" onClick={() => setAdding(true)}>+ Add Step</button>
      )}

      <button className="btn-primary w-full py-4 text-lg font-bold" onClick={save} disabled={saving}>
        {saving ? 'Saving...' : '✓ Save Routine'}
      </button>
    </div>
  );
}
