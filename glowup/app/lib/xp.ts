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
} as const;

export type XPReason = keyof typeof XP_REWARDS;

// XP required to reach a given level: level * 200
export function xpForLevel(level: number): number {
  return level * 200;
}

// Total cumulative XP required to reach a level
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

const TITLES: [number, string][] = [
  [1, 'Rookie'],
  [6, 'Apprentice'],
  [16, 'Dedicated'],
  [26, 'Committed'],
  [41, 'Elite'],
  [61, 'Champion'],
  [81, 'Legend'],
];

export function levelTitle(level: number): string {
  let title = 'Rookie';
  for (const [minLevel, t] of TITLES) {
    if (level >= minLevel) title = t;
  }
  return title;
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
};
