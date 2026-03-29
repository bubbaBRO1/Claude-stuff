export interface FeatureScore {
  key: string;
  label: string;
  score: number;
  potentialScore: number;
  emoji: string;
  finding: string;
  tips: string[];
  productTags: string[];
}

export interface FaceAnalysis {
  id: string;
  createdAt: string;
  overallScore: number;
  potentialScore: number;
  features: FeatureScore[];
  summary: string;
  topRecommendations: string[];
}

export const FEATURE_KEYS = [
  'symmetry',
  'skin',
  'eyes',
  'jawline',
  'hair',
  'grooming',
  'brows',
  'lips',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];
