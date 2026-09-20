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

export function toggleCompletion(habit: Habit, dateISO: string): Habit {
  const has = habit.completions.includes(dateISO);
  const completions = has
    ? habit.completions.filter((d) => d !== dateISO)
    : [...habit.completions, dateISO].sort();
  return { ...habit, completions };
}

/** Current streak, counting back from today. Today not yet done doesn't break
 * a streak that's still "alive" (habit can still be done later today). */
export function getCurrentStreak(habit: Habit): number {
  const completed = new Set(habit.completions);
  let cursor = todayISO();
  if (!completed.has(cursor)) {
    cursor = addDays(cursor, -1);
  }
  let streak = 0;
  while (completed.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function getBestStreak(habit: Habit): number {
  if (habit.completions.length === 0) return 0;
  const sorted = [...habit.completions].sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === addDays(sorted[i - 1], 1)) {
      current++;
      best = Math.max(best, current);
    } else if (sorted[i] !== sorted[i - 1]) {
      current = 1;
    }
  }
  return best;
}

export function getCompletionRate(habit: Habit, days: number = 30): number {
  const completed = new Set(habit.completions);
  let cursor = todayISO();
  let hits = 0;
  for (let i = 0; i < days; i++) {
    if (completed.has(cursor)) hits++;
    cursor = addDays(cursor, -1);
  }
  return Math.round((hits / days) * 100);
}

export interface GridCell {
  date: string;
  completed: boolean;
  future: boolean;
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
    cells.push({ date: iso, completed: completed.has(iso), future: iso > todayIso });
  }

  const columns: GridCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    columns.push(cells.slice(w * 7, (w + 1) * 7));
  }
  return columns;
}
