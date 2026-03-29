'use client';
import { useState } from 'react';
import { toDateKey, calcStreak } from '../../lib/streak';
import type { Habit } from '../../types/habit';

interface Props { habit: Habit; onUpdate: (id: string, completed: boolean) => void; }

const CATEGORY_COLORS: Record<string, string> = {
  grooming: '#8B5CF6',
  skincare: '#EC4899',
  fitness: '#10B981',
  diet: '#F59E0B',
  mental: '#3B82F6',
  general: '#6B7280',
};

export default function HabitRow({ habit, onUpdate }: Props) {
  const today = toDateKey();
  const [optimistic, setOptimistic] = useState(habit.logs.includes(today));
  const streak = calcStreak(habit.logs);
  const color = CATEGORY_COLORS[habit.category] || '#8B5CF6';

  const toggle = async () => {
    const next = !optimistic;
    setOptimistic(next);
    onUpdate(habit.id, next);
    await fetch(`/api/habits/${habit.id}/log`, { method: next ? 'POST' : 'DELETE' });
  };

  // Last 14 days mini grid
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = toDateKey(d);
    const done = key === today ? optimistic : habit.logs.includes(key);
    return { key, done };
  });

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-all"
          style={{
            background: optimistic ? color : 'var(--bg-card)',
            border: `2px solid ${optimistic ? color : 'var(--border)'}`,
          }}
        >
          {optimistic ? '✓' : habit.icon}
        </button>
        <div className="flex-1">
          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{habit.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{habit.category}</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <span>🔥</span>
            <span className="font-bold" style={{ color: '#f59e0b' }}>{streak}</span>
          </div>
        )}
      </div>

      {/* 14-day mini grid */}
      <div className="flex gap-1">
        {days.map((d) => (
          <div
            key={d.key}
            className="flex-1 h-2 rounded-sm"
            style={{ background: d.done ? color : 'var(--border)', opacity: d.done ? 1 : 0.4 }}
            title={d.key}
          />
        ))}
      </div>
    </div>
  );
}
