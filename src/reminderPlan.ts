import { Habit } from './types';

// Decides which notifications a habit's own reminder needs. Kept free of any
// native code so the rules can be tested without a phone.

export interface ReminderSlot {
  id: string;
  weekday?: number; // expo-notifications weekday: 1 = Sunday .. 7 = Saturday. Missing = every day.
  hour: number;
  minute: number;
}

/** Every notification id a habit could ever have used (to cancel them all). */
export function habitReminderIds(habitId: string): string[] {
  return [`bizstreak-habit-${habitId}-daily`, ...[0, 1, 2, 3, 4, 5, 6].map((d) => `bizstreak-habit-${habitId}-${d}`)];
}

export function parseTime(time?: string): { hour: number; minute: number } | null {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time)) return null;
  const [hour, minute] = time.split(':').map(Number);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function planHabitReminder(habit: Habit): ReminderSlot[] {
  const t = parseTime(habit.reminderTime);
  if (!t) return [];
  const days = habit.days && habit.days.length > 0 && habit.days.length < 7 ? [...habit.days].sort((a, b) => a - b) : null;
  if (!days) return [{ id: `bizstreak-habit-${habit.id}-daily`, hour: t.hour, minute: t.minute }];
  // A habit that only counts on some days only reminds on those days.
  return days.map((dow) => ({ id: `bizstreak-habit-${habit.id}-${dow}`, weekday: dow + 1, hour: t.hour, minute: t.minute }));
}
