'use client';

import { useEffect, useState } from 'react';
import { useToast } from '../layout/ToastProvider';
import { XP_REWARDS } from '../../lib/xp';
import { XPPopup } from '../ui/XPPopup';

interface Goal {
  id: string;
  text: string;
  completed: boolean;
  carriedOver: boolean;
}

export function DailyGoals() {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [adding, setAdding] = useState(false);
  const [xpTrigger, setXpTrigger] = useState(0);

  useEffect(() => {
    fetch('/api/goals').then(r => r.json()).then(setGoals).catch(() => {});
  }, []);

  async function addGoal() {
    if (!newGoal.trim() || goals.length >= 5) return;
    setAdding(true);
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newGoal.trim() }),
    });
    const goal = await res.json();
    setGoals(prev => [...prev, goal]);
    setNewGoal('');
    setAdding(false);
  }

  async function toggleGoal(id: string, completed: boolean) {
    await fetch(`/api/goals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed } : g));
    if (completed) {
      await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: XP_REWARDS.goal_complete, reason: 'goal_complete' }),
      });
      setXpTrigger(t => t + 1);
      toast(`Goal done! +${XP_REWARDS.goal_complete} XP ⚡`, 'xp');
    }
  }

  async function deleteGoal(id: string) {
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    setGoals(prev => prev.filter(g => g.id !== id));
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">✅ Daily Goals</h3>
        <div className="relative">
          <XPPopup amount={XP_REWARDS.goal_complete} trigger={xpTrigger} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {goals.filter(g => g.completed).length}/{goals.length}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {goals.map(goal => (
          <div key={goal.id} className="flex items-center gap-2 group">
            <button
              onClick={() => toggleGoal(goal.id, !goal.completed)}
              className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                borderColor: goal.completed ? 'var(--accent-green)' : 'var(--border)',
                background: goal.completed ? 'var(--accent-green)' : 'transparent',
              }}
            >
              {goal.completed && <span className="text-white text-xs">✓</span>}
            </button>
            <span
              className="flex-1 text-sm"
              style={{
                color: goal.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                textDecoration: goal.completed ? 'line-through' : 'none',
              }}
            >
              {goal.text}
              {goal.carriedOver && (
                <span className="ml-1 text-xs" style={{ color: 'var(--text-muted)' }}>(carried)</span>
              )}
            </span>
            <button
              onClick={() => deleteGoal(goal.id)}
              className="opacity-0 group-hover:opacity-100 text-xs transition-opacity"
              style={{ color: 'var(--text-muted)' }}
            >
              ×
            </button>
          </div>
        ))}

        {goals.length === 0 && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            No goals yet. Add up to 5 goals for today.
          </p>
        )}
      </div>

      {goals.length < 5 && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a goal..."
            value={newGoal}
            onChange={e => setNewGoal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGoal()}
            className="flex-1 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={addGoal}
            disabled={adding || !newGoal.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--gradient)', color: 'white', opacity: adding || !newGoal.trim() ? 0.5 : 1 }}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
