import { ThemeMode } from './types';

export const darkTheme = {
  mode: 'dark' as ThemeMode,
  bg: '#0B0F14',
  bgElevated: '#141B22',
  card: '#1A222B',
  border: '#252F3A',
  text: '#F4F6F8',
  textMuted: '#8B98A5',
  textFaint: '#5A6672',
  accent: '#22C55E',
  accentOn: '#04140A',
  danger: '#EF4444',
  gold: '#F59E0B',
  gridEmpty: 'rgba(255,255,255,0.06)',
};

export const lightTheme = {
  mode: 'light' as ThemeMode,
  bg: '#F7F8FA',
  bgElevated: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E4E8EC',
  text: '#111827',
  textMuted: '#5D6773',
  textFaint: '#9AA3AC',
  accent: '#16A34A',
  accentOn: '#FFFFFF',
  danger: '#DC2626',
  gold: '#B45309',
  gridEmpty: 'rgba(17,24,39,0.07)',
};

export type Theme = typeof darkTheme;

export function getTheme(mode: ThemeMode): Theme {
  return mode === 'light' ? lightTheme : darkTheme;
}

// Kept for any legacy import; prefer useTheme() from ThemeContext in components.
export const theme = darkTheme;
