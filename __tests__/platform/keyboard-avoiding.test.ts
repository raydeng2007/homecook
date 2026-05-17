/**
 * Cross-platform tests for KeyboardAvoidingView.
 *
 * KeyboardAvoidingView needs different `behavior` props per platform:
 *   - iOS: 'padding' (keyboard pushes view up; bottom padding grows)
 *   - Android: 'height' (Android resizes the view itself via the manifest)
 *
 * If anyone removes the Platform.OS branch, one platform will have broken
 * keyboard avoidance — text inputs disappearing behind the keyboard on iOS,
 * or the layout breaking on Android.
 *
 * Every screen that uses KeyboardAvoidingView MUST use the same pattern.
 */

import fs from 'fs';
import path from 'path';

const FILES_USING_KEYBOARD_AVOIDING = [
  'app/(auth)/email-sign-in.tsx',
  'app/(auth)/email-sign-up.tsx',
  'components/RecipeForm.tsx',
];

describe.each(FILES_USING_KEYBOARD_AVOIDING)('KeyboardAvoidingView behavior in %s', (file) => {
  const source = fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf-8');

  it('imports KeyboardAvoidingView from react-native', () => {
    expect(source).toMatch(/import\s+\{[^}]*\bKeyboardAvoidingView\b[^}]*\}\s+from\s+['"]react-native['"]/);
  });

  it('imports Platform from react-native', () => {
    expect(source).toMatch(/import\s+\{[^}]*\bPlatform\b[^}]*\}\s+from\s+['"]react-native['"]/);
  });

  it('uses Platform.OS === "ios" ? "padding" : "height" pattern', () => {
    // Must use the canonical pattern. If someone hardcodes "padding" or
    // "height" or inverts the ternary, this fails.
    expect(source).toMatch(
      /behavior\s*=\s*\{\s*Platform\.OS\s*===\s*['"]ios['"]\s*\?\s*['"]padding['"]\s*:\s*['"]height['"]\s*\}/
    );
  });
});

// ─── Verify the inverse — Platform.OS === 'android' shouldn't appear ───
// (would mean someone wrote the ternary backwards)

describe('No screen has the keyboard behavior ternary inverted', () => {
  it.each(FILES_USING_KEYBOARD_AVOIDING)('%s does not use inverted Platform.OS === "android" check', (file) => {
    const source = fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf-8');
    // The inverted form `Platform.OS === 'android' ? 'padding' : 'height'` would
    // give Android the iOS behavior and vice versa — broken UX on both.
    expect(source).not.toMatch(
      /behavior\s*=\s*\{\s*Platform\.OS\s*===\s*['"]android['"]\s*\?\s*['"]padding['"]/
    );
  });
});
