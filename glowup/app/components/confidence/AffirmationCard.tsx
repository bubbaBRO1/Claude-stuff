'use client';
import { useState } from 'react';
import { AFFIRMATIONS, getDailyAffirmation } from '../../lib/affirmations';

export default function AffirmationCard() {
  const [index, setIndex] = useState<number | null>(null);

  const daily = getDailyAffirmation();
  const current = index === null ? daily : AFFIRMATIONS[index % AFFIRMATIONS.length];

  const next = () => {
    setIndex((prev) => {
      const base = prev === null ? AFFIRMATIONS.indexOf(daily) : prev;
      return (base + 1) % AFFIRMATIONS.length;
    });
  };

  return (
    <div
      className="card card-glow p-6 space-y-4 text-center"
      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08))' }}
    >
      <div className="text-3xl">💬</div>
      <p className="text-base font-medium leading-relaxed italic" style={{ color: 'var(--text-primary)' }}>
        &ldquo;{current}&rdquo;
      </p>
      <button
        onClick={next}
        className="text-sm px-4 py-2 rounded-xl transition-all"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
      >
        Next affirmation →
      </button>
    </div>
  );
}
