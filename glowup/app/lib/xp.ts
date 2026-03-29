export const XP_REWARDS = {
  routine_complete: 50,
  scan: 30,
  scan_improvement: 75,
  habit_check: 10,
  all_habits: 25,
  focus_session: 40,
  goal_complete: 15,
  sleep_log: 10,
  water_target: 15,
  journal: 20,
  achievement: 100,
  daily_challenge: 35,
  social_challenge: 50,
} as const;

export type XPReason = keyof typeof XP_REWARDS;

export function xpForLevel(level: number): number {
  return level * 200;
}

export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

export function calcLevel(totalXP: number): { level: number; currentXP: number; xpNeeded: number; progress: number } {
  let level = 1;
  let remaining = totalXP;

  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
    if (level >= 100) break;
  }

  const xpNeeded = xpForLevel(level);
  return {
    level,
    currentXP: remaining,
    xpNeeded,
    progress: Math.min(remaining / xpNeeded, 1),
  };
}

// ---- Rank System (Critique AI style) ----
export interface RankInfo {
  name: string;
  minLevel: number;
  color: string;
  cssClass: string;
  icon: string;
  glow: boolean;
}

export const RANKS: RankInfo[] = [
  { name: 'Bronze',    minLevel: 1,  color: '#cd7f32', cssClass: 'rank-bronze',    icon: '🥉', glow: false },
  { name: 'Silver',    minLevel: 10, color: '#c0c0c0', cssClass: 'rank-silver',    icon: '🥈', glow: false },
  { name: 'Gold',      minLevel: 20, color: '#eab308', cssClass: 'rank-gold',      icon: '🥇', glow: false },
  { name: 'Platinum',  minLevel: 35, color: '#06b6d4', cssClass: 'rank-platinum',  icon: '💎', glow: false },
  { name: 'Diamond',   minLevel: 50, color: '#8b5cf6', cssClass: 'rank-diamond',   icon: '💠', glow: true },
  { name: 'Elite',     minLevel: 65, color: '#10b981', cssClass: 'rank-elite',     icon: '⚡', glow: true },
  { name: 'Legendary', minLevel: 80, color: '#fbbf24', cssClass: 'rank-legendary', icon: '👑', glow: true },
  { name: 'Mythic',    minLevel: 95, color: '#ff6b35', cssClass: 'rank-mythic',    icon: '🔱', glow: true },
];

export function getRank(level: number): RankInfo {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (level >= r.minLevel) rank = r;
  }
  return rank;
}

export function getNextRank(level: number): RankInfo | null {
  for (const r of RANKS) {
    if (r.minLevel > level) return r;
  }
  return null;
}

export function levelTitle(level: number): string {
  return getRank(level).name;
}

export const REASON_LABELS: Record<string, string> = {
  routine_complete: '☀️ Morning Routine',
  scan: '📷 Face Scan',
  scan_improvement: '✨ Score Improved',
  habit_check: '💪 Habit Completed',
  all_habits: '🎯 All Habits Done',
  focus_session: '🧠 Focus Session',
  goal_complete: '✅ Daily Goal',
  sleep_log: '😴 Sleep Logged',
  water_target: '💧 Water Target Hit',
  journal: '📸 Journal Entry',
  achievement: '🏆 Achievement Unlocked',
  daily_challenge: '⚔️ Daily Challenge',
  social_challenge: '🗣️ Social Challenge',
};
