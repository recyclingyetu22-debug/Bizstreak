import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from './types';
import { detectLanguage } from './i18n';

const STORAGE_KEY = '@bizstreak/state/v1';

const defaultState: AppState = {
  habits: [],
  isPro: false,
  onboarded: false,
  themeMode: 'dark',
  reminderEnabled: false,
  reminderTime: '09:00',
  language: detectLanguage(),
};

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch (e) {
    console.warn('Failed to load state', e);
    return defaultState;
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state', e);
  }
}
