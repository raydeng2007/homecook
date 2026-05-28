/**
 * Regression tests for SVG-based icon rendering.
 *
 * History: Releases 1.3.0 through 1.3.6 chased a production icon-rendering bug
 * where the Ionicons font failed to load in AAB/IPA builds. After many failed
 * attempts (asset paths, expo-font plugin, useFonts, Bridge mode), we switched
 * to SVG-based icons via lucide-react-native. SVG icons are React components,
 * not OS-level fonts — guaranteed to render in production.
 *
 * These tests guard the new architecture:
 *   1. No source code imports `@expo/vector-icons` anymore
 *   2. The Icon component exists and exports the SVG-backed Icon
 *   3. Every Ionicons name actually used in the app is mapped in Icon.tsx
 *   4. No `<Ionicons` JSX usages remain in source
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

function grepSources(pattern: string): string[] {
  try {
    const result = execSync(
      `grep -rln "${pattern}" app components 2>/dev/null || true`,
      { cwd: PROJECT_ROOT, encoding: 'utf-8' }
    );
    return result.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

describe('SVG icon architecture — no font-based icons in source', () => {
  it('no source file imports { Ionicons } from @expo/vector-icons', () => {
    const offending = grepSources("import { Ionicons } from '@expo/vector-icons'");
    expect(offending).toEqual([]);
  });

  it('no source file uses <Ionicons JSX', () => {
    const offending = grepSources('<Ionicons');
    // Allow the Icon.tsx itself to mention "Ionicons" in comments/docs
    expect(offending.filter((f) => !f.endsWith('components/Icon.tsx'))).toEqual([]);
  });

  it('components/Icon.tsx exists and is the canonical icon entrypoint', () => {
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'components/Icon.tsx'))).toBe(true);
  });

  it('Icon.tsx imports from lucide-react-native (SVG icon library)', () => {
    const src = fs.readFileSync(path.join(PROJECT_ROOT, 'components/Icon.tsx'), 'utf-8');
    expect(src).toMatch(/from\s+['"]lucide-react-native['"]/);
  });

  it('Icon.tsx exports a named "Icon" component', () => {
    const src = fs.readFileSync(path.join(PROJECT_ROOT, 'components/Icon.tsx'), 'utf-8');
    expect(src).toMatch(/export\s+(function|const)\s+Icon\b/);
  });

  it('Icon.tsx renders nothing for unmapped names (no fallback that crashes the app)', () => {
    const src = fs.readFileSync(path.join(PROJECT_ROOT, 'components/Icon.tsx'), 'utf-8');
    // Either returns null OR explicit null guard
    expect(src).toMatch(/return\s+null/);
  });
});

describe('Icon mapping covers every name actually used in the app', () => {
  const iconSrc = fs.readFileSync(path.join(PROJECT_ROOT, 'components/Icon.tsx'), 'utf-8');

  // Extract the keys present in the IONICONS_TO_LUCIDE mapping object.
  // Keys are either bare identifiers or quoted strings.
  const mappingBlock = iconSrc.match(/IONICONS_TO_LUCIDE[\s\S]*?\{([\s\S]*?)\n\};/)?.[1] ?? '';
  const mappedKeys = new Set<string>();
  for (const match of mappingBlock.matchAll(/(?:^|\s|,)(?:['"]([^'"]+)['"]|([a-zA-Z][\w-]*))\s*:/g)) {
    const key = match[1] ?? match[2];
    if (key) mappedKeys.add(key);
  }

  // Find every name="..." prop passed to <Icon ...> in app sources,
  // AND every icon name stored in dynamic config (e.g. CustomTabBar:
  // `icon: 'home', iconOutline: 'home-outline'`, SocialLoginButton's
  // `ionicon: 'logo-apple'`).
  let usedNames = new Set<string>();
  try {
    const grepOut = execSync(
      `grep -rhE "name=\\"[a-zA-Z-]+\\"|(icon|iconOutline|ionicon):\\s*'[a-zA-Z-]+'" app components 2>/dev/null || true`,
      { cwd: PROJECT_ROOT, encoding: 'utf-8' }
    );
    // JSX form: name="foo"
    for (const match of grepOut.matchAll(/name="([a-z][a-z-]*)"/g)) {
      usedNames.add(match[1]);
    }
    // Config form: icon: 'foo' / iconOutline: 'foo' / ionicon: 'foo'
    for (const match of grepOut.matchAll(/(?:icon|iconOutline|ionicon):\s*'([a-zA-Z][a-zA-Z-]*)'/g)) {
      usedNames.add(match[1]);
    }
  } catch {
    // ignore
  }

  // Filter out names that aren't icon names — these are tab route names
  // (Tabs.Screen name="...") and other React Navigation things.
  const NON_ICON_NAMES = new Set([
    'index',
    'recipes',
    'shopping',
    'household',
    'planner',
    // Single-character "icons" used by SocialLoginButton as text (G, f, @)
    'f',
    'G',
    '@',
  ]);
  usedNames = new Set([...usedNames].filter((n) => !NON_ICON_NAMES.has(n) && n.length > 1));

  it('finds at least 10 unique icon names used in the codebase (sanity)', () => {
    expect(usedNames.size).toBeGreaterThanOrEqual(10);
  });

  it('every used icon name has a mapping in Icon.tsx', () => {
    const unmapped = [...usedNames].filter((n) => !mappedKeys.has(n));
    if (unmapped.length > 0) {
      throw new Error(
        `Missing Lucide mappings in components/Icon.tsx for these Ionicons names:\n` +
          unmapped.map((n) => `  - ${n}`).join('\n') +
          `\n\nAdd entries to IONICONS_TO_LUCIDE.`
      );
    }
    expect(unmapped).toEqual([]);
  });
});

describe('Production build does not depend on Ionicons font asset', () => {
  it('app.json does NOT have an expo-font plugin entry for Ionicons (we use SVG now)', () => {
    const appJson = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'app.json'), 'utf-8')
    );
    const fontPlugin = appJson.expo.plugins.find(
      (p: unknown) => Array.isArray(p) && p[0] === 'expo-font'
    );
    // The plugin should be removed since we're SVG-based now.
    // If a plugin is still present, that's fine as long as it doesn't reference Ionicons.
    if (fontPlugin) {
      const fonts: string[] = fontPlugin[1]?.fonts ?? [];
      const referencesIonicons = fonts.some((f) => f.toLowerCase().includes('ionicons'));
      expect(referencesIonicons).toBe(false);
    } else {
      expect(fontPlugin).toBeUndefined();
    }
  });

  it('root layout does NOT call useFonts for Ionicons', () => {
    const src = fs.readFileSync(path.join(PROJECT_ROOT, 'app/_layout.tsx'), 'utf-8');
    // useFonts may still exist for other custom fonts in the future, but it
    // should not reference Ionicons.
    const useFontsBlock = src.match(/useFonts\s*\([\s\S]*?\)/)?.[0] ?? '';
    expect(useFontsBlock.toLowerCase()).not.toContain('ionicons');
  });
});
