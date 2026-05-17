/**
 * Regression test for Bug I: Ionicons font not loaded.
 *
 * The root layout MUST explicitly load the Ionicons font before rendering
 * any UI. Without this, production builds render every icon (tab bar,
 * checkboxes, chevrons, +/x buttons, etc.) as a blank circle because the
 * font hasn't downloaded yet when the components mount.
 *
 * If anyone removes the useFonts hook or stops gating rendering on
 * fontsLoaded, this test fails — catching the regression before it ships.
 */

import fs from 'fs';
import path from 'path';

const ROOT_LAYOUT_PATH = path.resolve(__dirname, '../../app/_layout.tsx');

describe('Root layout font loading (Bug I regression)', () => {
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(ROOT_LAYOUT_PATH, 'utf-8');
  });

  it('exists at the expected path', () => {
    expect(fs.existsSync(ROOT_LAYOUT_PATH)).toBe(true);
  });

  it('imports useFonts from expo-font', () => {
    // Either named import or namespace; allow whitespace variations.
    expect(source).toMatch(/import\s+\{[^}]*\buseFonts\b[^}]*\}\s+from\s+['"]expo-font['"]/);
  });

  it('imports Ionicons from @expo/vector-icons', () => {
    expect(source).toMatch(/import\s+\{[^}]*\bIonicons\b[^}]*\}\s+from\s+['"]@expo\/vector-icons['"]/);
  });

  it('imports SplashScreen from expo-splash-screen', () => {
    // Either `import * as SplashScreen` or `import SplashScreen`.
    expect(source).toMatch(/import\s+(\*\s+as\s+)?SplashScreen\s+from\s+['"]expo-splash-screen['"]/);
  });

  it('calls useFonts with Ionicons.font', () => {
    // Match: useFonts({ ...Ionicons.font }) — allow whitespace + extra entries
    expect(source).toMatch(/useFonts\s*\(\s*\{[\s\S]*?\.\.\.Ionicons\.font[\s\S]*?\}\s*\)/);
  });

  it('prevents the splash screen from auto-hiding', () => {
    expect(source).toMatch(/SplashScreen\.preventAutoHideAsync\s*\(/);
  });

  it('hides the splash screen after fonts load', () => {
    expect(source).toMatch(/SplashScreen\.hideAsync\s*\(/);
  });

  it('does NOT gate rendering on fontsLoaded — was production hang on Android', () => {
    // Earlier we had `if (!fontsLoaded) return null;` which caused a frozen
    // splash on Android when useFonts hung. We removed it so the app always
    // renders. Catches regression if anyone re-adds the hard gate.
    expect(source).not.toMatch(/if\s*\(\s*!\s*fontsLoaded\s*\)\s*return\s+null/);
  });

  it('has a safety-net timeout that hides splash even if fonts never load', () => {
    // The 3-second setTimeout ensures the splash always hides eventually,
    // even if useFonts hangs. Without this, a font load failure would leave
    // users staring at a frozen splash screen forever.
    expect(source).toMatch(/setTimeout\s*\([\s\S]*?SplashScreen\.hideAsync/);
  });

  it('captures the fontError from useFonts so failures hide splash too', () => {
    // useFonts returns [loaded, error]. Both must trigger SplashScreen.hideAsync.
    expect(source).toMatch(/const\s+\[\s*fontsLoaded\s*,\s*fontError\s*\]/);
    expect(source).toMatch(/fontsLoaded\s*\|\|\s*fontError/);
  });
});

// ── Bonus: verify the actual font file is available on disk ─────────────

describe('Ionicons font asset is bundled with @expo/vector-icons', () => {
  const FONT_FILE_PATH = path.resolve(
    __dirname,
    '../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'
  );

  it('Ionicons.ttf exists in node_modules', () => {
    // If the package layout changes, find the .ttf via glob — but the standard
    // path should be stable for @expo/vector-icons v14+.
    expect(fs.existsSync(FONT_FILE_PATH)).toBe(true);
  });

  it('Ionicons.ttf is non-empty', () => {
    const stats = fs.statSync(FONT_FILE_PATH);
    expect(stats.size).toBeGreaterThan(10000); // real font is ~400KB
  });

  it('Ionicons glyph map has the icons we use', () => {
    const glyphPath = path.resolve(
      __dirname,
      '../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json'
    );
    const glyphs = JSON.parse(fs.readFileSync(glyphPath, 'utf-8'));
    // These names are used throughout the app; if any go missing, builds break visually.
    const required = [
      'add',
      'checkmark',
      'close-circle',
      'close-circle-outline',
      'home',
      'home-outline',
      'cart',
      'cart-outline',
      'book',
      'book-outline',
      'people',
      'people-outline',
      'calendar',
      'calendar-outline',
      'search',
      'chevron-back',
      'chevron-forward',
      'pencil',
      'create-outline',
      'add-circle-outline',
      'alert-circle',
      'alert-circle-outline',
    ];
    for (const name of required) {
      expect(typeof glyphs[name]).toBe('number');
    }
  });
});
