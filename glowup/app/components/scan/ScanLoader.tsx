'use client';
import { useEffect, useState } from 'react';

const STEPS = [
  'Detecting facial features...',
  'Analyzing bone structure...',
  'Measuring symmetry...',
  'Evaluating skin quality...',
  'Generating personalized tips...',
  'Calculating your potential...',
];

export default function ScanLoader() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      {/* Animated scan circles */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full animate-glow"
          style={{ border: '2px solid rgba(139,92,246,0.4)' }}
        />
        <div
          className="absolute rounded-full animate-scan"
          style={{
            inset: '12px',
            border: '2px solid var(--accent)',
            borderRadius: '50%',
          }}
        />
        <div className="text-4xl">🔍</div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-lg animate-pulse" style={{ color: 'var(--text-primary)' }}>
          {STEPS[step]}
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          This may take a few seconds
        </p>
      </div>
      {/* Progress dots */}
      <div className="flex gap-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{ background: i === step ? 'var(--accent)' : 'var(--border)' }}
          />
        ))}
      </div>
    </div>
  );
}
