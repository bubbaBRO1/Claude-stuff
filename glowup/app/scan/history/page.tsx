'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageTransition } from '../../components/layout/PageTransition';

interface Analysis {
  id: string;
  createdAt: string;
  overallScore: number;
  potentialScore: number;
  summary: string;
}

export default function ScanHistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analysis')
      .then(r => r.json())
      .then(d => { setAnalyses(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <PageTransition>
      <div className="space-y-5 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black gradient-text">Scan History</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {analyses.length} scan{analyses.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <Link href="/scan" className="btn-primary px-4 py-2 text-sm">New Scan</Link>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4 flex gap-4">
                <div className="skeleton w-14 h-14 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-1/4" />
                  <div className="skeleton h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && analyses.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📷</div>
            <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No scans yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Complete your first face scan to see your history</p>
            <Link href="/scan" className="btn-primary px-6 py-2.5 mt-4 inline-block text-sm">Start Scanning</Link>
          </div>
        )}

        <div className="space-y-3">
          {analyses.map((a, i) => {
            const prev = analyses[i + 1];
            const diff = prev ? a.overallScore - prev.overallScore : null;
            return (
              <Link
                key={a.id}
                href={`/scan/results/${a.id}`}
                className="card p-4 flex items-center gap-4 block"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1))' }}
                >
                  <span className="text-xl font-black gradient-text">{a.overallScore}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{a.overallScore}/10</span>
                    {diff !== null && (
                      <span
                        className="text-xs font-medium"
                        style={{ color: diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : 'var(--text-muted)' }}
                      >
                        {diff > 0 ? `+${diff.toFixed(1)}` : diff < 0 ? diff.toFixed(1) : '='}
                      </span>
                    )}
                    <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                      Potential: <span className="gradient-text-gold font-bold">{a.potentialScore}/10</span>
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                    {a.summary}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span style={{ color: 'var(--text-muted)' }}>›</span>
              </Link>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
