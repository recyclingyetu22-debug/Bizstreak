export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string; // hex accent color
  createdAt: string; // ISO date (YYYY-MM-DD)
  completions: string[]; // ISO dates (YYYY-MM-DD) this habit was marked done
}

export type ThemeMode = 'dark' | 'light';

export interface AppState {
  habits: Habit[];
  isPro: boolean;
  onboarded: boolean;
  themeMode: ThemeMode;
  reminderEnabled: boolean;
  reminderTime: string; // "HH:MM", 24h
}

export const FREE_HABIT_LIMIT = 3;

export const HABIT_COLORS = [
  '#22C55E', // green
  '#F59E0B', // amber
  '#3B82F6', // blue
  '#EF4444', // red
  '#A855F7', // purple
  '#14B8A6', // teal
  '#EC4899', // pink
  '#F97316', // orange
];

export interface HabitTemplate {
  emoji: string;
  name: string;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  { emoji: '📦', name: "Check stock levels" },
  { emoji: '💰', name: "Record today's sales" },
  { emoji: '📞', name: 'Follow up unpaid invoices' },
  { emoji: '🎯', name: 'Contact 3 new leads' },
  { emoji: '📊', name: 'Review cash on hand' },
  { emoji: '📱', name: 'Post on social media' },
  { emoji: '📝', name: "Plan tomorrow's priorities" },
  { emoji: '🧾', name: 'Update the books' },
  { emoji: '🤝', name: 'Check in with a supplier' },
  { emoji: '📈', name: "Review yesterday's numbers" },
];
