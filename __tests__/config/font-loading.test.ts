/**
 * Regression test for Bug I (icons-blank-in-production) — final form.
 *
 * History of bugs this guards:
 *
 *   v1.3.0-1.3.4 (FAILED ON ANDROID PRODUCTION):
 *     - Initial attempt loaded Ionicons via `useFonts({ ...Ionicons.font })`
 *       which spreads { ionicons: require('@expo/vector-icons/.../Ionicons.ttf') }
 *     - The expo-font config plugin pointed at the same node_modules path.
 *     - Web preview worked fine — document.fonts showed ionicons loaded.
 *     - Android production AAB shipped with blank icons everywhere because
 *       Metro/EAS can't reliably bundle assets referenced via node_modules
 *       paths into production builds.
 *
 *   v1.3.5+ (THIS FIX):
 *     - Font file copied to ./assets/fonts/Ionicons.ttf (Expo canonical location)
 *     - useFonts uses local require('../assets/fonts/Ionicons.ttf')
 *     - expo-font plugin in app.json points to ./assets/fonts/Ionicons.ttf
 *     - Font is registered under the EXACT name 'ionicons' (lowercase) so
 *       createIconSet's `Font.isLoaded('ionicons')` check matches.
 *
 * These tests verify the fix structure stays intact. If any of these fail,
 * Android production builds will likely ship with blank icons.
 */

import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const ROOT_LAYOUT_PATH = path.resolve(PROJECT_ROOT, 'app/_layout.tsx');
const LOCAL_FONT_PATH = path.resolve(PROJECT_ROOT, 'assets/fonts/Ionicons.ttf');
const APP_JSON_PATH = path.resolve(PROJECT_ROOT, 'app.json');

// ─── Local font asset ───────────────────────────────────────────────────

describe('Ionicons font is in the project assets folder (NOT node_modules)', () => {
  it('./assets/fonts/Ionicons.ttf exists', () => {
    // Metro reliably bundles assets that live inside the project tree.
    // node_modules asset paths are NOT reliable for production AAB/IPA builds.
    expect(fs.existsSync(LOCAL_FONT_PATH)).toBe(true);
  });

  it('Ionicons.ttf in assets is the real font (>400KB)', () => {
    const stats = fs.statSync(LOCAL_FONT_PATH);
    expect(stats.size).toBeGreaterThan(400000);
  });

  it('Ionicons.ttf in assets has TTF magic bytes', () => {
    // First 4 bytes of a TTF: 0x00 0x01 0x00 0x00 (or "OTTO" for OpenType)
    const buf = fs.readFileSync(LOCAL_FONT_PATH).slice(0, 4);
    const isTTF = buf[0] === 0x00 && buf[1] === 0x01 && buf[2] === 0x00 && buf[3] === 0x00;
    const isOTF = buf.toString('ascii') === 'OTTO';
    expect(isTTF || isOTF).toBe(true);
  });
});

// ─── Root layout font loading ──────────────────────────────────────────

