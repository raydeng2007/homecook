/**
 * Cross-platform test for OnboardingOverlay's web-only blur effect.
 *
 * The onboarding card uses `backdropFilter: blur(20px)` for a frosted-glass
 * look on web. This CSS property doesn't exist in React Native's StyleSheet
 * type, so the code wraps it with `as any`. The platform check is critical:
 *
 *  - On web: `backdropFilter` is applied, the card looks frosted
 *  - On iOS/Android: NOT applied (would crash on some RN versions with
 *    "Unknown style property: backdropFilter")
 *
 * If anyone removes the Platform.OS === 'web' guard, iOS/Android builds
 * could crash on the onboarding screen — which is the FIRST screen new
 * users see. Catastrophic UX failure.
 */

import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(
  path.resolve(__dirname, '../../components/OnboardingOverlay.tsx'),
  'utf-8'
);

describe('OnboardingOverlay platform-specific styling', () => {
  it('only applies backdropFilter when Platform.OS === "web"', () => {
    expect(source).toMatch(
      /Platform\.OS\s*===\s*['"]web['"][\s\S]{0,200}backdropFilter/
    );
  });

  it('falls back to empty style object on non-web platforms', () => {
    // The ternary should resolve to `{}` for native — not `null` or `undefined`
    // (which would crash style merging in some RN versions).
    expect(source).toMatch(/['"]web['"][\s\S]*?:\s*\{\s*\}/);
  });

  it('uses "as any" cast since backdropFilter is web-only and not in RN types', () => {
    // Required workaround — without it TypeScript fails to compile.
    // If someone removes the cast assuming RN types updated, the build breaks.
    expect(source).toMatch(/backdropFilter[\s\S]*?as\s+any/);
  });

  it('imports Platform from react-native', () => {
    expect(source).toMatch(/import\s+\{[^}]*\bPlatform\b[^}]*\}\s+from\s+['"]react-native['"]/);
  });
});
