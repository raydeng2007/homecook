/**
 * Cross-platform StatusBar consistency tests.
 *
 * Every screen MUST render `<StatusBar style={statusBarStyle} />` from
 * expo-status-bar with the theme-derived statusBarStyle. This ensures:
 *
 *  - iOS: status bar text (time, battery) is light on dark theme, dark on
 *    light theme. Without expo-status-bar, iOS shows the previous screen's
 *    style or the system default — looks broken when transitioning between
 *    auth (dark) and app (theme-dependent) screens.
 *
 *  - Android: status bar background color is handled by the system, but
 *    the icon style still needs to match the theme.
 *
 * If a screen forgets the StatusBar, the user gets inconsistent appearance
 * — which is exactly the kind of issue iOS reviewers flag.
 */

import fs from 'fs';
import path from 'path';

const SCREEN_FILES = [
  'app/(auth)/login.tsx',
  'app/(auth)/email-sign-in.tsx',
  'app/(auth)/email-sign-up.tsx',
  'app/(auth)/email-confirmation.tsx',
  'app/(app)/index.tsx',
  'app/(app)/planner.tsx',
  'app/(app)/shopping.tsx',
  'app/(app)/household.tsx',
  'app/(app)/recipes/index.tsx',
  'app/(app)/recipes/create.tsx',
  'app/(app)/recipes/edit.tsx',
];

describe.each(SCREEN_FILES)('StatusBar consistency in %s', (file) => {
  const source = fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf-8');

  it('imports StatusBar from expo-status-bar (NOT react-native)', () => {
    // expo-status-bar is the cross-platform-correct one. react-native's
    // StatusBar has different behavior on iOS vs Android out of the box.
    expect(source).toMatch(/import\s+\{[^}]*\bStatusBar\b[^}]*\}\s+from\s+['"]expo-status-bar['"]/);
  });

  it('renders <StatusBar style={statusBarStyle} />', () => {
    expect(source).toMatch(/<StatusBar\s+style=\{statusBarStyle\}\s*\/>/);
  });

  it('gets statusBarStyle from the useThemeColors hook', () => {
    // statusBarStyle is theme-derived, not hardcoded. If someone hardcodes
    // "dark" or "light", it breaks when the user toggles theme.
    expect(source).toMatch(/statusBarStyle/);
    // Should NOT have hardcoded values like style="dark" or style="light"
    expect(source).not.toMatch(/<StatusBar\s+style=["'](dark|light)["']/);
  });
});

// ─── useThemeColors hook itself ───────────────────────────────────────

describe('useThemeColors returns a valid statusBarStyle for both platforms', () => {
  const hookSource = fs.readFileSync(
    path.resolve(__dirname, '../../hooks/useThemeColors.ts'),
    'utf-8'
  );

  it('exports statusBarStyle as one of the valid expo-status-bar values', () => {
    expect(hookSource).toMatch(/statusBarStyle/);
    // Valid values: 'auto' | 'inverted' | 'light' | 'dark'
    expect(hookSource).toMatch(/['"`](light|dark|auto|inverted)['"`]/);
  });
});
