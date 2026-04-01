import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { vars } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@homecook_theme';

export type ThemeMode = 'dark' | 'light';

// ──────────────────────────────────────────────────────
// Bordeaux & Champagne palette
// To swap palette: update hex values here + useThemeColors.ts + tailwind warm[]
// ──────────────────────────────────────────────────────

const DARK_VARS = vars({
  // Surfaces — warm brown-tinted (from palette #0D0C00 → #402814)
  '--color-bg': '#0D0C00',
  '--color-surface-1': '#161210',
  '--color-surface-2': '#1E1814',
  '--color-surface-3': '#261F1A',
  '--color-surface-4': '#302620',
  '--color-surface-5': '#402814',
  // Text — warm off-white
  '--color-text-high': 'rgba(250,243,235,0.90)',
  '--color-text-medium': 'rgba(250,243,235,0.62)',
  '--color-text-disabled': 'rgba(250,243,235,0.38)',
  // On-primary (text on champagne buttons — dark brown)
  '--color-on-primary': '#1A0F08',
  // Borders — champagne-tinted
  '--color-border-subtle': 'rgba(217,185,145,0.08)',
  '--color-border-card': 'rgba(217,185,145,0.15)',
  '--color-border-focus': 'rgba(217,185,145,0.35)',
});

const LIGHT_VARS = vars({
  // Surfaces — warm cream/parchment
  '--color-bg': '#FAF3EB',
  '--color-surface-1': '#FFFFFF',
  '--color-surface-2': '#F5EDE3',
  '--color-surface-3': '#EDE4D9',
  '--color-surface-4': '#E0D5C8',
  '--color-surface-5': '#D4C9BC',
  // Text — warm dark brown
  '--color-text-high': 'rgba(38,1,1,0.90)',
  '--color-text-medium': 'rgba(38,1,1,0.62)',
  '--color-text-disabled': 'rgba(38,1,1,0.38)',
  // On-primary (text on champagne buttons — cream white)
  '--color-on-primary': '#FAF3EB',
  // Borders — bordeaux-tinted
  '--color-border-subtle': 'rgba(64,1,6,0.08)',
  '--color-border-card': 'rgba(64,1,6,0.15)',
  '--color-border-focus': 'rgba(64,40,20,0.35)',
});

type ThemeContextType = {
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  themeVars: ReturnType<typeof vars>;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  isDark: true,
  toggleTheme: () => {},
  themeVars: DARK_VARS,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  // Load persisted theme on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setMode(stored);
      }
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const isDark = mode === 'dark';
  const themeVars = isDark ? DARK_VARS : LIGHT_VARS;

  return (
    <ThemeContext.Provider value={{ mode, isDark, toggleTheme, themeVars }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
