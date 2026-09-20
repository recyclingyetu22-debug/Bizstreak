import React, { createContext, useContext } from 'react';
import { Theme, getTheme } from './theme';
import { ThemeMode } from './types';
import { useStore } from './store';

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode } = useStore();
  const theme = getTheme(themeMode);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider (inside StoreProvider)');
  return ctx;
}

export function isThemeMode(v: string): v is ThemeMode {
  return v === 'dark' || v === 'light';
}
