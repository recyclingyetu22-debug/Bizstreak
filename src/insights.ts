import { Habit } from './types';
import { addDays, todayISO } from './streaks';

// A weekday tip needs at least this many occurrences of that weekday (summed
// across all habits) before it's trusted as a real pattern, not noise from
// one or two data points.
const MIN_SAMPLES_PER_DAY = 2;
// And at least this many distinct weekdays need enough samples before we'll
// compare "weakest vs. average" fairly — otherwise a brand-new habit (a few
// days old) could get flagged on its very first bad day.
const MIN_QUALIFYING_DAYS = 4;
// The weakest day has to trail the average by at least this much, and still
// be below this raw completion rate — otherwise normal day-to-day variance
// would trigger a tip that isn't really saying anything.
const MIN_GAP = 0.2;
const MAX_WEAK_RATE = 0.7;

const DAY_NAMES = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];

function dowOfISO(dateISO: string): number {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export interface WeekdayStat {
  dow: number; // 0 = Sunday .. 6 = Saturday
  completed: number;
  total: number;
}

/** For each day of the week, how many habit-days were completed vs. how many
 * have occurred (across every habit, since each habit's own createdAt) up to
 * yesterday — today isn't counted as a miss yet, since it can still be
 * checked off later today. */
export function getWeekdayStats(habits: Habit[]): WeekdayStat[] {
  const stats: WeekdayStat[] = Array.from({ length: 7 }, (_, dow) => ({ dow, completed: 0, total: 0 }));
  const yesterday = addDays(todayISO(), -1);

  for (const habit of habits) {
    const completed = new Set(habit.completions);
    let cursor = habit.createdAt;
    // Guards against an unbounded loop; two years of daily habit history is
    // far more than this feature needs to find a pattern.
    let guard = 0;
    while (cursor <= yesterday && guard < 730) {
      const dow = dowOfISO(cursor);
      stats[dow].total++;
      if (completed.has(cursor)) stats[dow].completed++;
      cursor = addDays(cursor, 1);
      guard++;
    }
  }
  return stats;
}

export interface Insight {
  emoji: string;
  text: string;
}

/** One short, specific tip — or null when there isn't enough history yet, or
 * nothing stands out as a real pattern (both deliberate: a wrong or noisy
 * "insight" is worse than no insight at all). */
export function getSmartTip(habits: Habit[]): Insight | null {
  if (habits.length === 0) return null;

  const qualifying = getWeekdayStats(habits).filter((s) => s.total >= MIN_SAMPLES_PER_DAY);
  if (qualifying.length < MIN_QUALIFYING_DAYS) return null;

  const rates = qualifying.map((s) => ({ dow: s.dow, rate: s.completed / s.total }));
  const average = rates.reduce((sum, r) => sum + r.rate, 0) / rates.length;
  const weakest = rates.reduce((min, r) => (r.rate < min.rate ? r : min));

  if (average - weakest.rate < MIN_GAP || weakest.rate >= MAX_WEAK_RATE) return null;

  const pct = Math.round(weakest.rate * 100);
  return {
    emoji: '💡',
    text: `You complete only ${pct}% of your habits on ${DAY_NAMES[weakest.dow]} — your weakest day. Try checking in first thing that morning to protect your streak.`,
  };
}
