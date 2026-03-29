'use client';
import { useEffect, useState, useRef } from 'react';
import PageHeader from '../../components/layout/PageHeader';

interface JournalEntry {
  id: string;
  createdAt: string;
  imageData: string;
  note: string | null;
  mood: number | null;
}

const MOOD_LABELS = ['', '😞', '😕', '😐', '🙂', '😁'];

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [adding, setAdding] = useState(false);
  const [imageData, setImageData] = useState('');
  const [note, setNote] = useState('');
  const [mood, setMood] = useState(3);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetch('/api/journal').then(r => r.json()).then(setEntries);
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setImageData(e.target!.result as string);
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    streamRef.current = s;
    setCameraOn(true);
    if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
  };

  const capture = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')!.drawImage(v, 0, 0);
    setImageData(c.toDataURL('image/jpeg', 0.8));
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraOn(false);
  };

  const save = async () => {
    if (!imageData) return;
    setSaving(true);
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData, note, mood }),
    });
    const entry = await res.json();
    setEntries(prev => [entry, ...prev]);
    setAdding(false);
    setImageData('');
    setNote('');
    setMood(3);
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Progress Journal" backHref="/confidence" />

      <button className="btn-primary w-full py-3" onClick={() => setAdding(true)}>
        + Add Entry
      </button>

      {adding && (
        <div className="card p-4 space-y-4">
          <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>New Entry</h3>

          {cameraOn ? (
            <div>
              <video ref={videoRef} className="w-full rounded-xl" playsInline muted />
              <button className="btn-primary w-full mt-2 py-2" onClick={capture}>📸 Capture</button>
            </div>
          ) : imageData ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageData} alt="Preview" className="w-full rounded-xl" />
              <button
                className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs"
                style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
                onClick={() => setImageData('')}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-secondary py-3" onClick={() => fileRef.current?.click()}>🖼️ Photo</button>
              <button className="btn-secondary py-3" onClick={startCamera}>📷 Camera</button>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>How do you feel today?</label>
            <div className="flex justify-between">
              {[1,2,3,4,5].map(m => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className="text-2xl p-2 rounded-xl transition-all"
                  style={{ background: mood === m ? 'var(--bg-card-hover)' : 'transparent', border: `1px solid ${mood === m ? 'var(--accent)' : 'transparent'}` }}
                >
                  {MOOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          <textarea
            placeholder="Notes, observations, goals..."
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-xl px-3 py-2 text-sm resize-none"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />

          <div className="grid grid-cols-2 gap-2">
            <button className="btn-secondary py-2" onClick={() => { setAdding(false); setImageData(''); }}>Cancel</button>
            <button className="btn-primary py-2" onClick={save} disabled={!imageData || saving}>
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📷</div>
          <p style={{ color: 'var(--text-secondary)' }}>No entries yet. Start documenting your transformation!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entry.imageData} alt="Journal" className="w-full" style={{ maxHeight: 300, objectFit: 'cover' }} />
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {entry.mood && <span className="text-lg">{MOOD_LABELS[entry.mood]}</span>}
                </div>
                {entry.note && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{entry.note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
