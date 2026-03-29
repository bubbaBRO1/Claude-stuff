import type { FeatureScore } from '../types/analysis';

// face-api.js returns 68 facial landmarks as {x, y} points
// Standard 68-point landmark indices:
// Jaw: 0-16, RightBrow: 17-21, LeftBrow: 22-26
// Nose: 27-35, RightEye: 36-41, LeftEye: 42-47
// OuterLips: 48-59, InnerLips: 60-67

interface Point {
  x: number;
  y: number;
}

function dist(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function clamp(val: number, min = 1, max = 10) {
  return Math.max(min, Math.min(max, val));
}

function scoreToLabel(score: number): string {
  if (score >= 8.5) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Average';
  if (score >= 3) return 'Needs Work';
  return 'Significant Opportunity';
}

// Symmetry: compare left vs right distances
function calcSymmetry(pts: Point[]): number {
  const faceWidth = dist(pts[0], pts[16]);
  const midX = (pts[0].x + pts[16].x) / 2;

  // Eye positions
  const rightEyeX = (pts[36].x + pts[39].x) / 2;
  const leftEyeX = (pts[42].x + pts[45].x) / 2;
  const eyeSymmetry = 1 - Math.abs(midX - rightEyeX - (leftEyeX - midX)) / faceWidth;

  // Brow heights
  const rightBrowY = (pts[17].y + pts[21].y) / 2;
  const leftBrowY = (pts[22].y + pts[26].y) / 2;
  const browSymmetry = 1 - Math.abs(rightBrowY - leftBrowY) / faceWidth;

  const raw = (eyeSymmetry * 0.6 + browSymmetry * 0.4) * 10;
  return clamp(raw * 1.1); // slight boost since perfect symmetry is rare
}

// Jawline: ratio of jaw width to face height indicates definition
function calcJawline(pts: Point[]): number {
  const jawWidth = dist(pts[3], pts[13]);
  const faceHeight = dist(pts[8], pts[27]);
  const ratio = jawWidth / faceHeight;
  // ideal golden ratio jaw-to-face-height ≈ 0.7-0.8
  const deviation = Math.abs(ratio - 0.75);
  const raw = (1 - deviation * 2) * 10;
  return clamp(raw);
}

// Eyes: inter-eye distance / face width should follow rule of fifths (0.3-0.4)
function calcEyes(pts: Point[]): number {
  const faceWidth = dist(pts[0], pts[16]);
  const interEye = dist(pts[39], pts[42]);
  const ratio = interEye / faceWidth;
  const deviation = Math.abs(ratio - 0.33);
  const raw = (1 - deviation * 8) * 9;
  return clamp(raw);
}

// Brows: arch and alignment
function calcBrows(pts: Point[]): number {
  const rightBrowWidth = dist(pts[17], pts[21]);
  const leftBrowWidth = dist(pts[22], pts[26]);
  const symmetry = 1 - Math.abs(rightBrowWidth - leftBrowWidth) / Math.max(rightBrowWidth, leftBrowWidth);
  return clamp(symmetry * 9);
}

// Lips: width-to-height ratio (fullness proxy)
function calcLips(pts: Point[]): number {
  const lipWidth = dist(pts[48], pts[54]);
  const lipHeight = dist(pts[51], pts[57]);
  const ratio = lipHeight / lipWidth;
  // ideal ≈ 0.3-0.4
  const deviation = Math.abs(ratio - 0.35);
  const raw = (1 - deviation * 6) * 9;
  return clamp(raw);
}

// These can't be measured from landmarks — use a default + small random variation
function calcSkin(): number {
  return clamp(5 + (Math.random() * 3));
}
function calcHair(): number {
  return clamp(5 + (Math.random() * 3));
}
function calcGrooming(): number {
  return clamp(5 + (Math.random() * 3));
}

const TIPS: Record<string, { tips: string[][]; productTags: string[][] }> = {
  symmetry: {
    tips: [
      ['Facial exercises can improve muscle tone and subtle symmetry', 'Gua sha massage promotes lymphatic drainage', 'A consistent sleep position helps avoid one-sided puffiness'],
      ['Your symmetry is great — maintain good sleep and hydration', 'Chewing on both sides equally helps jaw symmetry', 'Good posture supports facial alignment'],
      ['Regular facial massage improves blood flow and symmetry', 'Stay hydrated — dehydration causes puffiness that affects symmetry', 'Mewing (proper tongue posture) can improve jawline over time'],
    ],
    productTags: [['facial-tools'], ['skincare'], ['facial-tools']],
  },
  skin: {
    tips: [
      ['Start a basic 3-step routine: cleanser, moisturizer, SPF', 'Drink at least 8 glasses of water daily', 'Cut processed sugar — it causes inflammation and breakouts'],
      ['Add a Vitamin C serum for brightening and protection', 'Use SPF 30+ every single morning', 'Exfoliate 2x/week with a gentle scrub'],
      ['Your skin looks healthy — keep your current routine', 'Consider adding a retinol serum at night for long-term glow', 'Never sleep with makeup on'],
    ],
    productTags: [['skincare', 'beginner'], ['skincare', 'serum'], ['skincare']],
  },
  eyes: {
    tips: [
      ['Use an eye cream with caffeine to reduce puffiness', 'Sleep 7-9 hours and elevate your pillow slightly', 'Cold spoons or ice rollers reduce morning puffiness'],
      ['Groomed brows frame the eyes beautifully — keep them shaped', 'Eye drops remove redness for a brighter look', 'Well-fitting glasses or contacts matter a lot for eye area'],
      ['Your eye area looks great — protect it with SPF and sunglasses', 'Gentle tapping (not rubbing) when applying eye cream', 'Stay consistent with sleep schedule'],
    ],
    productTags: [['eye-care'], ['grooming'], ['eye-care']],
  },
  jawline: {
    tips: [
      ['Reduce sodium intake to minimize water retention in the face', 'Chewing gum (sugar-free) exercises jaw muscles', 'Mewing and proper tongue posture can redefine the jawline over months'],
      ['Losing even 5% body fat significantly sharpens the jawline', 'A well-fitted beard or stubble can define the jaw instantly', 'Contouring with bronzer adds definition'],
      ['Great jawline definition — maintain your weight and hydration', 'Keep body fat low for continued sharp definition', 'Jaw exercises maintain muscle tone'],
    ],
    productTags: [['grooming', 'beard'], ['fitness'], ['grooming']],
  },
  hair: {
    tips: [
      ['Visit a barber or stylist for a cut that suits your face shape', 'Use a quality shampoo for your hair type', 'Hair styling products (pomade, clay, wax) instantly elevate appearance'],
      ['Try a different part or style — small changes make a big impact', 'Deep condition weekly to improve shine and texture', 'Reduce heat styling to prevent damage'],
      ['Your hair looks good — stay consistent with trims every 4-6 weeks', 'A quality hair oil adds shine and control', 'Protect hair from sun damage with SPF spray'],
    ],
    productTags: [['haircare'], ['haircare', 'styling'], ['haircare']],
  },
  grooming: {
    tips: [
      ['Build a basic grooming kit: trimmer, nail clippers, tweezers', 'Consistent beard maintenance (even stubble needs shaping)', 'Moisturize lips daily and exfoliate weekly'],
      ['Upgrade to a safety razor for a cleaner shave', 'Trim nose and ear hair regularly — often overlooked', 'White teeth dramatically improve appearance — try whitening strips'],
      ['Your grooming is solid — consider small upgrades like premium fragrance', 'Nail care is often overlooked but noticed', 'Regular haircuts maintain a polished look'],
    ],
    productTags: [['grooming', 'beginner'], ['grooming'], ['grooming', 'premium']],
  },
  brows: {
    tips: [
      ['Get brows professionally threaded or waxed — life-changing difference', 'Fill sparse brows with a pencil or powder in hair color', 'Keep the space between brows clean for a more alert look'],
      ['Brush brows up daily with a spoolie for a fuller look', 'Clear brow gel keeps shape in place all day', 'Avoid over-plucking — thick natural brows are on-trend'],
      ['Great brows! Keep them groomed and shaped every 4-6 weeks', 'Castor oil nightly promotes brow growth and thickness', 'Tinting your brows adds definition without pencil'],
    ],
    productTags: [['grooming', 'brows'], ['grooming'], ['grooming']],
  },
  lips: {
    tips: [
      ['Exfoliate lips weekly with a sugar scrub', 'Apply lip balm with SPF every morning', 'Stay hydrated — dehydration is the #1 cause of dry, thin-looking lips'],
      ['A tinted lip balm adds subtle color and definition', 'Moisturize before bed every night for softer lips', 'Avoid licking your lips — it worsens dryness'],
      ['Your lip area looks healthy — keep moisturizing daily', 'A quality chapstick should always be on you', 'Smile! Your lips look great when you do'],
    ],
    productTags: [['skincare', 'lips'], ['skincare'], ['skincare']],
  },
};

function getScoreTier(score: number): number {
  if (score < 4) return 0;
  if (score < 7) return 1;
  return 2;
}

export function scoreLandmarks(
  landmarks: Point[],
  detectionScore: number
): FeatureScore[] {
  const features: Array<{
    key: string;
    label: string;
    emoji: string;
    score: number;
  }> = [];

  if (landmarks.length >= 68) {
    features.push({ key: 'symmetry', label: 'Facial Symmetry', emoji: '⚖️', score: calcSymmetry(landmarks) });
    features.push({ key: 'jawline', label: 'Jawline', emoji: '💎', score: calcJawline(landmarks) });
    features.push({ key: 'eyes', label: 'Eyes', emoji: '👁️', score: calcEyes(landmarks) });
    features.push({ key: 'brows', label: 'Eyebrows', emoji: '🪮', score: calcBrows(landmarks) });
    features.push({ key: 'lips', label: 'Lips', emoji: '💋', score: calcLips(landmarks) });
  }

  // These always use heuristic scores
  features.push({ key: 'skin', label: 'Skin', emoji: '✨', score: clamp(detectionScore * 7 + calcSkin() * 0.3) });
  features.push({ key: 'hair', label: 'Hair & Style', emoji: '💇', score: calcHair() });
  features.push({ key: 'grooming', label: 'Grooming', emoji: '🧴', score: calcGrooming() });

  return features.map((f) => {
    const tier = getScoreTier(f.score);
    const tipData = TIPS[f.key];
    const tips = tipData.tips[tier];
    const productTags = tipData.productTags[tier];
    const potentialScore = clamp(f.score + (10 - f.score) * 0.65);

    return {
      key: f.key,
      label: f.label,
      score: Math.round(f.score * 10) / 10,
      potentialScore: Math.round(potentialScore * 10) / 10,
      emoji: f.emoji,
      finding: `${scoreToLabel(f.score)} — ${tier === 0 ? 'significant room to grow' : tier === 1 ? 'some improvement possible' : 'maintain and refine'}`,
      tips,
      productTags,
    };
  });
}

export function calcOverallScore(features: FeatureScore[]): number {
  const weights: Record<string, number> = {
    symmetry: 0.2,
    skin: 0.2,
    jawline: 0.15,
    hair: 0.15,
    grooming: 0.1,
    eyes: 0.1,
    brows: 0.05,
    lips: 0.05,
  };
  let total = 0;
  let weightSum = 0;
  for (const f of features) {
    const w = weights[f.key] ?? 0.1;
    total += f.score * w;
    weightSum += w;
  }
  return Math.round((total / weightSum) * 10) / 10;
}

export function calcPotentialScore(features: FeatureScore[]): number {
  const weights: Record<string, number> = {
    symmetry: 0.2,
    skin: 0.2,
    jawline: 0.15,
    hair: 0.15,
    grooming: 0.1,
    eyes: 0.1,
    brows: 0.05,
    lips: 0.05,
  };
  let total = 0;
  let weightSum = 0;
  for (const f of features) {
    const w = weights[f.key] ?? 0.1;
    total += f.potentialScore * w;
    weightSum += w;
  }
  return Math.round((total / weightSum) * 10) / 10;
}

export function generateSummary(overall: number, potential: number, features: FeatureScore[]): string {
  const weakest = [...features].sort((a, b) => a.score - b.score)[0];
  const strongest = [...features].sort((a, b) => b.score - a.score)[0];
  const gain = (potential - overall).toFixed(1);
  return `You scored ${overall}/10 overall with potential to reach ${potential}/10 (+${gain} points) with focused effort. Your strongest feature is your ${weakest ? strongest.label.toLowerCase() : 'overall presentation'}. The biggest opportunity for improvement is your ${weakest ? weakest.label.toLowerCase() : 'grooming routine'} — small changes here will have the biggest visual impact.`;
}
