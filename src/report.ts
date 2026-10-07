import { Habit } from './types';
import { addDays, getCurrentStreak, isScheduled } from './streaks';
import { sumAmount, weekStartISO } from './entries';
import type { Language } from './i18n';

export interface HabitWeek {
  habit: Habit;
  due: number; // scheduled days so far this week (since the habit existed)
  done: number; // of those, how many were checked off
}

export interface WeekStats {
  due: number;
  done: number;
  pct: number; // 0..100
}

export interface WeeklyReport {
  weekStart: string; // Monday
  weekEnd: string; // Sunday
  thisWeek: WeekStats;
  lastWeek: WeekStats;
  perHabit: HabitWeek[];
  amounts: { habit: Habit; thisWeek: number; lastWeek: number }[];
  topStreak: { habit: Habit; streak: number } | null;
}

const pct = (done: number, due: number) => (due === 0 ? 0 : Math.min(100, Math.round((done / due) * 100)));

/** How many scheduled days a habit had in [from, to] (never before it was
 * created, never in the future) and how many of them were done. */
function countRange(habit: Habit, from: string, to: string): { due: number; done: number } {
  const completed = new Set(habit.completions);
  const start = from < habit.createdAt ? habit.createdAt : from;
  let due = 0;
  let done = 0;
  for (let cursor = start, n = 0; cursor <= to && n < 400; cursor = addDays(cursor, 1), n++) {
    if (!isScheduled(habit, cursor)) continue;
    due++;
    if (completed.has(cursor)) done++;
  }
  return { due, done };
}

export function buildReport(habits: Habit[], today: string): WeeklyReport {
  const weekStart = weekStartISO(today);
  const weekEnd = addDays(weekStart, 6);
  const lastStart = addDays(weekStart, -7);
  const lastEnd = addDays(weekStart, -1);

  const perHabit: HabitWeek[] = [];
  const total = { due: 0, done: 0 };
  const last = { due: 0, done: 0 };

  for (const habit of habits) {
    const a = countRange(habit, weekStart, today);
    const b = countRange(habit, lastStart, lastEnd);
    perHabit.push({ habit, due: a.due, done: a.done });
    total.due += a.due;
    total.done += a.done;
    last.due += b.due;
    last.done += b.done;
  }

  let topStreak: WeeklyReport['topStreak'] = null;
  for (const habit of habits) {
    const streak = getCurrentStreak(habit);
    if (streak > 0 && (!topStreak || streak > topStreak.streak)) topStreak = { habit, streak };
  }

  const amounts = habits
    .filter((h) => h.trackAmount)
    .map((habit) => ({
      habit,
      thisWeek: sumAmount(habit, weekStart, today),
      lastWeek: sumAmount(habit, lastStart, lastEnd),
    }));

  return {
    weekStart,
    weekEnd,
    thisWeek: { ...total, pct: pct(total.done, total.due) },
    lastWeek: { ...last, pct: pct(last.done, last.due) },
    perHabit,
    amounts,
    topStreak,
  };
}

const MONTHS: Record<Language, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
};

/** "Oct 5" (en) / "5 oct." (fr) */
export function formatDay(iso: string, lang: Language): string {
  const [, m, d] = iso.split('-').map(Number);
  const month = MONTHS[lang][m - 1];
  return lang === 'fr' ? `${d} ${month}` : `${month} ${d}`;
}

export function formatRange(from: string, to: string, lang: Language): string {
  return `${formatDay(from, lang)} – ${formatDay(to, lang)}`;
}
