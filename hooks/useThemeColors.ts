import { useTheme } from '@/contexts/ThemeContext';

/**
 * Semantic theme colors for use in non-NativeWind props
 * (Ionicons `color=`, `placeholderTextColor`, `StatusBar style`, etc.)
 *
 * NativeWind `className` props already use CSS vars and are theme-aware.
 * This hook provides raw color strings for props that can't use className.
 */
export function useThemeColors() {
  const { isDark } = useTheme();

  return {
    // Text hierarchy
    textHigh: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
    textMedium: isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.60)',
    textDisabled: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)',

    // On-primary (text/icons on top of primary-colored backgrounds)
    onPrimary: isDark ? '#000000' : '#FFFFFF',

    // Primary accent (constant across themes)
    primary: '#BB86FC',
    primaryVariant: '#3700B3',
    secondary: '#03DAC6',
    error: '#CF6679',

    // Surfaces
    background: isDark ? '#121212' : '#FAFAFA',
    surface1: isDark ? '#1E1E1E' : '#FFFFFF',

    // StatusBar
    statusBarStyle: (isDark ? 'light' : 'dark') as 'light' | 'dark',

    // Theme flag
    isDark,
  };
}
