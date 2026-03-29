'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  score: number;
  potential?: number;
  size?: number;
  label?: string;
}

export default function ScoreRing({ score, potential, size = 160, label = 'Score' }: Props) {
  const [displayScore, setDisplayScore] = useState(0);
  const [displayPotential, setDisplayPotential] = useState(0);
  const raf = useRef<number | null>(null);

  const R = size / 2 - 14;
  const C = 2 * Math.PI * R;

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayScore(score * ease);
      if (potential) setDisplayPotential(potential * ease);
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [score, potential]);

  const scoreOffset = C - (displayScore / 10) * C;
  const potentialOffset = C - ((displayPotential || displayScore) / 10) * C;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth={10} />
        {/* Potential ring (dashed gold) */}
        {potential && (
          <circle
            cx={size / 2} cy={size / 2} r={R}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={8}
            strokeDasharray={`${potentialOffset > 0 ? C - potentialOffset : C} ${C}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            opacity={0.45}
          />
        )}
        {/* Current score ring */}
        <circle
          cx={size / 2} cy={size / 2} r={R}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={10}
          strokeDasharray={`${C} ${C}`}
          strokeDashoffset={scoreOffset}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold gradient-text">{displayScore.toFixed(1)}</span>
        <span className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        {potential && (
          <span className="text-xs mt-0.5 gradient-text-gold">→ {displayPotential.toFixed(1)}</span>
        )}
      </div>
    </div>
  );
}
