import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { vars } from 'nativewind';

export type ThemeMode = 'dark' | 'light';

const DARK_VARS = vars({
  '--color-bg': '#121212',
  '--color-surface-1': '#1E1E1E',
  '--color-surface-2': '#232323',
  '--color-surface-3': '#252525',
  '--color-surface-4': '#272727',
  '--color-surface-5': '#2C2C2C',
  '--color-text-high': 'rgba(255,255,255,0.87)',
  '--color-text-medium': 'rgba(255,255,255,0.60)',
  '--color-text-disabled': 'rgba(255,255,255,0.38)',
  '--color-on-primary': '#000000',
  '--color-border-subtle': 'rgba(255,255,255,0.08)',
  '--color-border-card': 'rgba(187,134,252,0.12)',
  '--color-border-focus': 'rgba(187,134,252,0.35)',
});

const LIGHT_VARS = vars({
  '--color-bg': '#FAFAFA',
  '--color-surface-1': '#FFFFFF',
  '--color-surface-2': '#F5F5F5',
  '--color-surface-3': '#EEEEEE',
  '--color-surface-4': '#E0E0E0',
  '--color-surface-5': '#D6D6D6',
  '--color-text-high': 'rgba(0,0,0,0.87)',
  '--color-text-medium': 'rgba(0,0,0,0.60)',
  '--color-text-disabled': 'rgba(0,0,0,0.38)',
  '--color-on-primary': '#FFFFFF',
  '--color-border-subtle': 'rgba(0,0,0,0.06)',
  '--color-border-card': 'rgba(187,134,252,0.15)',
  '--color-border-focus': 'rgba(187,134,252,0.40)',
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

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
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
