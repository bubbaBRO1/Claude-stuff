export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-scan',   title: 'First Scan',      icon: '📷', description: 'Complete your first face scan',             xpReward: 100 },
  { id: 'streak-7',     title: '7-Day Streak',     icon: '🔥', description: '7 days of morning routine in a row',       xpReward: 100 },
  { id: 'habit-hero',   title: 'Habit Hero',        icon: '💪', description: '30-day routine streak',                   xpReward: 100 },
  { id: 'glow-up',      title: 'Glow Up',           icon: '✨', description: 'Improve your scan score by 1+ point',     xpReward: 100 },
  { id: 'perfect-week', title: 'Perfect Week',      icon: '🏆', description: 'All habits completed for 7 days straight', xpReward: 100 },
  { id: 'dedicated',    title: 'Dedicated',         icon: '🌟', description: '30 total routine completions',            xpReward: 100 },
  { id: 'focus-5',      title: 'Deep Work',         icon: '🧠', description: 'Complete 5 focus sessions',              xpReward: 100 },
  { id: 'hydrated',     title: 'Hydrated',          icon: '💧', description: 'Hit daily water goal 7 days',            xpReward: 100 },
  { id: 'well-rested',  title: 'Well Rested',       icon: '😴', description: 'Log 7 nights of sleep',                  xpReward: 100 },
  { id: 'journaler',    title: 'Journaler',          icon: '📸', description: 'Add 5 progress journal entries',         xpReward: 100 },
];
