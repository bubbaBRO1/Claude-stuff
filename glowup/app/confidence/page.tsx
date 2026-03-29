'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '../components/layout/PageHeader';
import AffirmationCard from '../components/confidence/AffirmationCard';
import HabitRow from '../components/confidence/HabitRow';
import { useToast } from '../components/layout/ToastProvider';
import { XP_REWARDS } from '../lib/xp';
import type { Habit } from '../types/habit';
import { HABIT_CATEGORIES } from '../types/habit';

export default function ConfidencePage() {
  const { toast } = useToast();
  const [habits, setHabits] = useState<(Habit & { completedToday: boolean })[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('⭐');
  const [newCategory, setNewCategory] = useState('general');

  useEffect(() => {
    fetch('/api/habits').then(r => r.json()).then(setHabits);
  }, []);

  const handleUpdate = async (id: string, completed: boolean) => {
    setHabits(prev => {
      const updated = prev.map(h => h.id === id ? { ...h, completedToday: completed } : h);
      if (completed) {
        // Check if all habits are now completed
        const allDone = updated.every(h => h.completedToday);
        // Award XP async
        fetch('/api/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: XP_REWARDS.habit_check, reason: 'habit_check' }),
        });
        toast(`Habit done! +${XP_REWARDS.habit_check} XP ⚡`, 'xp');
        if (allDone && updated.length > 0) {
          fetch('/api/xp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: XP_REWARDS.all_habits, reason: 'all_habits' }),
          });
          setTimeout(() => toast(`All habits complete! +${XP_REWARDS.all_habits} XP bonus! 🎯`, 'xp'), 500);
        }
      }
      return updated;
    });
  };

  const addHabit = async () => {
    if (!newName.trim()) return;
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), icon: newIcon, category: newCategory }),
    });
    const habit = await res.json();
    setHabits(prev => [...prev, { ...habit, logs: [], completedToday: false }]);
    setNewName('');
    setAdding(false);
  };

  const completedCount = habits.filter(h => h.completedToday).length;

  return (
    <div className="space-y-5">
      <PageHeader title="Confidence Builder" subtitle="Build habits. Build you." />

      <AffirmationCard />

      {/* Habit progress */}
      {habits.length > 0 && (
        <div className="card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Today&apos;s habits: {completedCount}/{habits.length}
            </span>
            <span className="text-sm font-bold gradient-text">
              {Math.round((completedCount / habits.length) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / habits.length) * 100}%`, background: 'var(--gradient)' }}
            />
          </div>
        </div>
      )}

      {/* Habits list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Daily Habits</h3>
          <button
            onClick={() => setAdding(!adding)}
            className="text-sm px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            + Add
          </button>
        </div>

        {adding && (
          <div className="card p-4 space-y-3">
            <input
              placeholder="Habit name (e.g. Drink water)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onKeyDown={e => e.key === 'Enter' && addHabit()}
            />
            <div className="flex gap-2 flex-wrap">
              {HABIT_CATEGORIES.map(c => (
                <button
                  key={c.key}
                  onClick={() => setNewCategory(c.key)}
                  className="text-xs px-2 py-1 rounded-full transition-all"
                  style={{
                    background: newCategory === c.key ? c.color : 'var(--bg-card)',
                    color: newCategory === c.key ? 'white' : 'var(--text-secondary)',
                    border: '1px solid',
                    borderColor: newCategory === c.key ? c.color : 'var(--border)',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-secondary py-2 text-sm" onClick={() => setAdding(false)}>Cancel</button>
              <button className="btn-primary py-2 text-sm" onClick={addHabit}>Add Habit</button>
            </div>
          </div>
        )}

        {habits.map(h => (
          <HabitRow key={h.id} habit={h} onUpdate={handleUpdate} />
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/confidence/journal" className="card p-4 text-center space-y-1 block">
          <div className="text-2xl">📸</div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Progress Journal</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Track your transformation</p>
        </Link>
        <Link href="/scan" className="card p-4 text-center space-y-1 block">
          <div className="text-2xl">✨</div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Scan Your Face</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Get your rating</p>
        </Link>
      </div>

      {/* Confidence tips */}
      <div className="card p-4 space-y-3">
        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>💡 Confidence Tips</h3>
        {[
          { icon: '🧠', tip: 'Stand tall — posture is the fastest confidence hack' },
          { icon: '👀', tip: 'Make eye contact when you speak to others' },
          { icon: '🗣️', tip: 'Speak slower and more deliberately' },
          { icon: '💪', tip: 'Regular exercise increases confidence by 30%+' },
          { icon: '🪞', tip: 'Tell yourself something positive when you see a mirror' },
        ].map(({ icon, tip }) => (
          <div key={tip} className="flex gap-3 text-sm">
            <span>{icon}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
