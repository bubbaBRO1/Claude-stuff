export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: string;
  isActive: boolean;
  logs: string[]; // dateKey array "YYYY-MM-DD"
}

export const HABIT_CATEGORIES = [
  { key: 'grooming', label: 'Grooming', color: '#8B5CF6' },
  { key: 'skincare', label: 'Skincare', color: '#EC4899' },
  { key: 'fitness', label: 'Fitness', color: '#10B981' },
  { key: 'diet', label: 'Diet', color: '#F59E0B' },
  { key: 'mental', label: 'Mental Health', color: '#3B82F6' },
  { key: 'general', label: 'General', color: '#6B7280' },
] as const;
