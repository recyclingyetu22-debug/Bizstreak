import { AppState, Habit, FREE_HABIT_LIMIT } from './types';
import { addDays } from './streaks';

// A backup is plain text (JSON) the user can send to themselves. Completion
// dates are stored as ranges ("2026-01-01..2026-03-31") so a long unbroken
// streak stays tiny instead of one entry per day.

const BACKUP_APP = 'bizstreak';
const BACKUP_VERSION = 1;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

interface BackupHabit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
  days?: number[];
  done: string[]; // dates or ranges "a..b"
}

interface BackupFile {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  themeMode: AppState['themeMode'];
  language: AppState['language'];
  habits: BackupHabit[];
}

export function compressDates(dates: string[]): string[] {
  const sorted = Array.from(new Set(dates)).sort();
  const out: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === addDays(sorted[j], 1)) j++;
    out.push(j > i ? `${sorted[i]}..${sorted[j]}` : sorted[i]);
    i = j + 1;
  }
  return out;
}

export function expandDates(items: string[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (item.includes('..')) {
      const [from, to] = item.split('..');
      let cursor = from;
      // The loop bound guards against a corrupted range running away.
      for (let n = 0; n < 20000 && cursor <= to; n++) {
        out.push(cursor);
        cursor = addDays(cursor, 1);
      }
    } else {
      out.push(item);
    }
  }
  return Array.from(new Set(out)).sort();
}

export function createBackup(state: AppState, now: Date = new Date()): string {
  const file: BackupFile = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    themeMode: state.themeMode,
    language: state.language,
    habits: state.habits.map((h) => ({
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      createdAt: h.createdAt,
      ...(h.days && h.days.length ? { days: h.days } : {}),
      done: compressDates(h.completions),
    })),
  };
  return JSON.stringify(file);
}

export type ParsedBackup =
  | { ok: true; habits: Habit[]; themeMode: AppState['themeMode']; language: AppState['language'] }
  | { ok: false };

const isStr = (v: unknown): v is string => typeof v === 'string';

/** Accepts only a well-formed BizStreak backup; anything else is rejected
 * without touching the user's data. */
export function parseBackup(text: string): ParsedBackup {
  try {
    const raw = JSON.parse(text.trim());
    if (!raw || raw.app !== BACKUP_APP || !Array.isArray(raw.habits)) return { ok: false };

    const habits: Habit[] = [];
    for (const h of raw.habits) {
      if (!h || !isStr(h.id) || !isStr(h.name) || !isStr(h.emoji) || !isStr(h.color) || !isStr(h.createdAt)) {
        return { ok: false };
      }
      if (!ISO.test(h.createdAt) || !Array.isArray(h.done) || !h.done.every(isStr)) return { ok: false };
      const days =
        Array.isArray(h.days) && h.days.length > 0 && h.days.length < 7 && h.days.every((d: unknown) => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6)
          ? (h.days as number[])
          : undefined;
      habits.push({
        id: h.id,
        name: h.name.slice(0, 120),
        emoji: h.emoji,
        color: h.color,
        createdAt: h.createdAt,
        days,
        completions: expandDates(h.done).filter((d) => ISO.test(d)),
      });
    }
    return {
      ok: true,
      habits,
      themeMode: raw.themeMode === 'light' ? 'light' : 'dark',
      language: raw.language === 'fr' ? 'fr' : 'en',
    };
  } catch {
    return { ok: false };
  }
}

/** The free plan holds FREE_HABIT_LIMIT habits; restoring must not become a
 * way around that. Pro keeps everything. */
export function limitForPlan(habits: Habit[], isPro: boolean): { habits: Habit[]; dropped: number } {
  if (isPro || habits.length <= FREE_HABIT_LIMIT) return { habits, dropped: 0 };
  return { habits: habits.slice(0, FREE_HABIT_LIMIT), dropped: habits.length - FREE_HABIT_LIMIT };
}
