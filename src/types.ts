export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string; // hex accent color
  createdAt: string; // ISO date (YYYY-MM-DD)
  completions: string[]; // ISO dates (YYYY-MM-DD) this habit was marked done
  // Days of the week this habit counts on (0 = Sunday .. 6 = Saturday).
  // Missing or empty means every day, so habits saved before schedules
  // existed keep working unchanged.
  days?: number[];
  // Optional own reminder for this habit ("HH:MM"), separate from the general daily one.
  reminderTime?: string;
  // Optional numbers and notes per day, e.g. the day's sales. Keyed by ISO
  // date. Only habits with trackAmount show an amount field.
  trackAmount?: boolean;
  unit?: string; // shown next to amounts, e.g. "$", "kg", "calls"
  entries?: Record<string, { amount?: number; note?: string }>;
}

import type { Language } from './i18n';

export type ThemeMode = 'dark' | 'light';

export interface AppState {
  habits: Habit[];
  isPro: boolean;
  onboarded: boolean;
  themeMode: ThemeMode;
  reminderEnabled: boolean;
  reminderTime: string; // "HH:MM", 24h
  language: Language;
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
  key: string; // translation key, e.g. tpl.stock
  emoji: string;
  name: string; // English fallback
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  { key: 'tpl.stock', emoji: '📦', name: "Check stock levels" },
  { key: 'tpl.sales', emoji: '💰', name: "Record today's sales" },
  { key: 'tpl.invoices', emoji: '📞', name: 'Follow up unpaid invoices' },
  { key: 'tpl.leads', emoji: '🎯', name: 'Contact 3 new leads' },
  { key: 'tpl.cash', emoji: '📊', name: 'Review cash on hand' },
  { key: 'tpl.social', emoji: '📱', name: 'Post on social media' },
  { key: 'tpl.plan', emoji: '📝', name: "Plan tomorrow's priorities" },
  { key: 'tpl.books', emoji: '🧾', name: 'Update the books' },
  { key: 'tpl.supplier', emoji: '🤝', name: 'Check in with a supplier' },
  { key: 'tpl.numbers', emoji: '📈', name: "Review yesterday's numbers" },
];

// Monday-first order for the day picker; values are JS getDay() numbers.
export const WEEKDAY_OPTIONS: { dow: number; label: string }[] = [
  { dow: 1, label: 'Mon' },
  { dow: 2, label: 'Tue' },
  { dow: 3, label: 'Wed' },
  { dow: 4, label: 'Thu' },
  { dow: 5, label: 'Fri' },
  { dow: 6, label: 'Sat' },
  { dow: 0, label: 'Sun' },
];
