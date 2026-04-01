import { useTheme } from '@/contexts/ThemeContext';

/**
 * Semantic theme colors for use in non-NativeWind props
 * (Ionicons `color=`, `placeholderTextColor`, `StatusBar style`, etc.)
 *
 * NativeWind `className` props already use CSS vars and are theme-aware.
 * This hook provides raw color strings for props that can't use className.
 *
 * ── To change palette: update values here + ThemeContext.tsx + tailwind warm[] ──
 */
export function useThemeColors() {
  const { isDark } = useTheme();

  return {
    // Text hierarchy — warm off-white / warm dark brown
    textHigh: isDark ? 'rgba(250,243,235,0.90)' : 'rgba(38,1,1,0.90)',
    textMedium: isDark ? 'rgba(250,243,235,0.62)' : 'rgba(38,1,1,0.62)',
    textDisabled: isDark ? 'rgba(250,243,235,0.38)' : 'rgba(38,1,1,0.38)',

    // On-primary (text/icons on primary-colored backgrounds)
    onPrimary: isDark ? '#1A0F08' : '#FAF3EB',

    // Primary accent — champagne in dark, bordeaux in light
    primary: isDark ? '#D9B991' : '#400106',
    primaryVariant: isDark ? '#B89870' : '#260101',
    // Secondary — dusty bordeaux in dark, chocolate in light
    secondary: isDark ? '#8B3A3A' : '#402814',
    // Error — warm terracotta
    error: isDark ? '#E07A5F' : '#C24D35',

    // Surfaces
    background: isDark ? '#0D0C00' : '#FAF3EB',
    surface1: isDark ? '#161210' : '#FFFFFF',

    // StatusBar
    statusBarStyle: (isDark ? 'light' : 'dark') as 'light' | 'dark',

    // Theme flag
    isDark,
  };
}
