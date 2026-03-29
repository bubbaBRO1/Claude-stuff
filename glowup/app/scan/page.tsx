'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '../components/layout/PageHeader';
import FaceScanner from '../components/scan/FaceScanner';
import ScanLoader from '../components/scan/ScanLoader';
import { analyzeImage } from '../components/scan/AnalysisEngine';

export default function ScanPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'scanning' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleCapture = async (imageDataUrl: string) => {
    setStatus('scanning');
    setError('');
    try {
      const result = await analyzeImage(imageDataUrl);
      if (!result) {
        setStatus('error');
        setError('No face detected. Please use a clear, well-lit, front-facing photo.');
        return;
      }
      // Store result in sessionStorage for results page
      sessionStorage.setItem('lastAnalysis', JSON.stringify(result));
      router.push(`/scan/results/${result.id}`);
    } catch (e) {
      console.error(e);
      setStatus('error');
      setError('Analysis failed. Please try again with a different photo.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Face Scan"
        subtitle="Get your personalized appearance rating"
      />

      {status === 'scanning' ? (
        <ScanLoader />
      ) : (
        <div className="space-y-6">
          <FaceScanner onCapture={handleCapture} />

          {status === 'error' && (
            <div
              className="p-4 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Tips */}
          <div className="card p-4 space-y-2">
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>📋 Photo Tips for Best Results</p>
            {['Face the camera directly — no angles', 'Good, even lighting (natural light is best)', 'Hair pulled back to see your full face', 'Neutral expression', 'High resolution photo'].map((tip) => (
              <div key={tip} className="flex gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--accent)' }}>✓</span> {tip}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
