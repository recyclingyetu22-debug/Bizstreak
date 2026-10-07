// Streak milestones worth celebrating (in days).
export const MILESTONES = [7, 30, 100] as const;
export type Milestone = (typeof MILESTONES)[number];

/** The biggest milestone reached by going from streak `before` to `after`
 * (e.g. 6 -> 7 gives 7), or null if none was crossed. */
export function milestoneCrossed(before: number, after: number): Milestone | null {
  if (!(after > before)) return null;
  let hit: Milestone | null = null;
  for (const m of MILESTONES) if (before < m && after >= m) hit = m;
  return hit;
}

/** Milestones a habit has earned, judged by its best-ever streak. */
export function earnedMilestones(bestStreak: number): Milestone[] {
  return MILESTONES.filter((m) => bestStreak >= m);
}
