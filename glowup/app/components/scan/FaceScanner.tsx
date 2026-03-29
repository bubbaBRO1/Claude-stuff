'use client';
import { useRef, useState, useCallback } from 'react';

interface Props {
  onCapture: (imageDataUrl: string) => void;
}

export default function FaceScanner({ onCapture }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'idle' | 'camera'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
      setStream(s);
      setMode('camera');
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
      }
    } catch {
      alert('Camera access denied. Please upload a photo instead.');
    }
  };

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setMode('idle');
  }, [stream]);

  const captureFromCamera = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopCamera();
    onCapture(dataUrl);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    const reader = new FileReader();
    reader.onload = (e) => onCapture(e.target!.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {mode === 'camera' ? (
        <div className="relative rounded-2xl overflow-hidden" style={{ border: '2px solid var(--accent)' }}>
          <video ref={videoRef} className="w-full" playsInline muted />
          {/* Face guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="rounded-full animate-glow"
              style={{
                width: '55%',
                aspectRatio: '3/4',
                border: '2px dashed rgba(139,92,246,0.6)',
                borderRadius: '50% 50% 45% 45%',
              }}
            />
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
            <button className="btn-secondary flex-1 py-2" onClick={stopCamera}>Cancel</button>
            <button className="btn-primary flex-1 py-2" onClick={captureFromCamera}>📸 Capture</button>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-2xl p-10 text-center transition-all cursor-pointer ${dragOver ? 'card-glow' : ''}`}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
            background: dragOver ? 'var(--bg-card-hover)' : 'var(--bg-card)',
          }}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
        >
          <div className="text-5xl mb-3 animate-float">📸</div>
          <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Drop a photo or tap to upload</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>For best results, use a clear front-facing photo in good lighting</p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {mode === 'idle' && (
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-secondary py-3" onClick={() => fileRef.current?.click()}>
            🖼️ Upload Photo
          </button>
          <button className="btn-primary py-3" onClick={startCamera}>
            📷 Use Camera
          </button>
        </div>
      )}
    </div>
  );
}
