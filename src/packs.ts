import { Habit, HABIT_COLORS } from './types';
import type { TKey } from './i18n';

// Ready-made sets of habits for a type of business. Every pack has exactly
// three habits so it always fits the free plan (3 habits) on its own.

export interface PackHabit {
  key: TKey; // translated name
  emoji: string;
  trackAmount?: boolean; // e.g. sales: record a number each day
}

export interface Pack {
  id: string;
  emoji: string;
  nameKey: TKey;
  descKey: TKey;
  habits: PackHabit[];
}

export const PACKS: Pack[] = [
  {
    id: 'shop',
    emoji: '🛒',
    nameKey: 'pack.shop',
    descKey: 'pack.shop.desc',
    habits: [
      { key: 'pack.shop.h1', emoji: '📦' },
      { key: 'pack.shop.h2', emoji: '💰', trackAmount: true },
      { key: 'pack.shop.h3', emoji: '🧾' },
    ],
  },
  {
    id: 'salon',
    emoji: '💇',
    nameKey: 'pack.salon',
    descKey: 'pack.salon.desc',
    habits: [
      { key: 'pack.salon.h1', emoji: '📅' },
      { key: 'pack.salon.h2', emoji: '🧴' },
      { key: 'pack.salon.h3', emoji: '💰', trackAmount: true },
    ],
  },
  {
    id: 'restaurant',
    emoji: '🍽️',
    nameKey: 'pack.restaurant',
    descKey: 'pack.restaurant.desc',
    habits: [
      { key: 'pack.restaurant.h1', emoji: '🥬' },
      { key: 'pack.restaurant.h2', emoji: '🧼' },
      { key: 'pack.restaurant.h3', emoji: '💰', trackAmount: true },
    ],
  },
  {
    id: 'freelancer',
    emoji: '💻',
    nameKey: 'pack.freelancer',
    descKey: 'pack.freelancer.desc',
    habits: [
      { key: 'pack.freelancer.h1', emoji: '📝' },
      { key: 'pack.freelancer.h2', emoji: '🎯' },
      { key: 'pack.freelancer.h3', emoji: '📞' },
    ],
  },
  {
    id: 'farm',
    emoji: '🌾',
    nameKey: 'pack.farm',
    descKey: 'pack.farm.desc',
    habits: [
      { key: 'pack.farm.h1', emoji: '💧' },
      { key: 'pack.farm.h2', emoji: '🚜', trackAmount: true },
      { key: 'pack.farm.h3', emoji: '🌽' },
    ],
  },
];

export interface PackPlan {
  habits: Habit[]; // what will be added
  skippedExisting: number; // already in the list (same name)
  skippedLimit: number; // would not fit in the free plan
}

/** Works out which habits of a pack to add: never a duplicate of an existing
 * habit, never more than the plan allows. `slots` = how many more are allowed. */
export function planPack(
  pack: Pack,
  existing: Habit[],
  slots: number,
  name: (key: TKey) => string,
  today: string,
  makeId: () => string
): PackPlan {
  const have = new Set(existing.map((h) => h.name.trim().toLowerCase()));
  const habits: Habit[] = [];
  let skippedExisting = 0;
  let skippedLimit = 0;
  pack.habits.forEach((ph) => {
    const n = name(ph.key);
    if (have.has(n.trim().toLowerCase())) {
      skippedExisting++;
      return;
    }
    if (habits.length >= slots) {
      skippedLimit++;
      return;
    }
    habits.push({
      id: makeId(),
      name: n,
      emoji: ph.emoji,
      color: HABIT_COLORS[(existing.length + habits.length) % HABIT_COLORS.length],
      trackAmount: ph.trackAmount ? true : undefined,
      createdAt: today,
      completions: [],
    });
  });
  return { habits, skippedExisting, skippedLimit };
}
