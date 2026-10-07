import { Habit, WEEKDAY_OPTIONS } from './types';
import type { TKey } from './i18n';

export function isEveryDay(habit: Habit): boolean {
  return !habit.days || habit.days.length === 0 || habit.days.length === 7;
}

/** "Every day", or the short day names in Monday-first order, in the user's language. */
export function scheduleText(habit: Habit, t: (key: TKey) => string): string {
  if (isEveryDay(habit)) return t('add.everyDay');
  return WEEKDAY_OPTIONS.filter((o) => habit.days!.includes(o.dow))
    .map((o) => t(`dayShort.${o.dow}` as TKey))
    .join(', ');
}

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** What gets stored: all seven days means "no schedule" (every day). */
export function normalizeDays(days: number[]): number[] | undefined {
  return days.length >= 7 ? undefined : [...days].sort((a, b) => a - b);
}
