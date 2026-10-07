import { Habit } from './types';
import { Language, numberSeparators } from './i18n';
import { addDays } from './streaks';

function dowOfISO(dateISO: string): number {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** Monday of the week containing the date (business weeks start on Monday). */
export function weekStartISO(dateISO: string): string {
  const back = (dowOfISO(dateISO) + 6) % 7; // Mon=0 .. Sun=6
  return addDays(dateISO, -back);
}

export function entryOn(habit: Habit, dateISO: string) {
  return habit.entries?.[dateISO];
}

/** Sum of the amounts logged from `fromISO` to `toISO`, inclusive. */
export function sumAmount(habit: Habit, fromISO: string, toISO: string): number {
  if (!habit.entries) return 0;
  let total = 0;
  for (const [date, e] of Object.entries(habit.entries)) {
    if (date >= fromISO && date <= toISO && typeof e.amount === 'number') total += e.amount;
  }
  return total;
}

export function weekTotals(habit: Habit, todayISOValue: string) {
  const thisStart = weekStartISO(todayISOValue);
  const lastStart = addDays(thisStart, -7);
  return {
    thisWeek: sumAmount(habit, thisStart, todayISOValue),
    lastWeek: sumAmount(habit, lastStart, addDays(thisStart, -1)),
  };
}

/** Average per day that actually has an amount, over the last `days` days. */
export function dailyAverage(habit: Habit, todayISOValue: string, days = 30): number {
  if (!habit.entries) return 0;
  const from = addDays(todayISOValue, -(days - 1));
  let total = 0;
  let count = 0;
  for (const [date, e] of Object.entries(habit.entries)) {
    if (date >= from && date <= todayISOValue && typeof e.amount === 'number') {
      total += e.amount;
      count++;
    }
  }
  return count === 0 ? 0 : total / count;
}

/** Reads an amount the way people type it: "1250", "12.5", "12,5", "1,250.50",
 * "1.250,50", "1 250". Returns undefined for anything that isn't a clean,
 * non-negative number. */
export function parseAmount(text: string): number | undefined {
  let s = text.trim().replace(/\s/g, '');
  if (s === '' || !/^[0-9.,]+$/.test(s)) return undefined;

  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  let decimalSep: '.' | ',' | null = null;

  if (lastDot >= 0 && lastComma >= 0) {
    decimalSep = lastDot > lastComma ? '.' : ',';
  } else if (lastDot >= 0 || lastComma >= 0) {
    const sep = lastDot >= 0 ? '.' : ',';
    const parts = s.split(sep);
    const after = parts[parts.length - 1];
    // One separator, exactly three digits after, and not the only group:
    // "1,250" / "1.250" are thousands. Otherwise it is a decimal point.
    const looksLikeThousands = parts.length > 2 || (after.length === 3 && parts[0].length >= 1 && parts[0] !== '0');
    decimalSep = looksLikeThousands ? null : sep;
  }

  if (decimalSep) {
    const other = decimalSep === '.' ? ',' : '.';
    const idx = s.lastIndexOf(decimalSep);
    const intPart = s.slice(0, idx).split(other).join('').split(decimalSep).join('');
    const fracPart = s.slice(idx + 1).replace(/[.,]/g, '');
    if (intPart === '' && fracPart === '') return undefined;
    s = (intPart === '' ? '0' : intPart) + '.' + fracPart;
  } else {
    s = s.replace(/[.,]/g, '');
  }

  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 1e12) return undefined;
  return Math.round(n * 100) / 100;
}

/** 1250.5 -> "1,250.5" (en) or "1 250,5" (fr). Up to two decimals, trailing zeros dropped. */
export function formatAmount(n: number, lang: Language): string {
  const fixed = (Math.round(n * 100) / 100).toFixed(2).replace(/\.?0+$/, '');
  const [intPart, frac] = fixed.split('.');
  const { group, decimal } = numberSeparators(lang);
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  return frac ? grouped + decimal + frac : grouped;
}
