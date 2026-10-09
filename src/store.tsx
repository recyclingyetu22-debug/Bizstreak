import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Habit, ThemeMode } from './types';
import { Language, detectLanguage } from './i18n';
import { loadState, saveState } from './storage';
import { getCurrentStreak, toggleCompletion } from './streaks';
import { Milestone, milestoneCrossed } from './milestones';
import { initPurchases, hasProEntitlement } from './purchases';
import { scheduleDailyReminder, syncHabitReminders } from './notifications';

export interface Celebration {
  habitId: string;
  name: string;
  emoji: string;
  milestone: Milestone;
}

interface StoreValue {
  celebration: Celebration | null;
  dismissCelebration: () => void;
  ready: boolean;
  habits: Habit[];
  isPro: boolean;
  onboarded: boolean;
  themeMode: ThemeMode;
  reminderEnabled: boolean;
  reminderTime: string;
  language: Language;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, patch: Partial<Pick<Habit, 'name' | 'emoji' | 'color' | 'days' | 'trackAmount' | 'unit' | 'reminderTime'>>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitDate: (id: string, dateISO: string) => void;
  reorderHabit: (id: string, direction: -1 | 1) => void;
  setPro: (value: boolean) => void;
  setOnboarded: (value: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setReminder: (enabled: boolean, time: string) => void;
  setLanguage: (language: Language) => void;
  restoreData: (habits: Habit[], themeMode: ThemeMode, language: Language) => void;
  setEntry: (id: string, dateISO: string, entry: { amount?: number; note?: string } | null) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const defaultState: AppState = {
  habits: [],
  isPro: false,
  onboarded: false,
  themeMode: 'dark',
  reminderEnabled: false,
  reminderTime: '09:00',
  language: detectLanguage(),
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  // Each habit's streak at the last look; null = take a fresh baseline without celebrating
  // (first load, or right after a restore).
  const lastStreaks = useRef<Record<string, number> | null>(null);
  const celebrated = useRef(new Set<string>());

  useEffect(() => {
    loadState().then(async (s) => {
      // A no-op in Expo Go or before RevenueCat API keys are set (see
      // src/purchases.ts) — otherwise reconciles isPro with whatever this
      // account has actually bought, in case it changed on another device
      // or was refunded, before showing the app's saved local guess.
      await initPurchases();
      const entitled = await hasProEntitlement();
      setState(entitled ? { ...s, isPro: true } : s);
      setReady(true);
      hydrated.current = true;
      // Re-create saved reminders on every start so they always use the current
      // (audible) notification channel. Never allowed to break startup.
      try {
        if (s.reminderEnabled) await scheduleDailyReminder(s.reminderTime, s.language);
        await syncHabitReminders(s.habits, s.language);
      } catch {
        /* reminders are best-effort */
      }
    });
  }, []);

  useEffect(() => {
    // avoid clobbering storage with the initial default state before hydration completes
    if (!hydrated.current) return;
    saveState(state);
  }, [state]);

  // A habit whose streak just reached 7, 30 or 100 days gets a celebration.
  useEffect(() => {
    if (!hydrated.current) return;
    const now: Record<string, number> = {};
    state.habits.forEach((h) => {
      now[h.id] = getCurrentStreak(h);
    });
    const before = lastStreaks.current;
    lastStreaks.current = now;
    if (!before) return;
    for (const h of state.habits) {
      const m = milestoneCrossed(before[h.id] ?? now[h.id], now[h.id]);
      const key = `${h.id}:${m}`;
      if (m && !celebrated.current.has(key)) {
        celebrated.current.add(key);
        setCelebration({ habitId: h.id, name: h.name, emoji: h.emoji, milestone: m });
        break;
      }
    }
  }, [state.habits]);

  const addHabit = (habit: Habit) => setState((s) => ({ ...s, habits: [...s.habits, habit] }));

  const updateHabit: StoreValue['updateHabit'] = (id, patch) =>
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));

  const deleteHabit = (id: string) =>
    setState((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));

  const toggleHabitDate = (id: string, dateISO: string) =>
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) => (h.id === id ? toggleCompletion(h, dateISO) : h)),
    }));

  const reorderHabit = (id: string, direction: -1 | 1) =>
    setState((s) => {
      const idx = s.habits.findIndex((h) => h.id === id);
      const target = idx + direction;
      if (idx === -1 || target < 0 || target >= s.habits.length) return s;
      const habits = [...s.habits];
      [habits[idx], habits[target]] = [habits[target], habits[idx]];
      return { ...s, habits };
    });

  const setPro = (value: boolean) => setState((s) => ({ ...s, isPro: value }));
  const setOnboarded = (value: boolean) => setState((s) => ({ ...s, onboarded: value }));
  const setThemeMode = (mode: ThemeMode) => setState((s) => ({ ...s, themeMode: mode }));
  const setLanguage = (language: Language) => setState((s) => ({ ...s, language }));
  // Replaces the habits with a restored backup; purchase status is untouched.
  // Saves (or clears) a day's note/amount. Saving something also marks the day done.
  const setEntry: StoreValue['setEntry'] = (id, dateISO, entry) =>
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) => {
        if (h.id !== id) return h;
        const entries = { ...(h.entries ?? {}) };
        if (!entry || (entry.amount === undefined && !entry.note)) {
          delete entries[dateISO];
          return { ...h, entries: Object.keys(entries).length ? entries : undefined };
        }
        entries[dateISO] = entry;
        const completions = h.completions.includes(dateISO) ? h.completions : [...h.completions, dateISO].sort();
        return { ...h, entries, completions };
      }),
    }));
  const restoreData = (habits: Habit[], themeMode: ThemeMode, language: Language) => {
    lastStreaks.current = null; // a restored streak is not a new achievement
    setState((s) => ({ ...s, habits, themeMode, language }));
  };
  const setReminder = (enabled: boolean, time: string) =>
    setState((s) => ({ ...s, reminderEnabled: enabled, reminderTime: time }));

  return (
    <StoreContext.Provider
      value={{
        ready,
        celebration,
        dismissCelebration: () => setCelebration(null),
        habits: state.habits,
        isPro: state.isPro,
        onboarded: state.onboarded,
        themeMode: state.themeMode,
        reminderEnabled: state.reminderEnabled,
        reminderTime: state.reminderTime,
        language: state.language,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabitDate,
        reorderHabit,
        setPro,
        setOnboarded,
        setThemeMode,
        setReminder,
        setLanguage,
        restoreData,
        setEntry,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
