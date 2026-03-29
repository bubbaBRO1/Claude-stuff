interface Props { streak: number; }

export default function StreakBadge({ streak }: Props) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}
    >
      <span className="text-lg">🔥</span>
      <div>
        <span className="font-bold gradient-text-gold">{streak}</span>
        <span className="text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>
          {streak === 1 ? 'day streak' : 'day streak'}
        </span>
      </div>
    </div>
  );
}
