export interface RoutineStep {
  id: string;
  order: number;
  title: string;
  icon: string;
  durationSec: number;
  isActive: boolean;
}

export interface Routine {
  id: string;
  name: string;
  steps: RoutineStep[];
}

export interface RoutineWithStreak extends Routine {
  streak: number;
  completedToday: boolean;
}