describe('Root layout font loading (Bug I final fix)', () => {
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(ROOT_LAYOUT_PATH, 'utf-8');
  });

  it('imports useFonts from expo-font', () => {
    expect(source).toMatch(/import\s+\{[^}]*\buseFonts\b[^}]*\}\s+from\s+['"]expo-font['"]/);
  });

  it('imports SplashScreen from expo-splash-screen', () => {
    expect(source).toMatch(/import\s+(\*\s+as\s+)?SplashScreen\s+from\s+['"]expo-splash-screen['"]/);
  });

  it('calls useFonts with the LOCAL Ionicons.ttf path (NOT node_modules)', () => {
    // The font must be loaded via `require('../assets/fonts/Ionicons.ttf')`
    // Metro reliably bundles local asset requires; node_modules paths are flaky in production.
    expect(source).toMatch(/useFonts\s*\(\s*\{[\s\S]*?require\s*\(\s*['"][^'"]*assets\/fonts\/Ionicons\.ttf['"]\s*\)[\s\S]*?\}\s*\)/);
  });

  it('registers the font under the name "ionicons" (lowercase)', () => {
    // createIconSet checks Font.isLoaded('ionicons') (lowercase).
    // If anyone registers it as 'Ionicons' or capitalized, every icon goes blank.
    expect(source).toMatch(/useFonts\s*\(\s*\{[\s\S]*?\bionicons\s*:\s*require/);
  });

  it('does NOT load the font from node_modules path (production bug source)', () => {
    // This was the v1.3.0-1.3.4 bug: node_modules paths don't bundle reliably.
    expect(source).not.toMatch(/require\s*\(\s*['"][^'"]*node_modules[^'"]*Ionicons\.ttf['"]\s*\)/);
    // Strip line comments before checking — the doc comments explain the OLD
    // bad pattern and would otherwise trip the regex.
    const codeOnly = source
      .split('\n')
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
      .join('\n');
    expect(codeOnly).not.toMatch(/\.\.\.Ionicons\.font/);
  });

  it('prevents the splash screen from auto-hiding', () => {
    expect(source).toMatch(/SplashScreen\.preventAutoHideAsync\s*\(/);
  });

  it('hides the splash screen after fonts load OR fail', () => {
    expect(source).toMatch(/SplashScreen\.hideAsync\s*\(/);
    expect(source).toMatch(/fontsLoaded\s*\|\|\s*fontError/);
  });

  it('does NOT block rendering on fontsLoaded (was the v1.3.1 frozen-splash bug)', () => {
    expect(source).not.toMatch(/if\s*\(\s*!\s*fontsLoaded\s*\)\s*return\s+null/);
  });

  it('has a safety-net timeout that force-hides splash after 3 seconds', () => {
    expect(source).toMatch(/setTimeout\s*\([\s\S]*?SplashScreen\.hideAsync/);
  });

  it('captures fontError from useFonts return tuple', () => {
    expect(source).toMatch(/const\s+\[\s*fontsLoaded\s*,\s*fontError\s*\]/);
  });
});

// ─── app.json expo-font plugin configuration ───────────────────────────

describe('app.json expo-font plugin (build-time native embedding)', () => {
  const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf-8'));

  it('includes the expo-font plugin', () => {
    const plugins = appJson.expo.plugins;
    const fontPlugin = plugins.find(
      (p: unknown) => Array.isArray(p) && p[0] === 'expo-font'
    );
    expect(fontPlugin).toBeDefined();
  });

  it('expo-font plugin points to ./assets/fonts/Ionicons.ttf (NOT node_modules)', () => {
    const plugins = appJson.expo.plugins;
    const fontPlugin = plugins.find(
      (p: unknown) => Array.isArray(p) && p[0] === 'expo-font'
    );
    const fonts: string[] = fontPlugin[1].fonts ?? [];
    // Must include the local path so Metro/EAS bundles it reliably
    expect(fonts.some((f) => f === './assets/fonts/Ionicons.ttf')).toBe(true);
    // Must NOT include a node_modules path (was the production bug source)
    expect(fonts.some((f) => f.includes('node_modules'))).toBe(false);
  });
});

// ─── Glyph map sanity ──────────────────────────────────────────────────

describe('Ionicons glyph map has the icons we use throughout the app', () => {
  const glyphPath = path.resolve(
    PROJECT_ROOT,
    'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json'
  );
  const glyphs = JSON.parse(fs.readFileSync(glyphPath, 'utf-8'));

  // Every icon name actually used in the app — search via:
  //   grep -rohE "name=['\"][a-z-]+['\"]" app components | sort -u
  const required = [
    'add',
    'add-circle-outline',
    'alert-circle',
    'alert-circle-outline',
    'arrow-back',
    'book',
    'book-outline',
    'bookmark',
    'bookmark-outline',
    'calendar',
    'calendar-outline',
    'cart',
    'cart-outline',
    'checkmark',
    'chevron-back',
    'chevron-forward',
    'close-circle',
    'close-circle-outline',
    'cloud-offline-outline',
    'copy-outline',
    'create-outline',
    'enter-outline',
    'exit-outline',
    'flame-outline',
    'home',
    'home-outline',
    'key-outline',
    'log-out-outline',
    'moon',
    'pencil',
    'people',
    'people-outline',
    'search',
    'share-outline',
    'shield-checkmark-outline',
    'sunny',
  ];

  it.each(required)('"%s" exists in the Ionicons glyph map', (name) => {
    expect(typeof glyphs[name]).toBe('number');
  });
});
