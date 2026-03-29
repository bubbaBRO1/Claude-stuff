import type { FeatureScore } from '../../types/analysis';

interface Props { feature: FeatureScore; }

const COLOR = {
  Excellent: '#10b981',
  Good: '#8b5cf6',
  Average: '#f59e0b',
  'Needs Work': '#ef4444',
  'Significant Opportunity': '#dc2626',
};

export default function FeatureCard({ feature }: Props) {
  const pct = (feature.score / 10) * 100;
  const color = COLOR[feature.finding.split(' — ')[0] as keyof typeof COLOR] || '#8b5cf6';

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{feature.emoji}</span>
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{feature.label}</span>
        </div>
        <div className="text-right">
          <span className="font-bold text-lg" style={{ color }}>{feature.score}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/10</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>

      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{feature.finding}</p>

      {/* Tips */}
      <ul className="space-y-1">
        {feature.tips.map((tip, i) => (
          <li key={i} className="flex gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--accent)' }}>→</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>

      {/* Potential score */}
      <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Your potential</span>
        <span className="text-sm font-bold gradient-text-gold">{feature.potentialScore}/10</span>
      </div>
    </div>
  );
}
