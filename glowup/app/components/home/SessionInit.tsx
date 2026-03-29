'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SessionInit() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    await fetch('/api/session', { method: 'POST' });
    router.refresh();
  }

  return (
    <button
      onClick={start}
      disabled={loading}
      className="btn-primary px-8 py-3 text-lg"
    >
      {loading ? 'Setting up...' : 'Get Started'}
    </button>
  );
}
