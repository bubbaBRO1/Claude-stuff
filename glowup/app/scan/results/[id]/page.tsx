'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '../../../components/layout/PageHeader';
import ScoreRing from '../../../components/ui/ScoreRing';
import FeatureCard from '../../../components/scan/FeatureCard';
import type { FaceAnalysis } from '../../../types/analysis';

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<FaceAnalysis | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Try sessionStorage first (just scanned)
    const cached = sessionStorage.getItem('lastAnalysis');
    if (cached) {
      const parsed = JSON.parse(cached) as FaceAnalysis;
      if (parsed.id === id) {
        setAnalysis(parsed);
        setLoaded(true);
        return;
      }
    }
    // Fallback: fetch from API
    fetch('/api/analysis')
      .then((r) => r.json())
      .then((list) => {
        const found = list.find((a: { id: string; featuresJson: string }) => a.id === id);
        if (found) {
          setAnalysis({ ...found, features: JSON.parse(found.featuresJson) });
        }
        setLoaded(true);
      });
  }, [id]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-float">✨</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading results...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-20">
        <p style={{ color: 'var(--text-secondary)' }}>Results not found</p>
        <Link href="/scan" className="btn-primary mt-4 inline-block">Scan Again</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader title="Your Results" backHref="/scan" />

      {/* Hero scores */}
      <div className="card card-glow p-6 text-center space-y-4">
        <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Overall Appearance Rating</h2>
        <div className="flex justify-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={analysis.overallScore} potential={analysis.potentialScore} size={160} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="gradient-text font-semibold">Current</span> &rarr; <span className="gradient-text-gold font-semibold">Potential</span>
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{analysis.summary}</p>
      </div>

      {/* Top 3 quick wins */}
      <div className="card p-4 space-y-3">
        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>🎯 Quick Wins</h3>
        {analysis.topRecommendations.map((tip, i) => (
          <div key={i} className="flex gap-3 items-start">
            <span
              className="text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'var(--gradient)', color: 'white' }}
            >
              {i + 1}
            </span>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{tip}</p>
          </div>
        ))}
      </div>

      {/* Feature breakdown */}
      <div>
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>📊 Feature Breakdown</h3>
        <div className="space-y-3">
          {analysis.features.map((f) => (
            <FeatureCard key={f.key} feature={f} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="grid grid-cols-2 gap-3 pb-4">
        <Link href="/shop" className="btn-secondary py-3 text-center text-sm">🛍️ Shop Products</Link>
        <Link href="/routine" className="btn-primary py-3 text-center text-sm">☀️ Start Routine</Link>
      </div>
    </div>
  );
}
