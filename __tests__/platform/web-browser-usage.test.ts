/**
 * Cross-platform tests for web browser / URL handling.
 *
 * The app must use `expo-web-browser` (WebBrowser.openBrowserAsync) for
 * external URLs, NOT `Linking.openURL`. Why?
 *
 * - WebBrowser opens an in-app browser sheet (SFSafariViewController on iOS,
 *   Chrome Custom Tabs on Android). The app stays foregrounded, so the
 *   Supabase session doesn't expire while the user reads.
 *
 * - Linking.openURL opens an external browser app (Safari, Chrome). On iOS
 *   this backgrounds your app. Returning to the app, the session may have
 *   expired and queries fail silently. This caused an Apple rejection
 *   (Guideline 2.1a: "an error popup when returning from Privacy Policy").
 *
 * If anyone re-introduces Linking.openURL for an http(s) URL, this test
 * fails and blocks the build. (Linking is still OK for non-http schemes
 * like mailto:, tel:, sms:.)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const SEARCH_DIRS = ['app', 'lib', 'components', 'contexts', 'hooks'];

function findFilesContaining(pattern: string): string[] {
  // Use grep -rl to find files. -l = list filenames only.
  try {
    const result = execSync(
      `grep -rl "${pattern}" ${SEARCH_DIRS.join(' ')} 2>/dev/null || true`,
      { cwd: PROJECT_ROOT, encoding: 'utf-8' }
    );
    return result
      .split('\n')
      .filter(Boolean)
      .map((p) => path.resolve(PROJECT_ROOT, p));
  } catch {
    return [];
  }
}

describe('External URL handling — use WebBrowser, not Linking', () => {
  it('NO source file calls Linking.openURL with an http/https URL', () => {
    // Linking.openURL is OK for mailto:, tel:, sms: — but never for http(s).
    // Search for patterns like: Linking.openURL('https://...') or Linking.openURL(`https://...`)
    const files = findFilesContaining('Linking.openURL');
    const offending: { file: string; line: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match Linking.openURL with a string starting with http
        if (/Linking\.openURL\s*\(\s*['"`]https?:\/\//.test(line)) {
          offending.push({ file: path.relative(PROJECT_ROOT, file), line: line.trim() });
        }
      }
    }

    if (offending.length > 0) {
      const detail = offending
        .map((o) => `  ${o.file}: ${o.line}`)
        .join('\n');
      throw new Error(
        `Found Linking.openURL with http(s) URL — must use WebBrowser.openBrowserAsync.\n` +
          `This regressed Apple Guideline 2.1a previously. Offenders:\n${detail}`
      );
    }
  });

  it('Household tab uses WebBrowser.openBrowserAsync for legal links', () => {
    const householdSource = fs.readFileSync(
      path.resolve(PROJECT_ROOT, 'app/(app)/household.tsx'),
      'utf-8'
    );
    // Must use openBrowserAsync (in-app), NOT openURL (external)
    expect(householdSource).toMatch(/WebBrowser\.openBrowserAsync\s*\(\s*['"`]https:\/\/homecook\.live\/privacy/);
    expect(householdSource).toMatch(/WebBrowser\.openBrowserAsync\s*\(\s*['"`]https:\/\/homecook\.live\/terms/);
  });
});

describe('OAuth flow uses openAuthSessionAsync (works on both iOS and Android)', () => {
  const authSource = fs.readFileSync(
    path.resolve(PROJECT_ROOT, 'lib/auth.ts'),
    'utf-8'
  );

  it('Google OAuth uses WebBrowser.openAuthSessionAsync', () => {
    expect(authSource).toMatch(/signInWithGoogle[\s\S]*?WebBrowser\.openAuthSessionAsync/);
  });

  it('Facebook OAuth uses WebBrowser.openAuthSessionAsync', () => {
    expect(authSource).toMatch(/signInWithFacebook[\s\S]*?WebBrowser\.openAuthSessionAsync/);
  });

  it('OAuth functions use makeRedirectUri() (which auto-handles iOS vs Android schemes)', () => {
    expect(authSource).toMatch(/import\s+\{[^}]*\bmakeRedirectUri\b[^}]*\}\s+from\s+['"]expo-auth-session['"]/);
    expect(authSource).toMatch(/makeRedirectUri\s*\(/);
  });

  it('OAuth functions pass skipBrowserRedirect: true to Supabase', () => {
    // Without this, Supabase tries to auto-open the URL — which would
    // bypass our explicit WebBrowser.openAuthSessionAsync flow.
    const googleSection = authSource.match(/signInWithGoogle[\s\S]+?(?=async function|export)/);
    expect(googleSection?.[0]).toMatch(/skipBrowserRedirect:\s*true/);

    const facebookSection = authSource.match(/signInWithFacebook[\s\S]+?(?=async function|export)/);
    expect(facebookSection?.[0]).toMatch(/skipBrowserRedirect:\s*true/);
  });
});

describe('WebBrowser session completion handler is registered', () => {
  const authSource = fs.readFileSync(
    path.resolve(PROJECT_ROOT, 'lib/auth.ts'),
    'utf-8'
  );

  it('calls WebBrowser.maybeCompleteAuthSession() at module load', () => {
    // Required for OAuth callbacks to dismiss the in-app browser on return.
    // Without this, after OAuth completes the browser stays open and the user
    // sees a "Close this window" page.
    expect(authSource).toMatch(/WebBrowser\.maybeCompleteAuthSession\s*\(\s*\)/);
  });
});
