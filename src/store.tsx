import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Habit, ThemeMode } from './types';
import { loadState, saveState } from './storage';
import { toggleCompletion } from './streaks';
import { initPurchases, hasProEntitlement } from './purchases';

interface StoreValue {
  ready: boolean;
  habits: Habit[];
  isPro: boolean;
  onboarded: boolean;
  themeMode: ThemeMode;
  reminderEnabled: boolean;
  reminderTime: string;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, patch: Partial<Pick<Habit, 'name' | 'emoji' | 'color'>>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitDate: (id: string, dateISO: string) => void;
  reorderHabit: (id: string, direction: -1 | 1) => void;
  setPro: (value: boolean) => void;
  setOnboarded: (value: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setReminder: (enabled: boolean, time: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const defaultState: AppState = {
  habits: [],
  isPro: false,
  onboarded: false,
  themeMode: 'dark',
  reminderEnabled: false,
  reminderTime: '09:00',
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

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
    });
  }, []);

  useEffect(() => {
    // avoid clobbering storage with the initial default state before hydration completes
    if (!hydrated.current) return;
    saveState(state);
  }, [state]);

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
  const setReminder = (enabled: boolean, time: string) =>
    setState((s) => ({ ...s, reminderEnabled: enabled, reminderTime: time }));

  return (
    <StoreContext.Provider
      value={{
        ready,
        habits: state.habits,
        isPro: state.isPro,
        onboarded: state.onboarded,
        themeMode: state.themeMode,
        reminderEnabled: state.reminderEnabled,
        reminderTime: state.reminderTime,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabitDate,
        reorderHabit,
        setPro,
        setOnboarded,
        setThemeMode,
        setReminder,
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
