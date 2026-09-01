import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from '@/theme';

export type ThemePreference = 'system' | 'light' | 'dark';
type ThemeContextValue = { colors: ThemeColors; isDark: boolean; preference: ThemePreference; setPreference: (value: ThemePreference) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = '@lexora/theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((value) => {
    if (value === 'system' || value === 'light' || value === 'dark') setPreferenceState(value);
  }).catch(() => undefined); }, []);

  const setPreference = (value: ThemePreference) => {
    setPreferenceState(value);
    AsyncStorage.setItem(STORAGE_KEY, value).catch(() => undefined);
  };
  const isDark = preference === 'dark' || (preference === 'system' && system === 'dark');
  const value = useMemo(() => ({ colors: isDark ? darkColors : lightColors, isDark, preference, setPreference }), [isDark, preference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme deve ser usado dentro de ThemeProvider');
  return value;
}
