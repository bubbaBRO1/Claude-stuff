'use client';
import * as faceapi from 'face-api.js';
import { scoreLandmarks, calcOverallScore, calcPotentialScore, generateSummary } from '../../lib/faceScoring';
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
