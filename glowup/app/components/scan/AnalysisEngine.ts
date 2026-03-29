'use client';
import * as faceapi from 'face-api.js';
import { scoreLandmarks, calcOverallScore, calcPotentialScore, generateSummary } from '../../lib/faceScoring';
import { XP_REWARDS } from '../../lib/xp';
import type { FaceAnalysis } from '../../types/analysis';

let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;
  const MODEL_URL = '/models';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

export async function analyzeImage(imageDataUrl: string): Promise<FaceAnalysis | null> {
  await loadModels();

  const img = new Image();
  img.src = imageDataUrl;
  await new Promise<void>((res) => { img.onload = () => res(); });

  const detection = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }))
    .withFaceLandmarks();

  if (!detection) return null;

  const landmarks = detection.landmarks.positions;
  const detectionScore = detection.detection.score;

  const features = scoreLandmarks(landmarks, detectionScore);
  const overallScore = calcOverallScore(features);
  const potentialScore = calcPotentialScore(features);
  const summary = generateSummary(overallScore, potentialScore, features);
  const topRecommendations = features
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((f) => f.tips[0]);

  // Save to API
  const res = await fetch('/api/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ overallScore, potentialScore, featuresJson: features, summary }),
  });
  const saved = await res.json();

  // Award XP for scan
  await fetch('/api/xp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: XP_REWARDS.scan, reason: 'scan' }),
  });

  // Check for score improvement vs previous scan and award bonus
  try {
    const histRes = await fetch('/api/analysis');
    const histData = await histRes.json();
    const analysesList = Array.isArray(histData) ? histData : (histData.analyses ?? []);
    if (analysesList.length >= 2) {
      const sorted = [...analysesList].sort(
        (a: { createdAt: string }, b: { createdAt: string }) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const prev = sorted[sorted.length - 2] as { overallScore: number };
      if (overallScore >= prev.overallScore + 1) {
        await fetch('/api/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: XP_REWARDS.scan_improvement, reason: 'scan_improvement' }),
        });
      }
    }
  } catch {
    // ignore
  }

  // Store weakest feature tags for "For You" shop recommendations
  const weakestTags = [...features]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(f => f.key.toLowerCase());
  try {
    localStorage.setItem('glowup_weak_tags', JSON.stringify(weakestTags));
  } catch {
    // ignore
  }

  return {
    id: saved.id,
    createdAt: saved.createdAt,
    overallScore,
    potentialScore,
    features,
    summary,
    topRecommendations,
  };
}
