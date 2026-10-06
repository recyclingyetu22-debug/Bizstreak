import { Habit } from './types';

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(dateISO: string, delta: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toISODate(dt);
}

function dowOfISO(dateISO: string): number {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** Whether this habit counts on the given date. A habit with no schedule
 * (every habit created before schedules existed) counts every day. */
export function isScheduled(habit: Habit, dateISO: string): boolean {
  if (!habit.days || habit.days.length === 0) return true;
  return habit.days.includes(dowOfISO(dateISO));
}

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** e.g. 'Every day', 'Mon - Sat', or 'Mon, Wed, Fri'. */
export function scheduleLabel(habit: Habit): string {
  if (!habit.days || habit.days.length === 0 || habit.days.length === 7) return 'Every day';
  const order = [1, 2, 3, 4, 5, 6, 0].filter((d) => habit.days!.includes(d));
  return order.map((d) => SHORT_DAYS[d]).join(', ');
}

export function toggleCompletion(habit: Habit, dateISO: string): Habit {
  const has = habit.completions.includes(dateISO);
  const completions = has
    ? habit.completions.filter((d) => d !== dateISO)
    : [...habit.completions, dateISO].sort();
  return { ...habit, completions };
}

/** Current streak, counting back from today. Days the habit isn't scheduled
 * on are skipped (they neither extend nor break the streak). Today not yet
 * done doesn't break a streak that's still "alive" (it can still be done
 * later today). */
export function getCurrentStreak(habit: Habit): number {
  const completed = new Set(habit.completions);
  let cursor = todayISO();
  if (isScheduled(habit, cursor) && !completed.has(cursor)) {
    cursor = addDays(cursor, -1);
  }
  let streak = 0;
  // Bounded: a habit can't have more than a few years of history here, and
  // the bound guarantees termination whatever the schedule looks like.
  for (let i = 0; i < 4000; i++) {
    if (completed.has(cursor)) {
      streak++;
    } else if (isScheduled(habit, cursor)) {
      break;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function getBestStreak(habit: Habit): number {
  if (habit.completions.length === 0) return 0;
  const sorted = Array.from(new Set(habit.completions)).sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    // The streak continues when every day between the two completions is a
    // day the habit isn't scheduled on.
    let gapHasScheduledDay = false;
    let cursor = addDays(sorted[i - 1], 1);
    while (cursor < sorted[i]) {
      if (isScheduled(habit, cursor)) {
        gapHasScheduledDay = true;
        break;
      }
      cursor = addDays(cursor, 1);
    }
    if (gapHasScheduledDay) {
      current = 1;
    } else {
      current++;
      best = Math.max(best, current);
    }
  }
  return best;
}

export function getCompletionRate(habit: Habit, days: number = 30): number {
  const completed = new Set(habit.completions);
  let cursor = todayISO();
  let hits = 0;
  let due = 0;
  for (let i = 0; i < days; i++) {
    if (isScheduled(habit, cursor)) due++;
    if (completed.has(cursor)) hits++;
    cursor = addDays(cursor, -1);
  }
  if (due === 0) return 0;
  return Math.min(100, Math.round((hits / due) * 100));
}

export interface GridCell {
  date: string;
  completed: boolean;
  future: boolean;
  scheduled: boolean;
}

/** Builds a GitHub-style grid: an array of week-columns, each with 7 day-cells
 * (Sun..Sat), ending on the Saturday of the current week. */
export function generateGridWeeks(habit: Habit, weeks: number): GridCell[][] {
  const completed = new Set(habit.completions);
  const today = new Date();
  const todayIso = toISODate(today);
  const endDow = today.getDay(); // 0 = Sun
  const daysUntilWeekEnd = 6 - endDow;
  const gridEnd = new Date(today);
  gridEnd.setDate(today.getDate() + daysUntilWeekEnd);
  const gridStart = new Date(gridEnd);
  gridStart.setDate(gridEnd.getDate() - (weeks * 7 - 1));

  const cells: GridCell[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const iso = toISODate(d);
    cells.push({ date: iso, completed: completed.has(iso), future: iso > todayIso, scheduled: isScheduled(habit, iso) });
  }

  const columns: GridCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    columns.push(cells.slice(w * 7, (w + 1) * 7));
  }
  return columns;
}
