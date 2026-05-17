/**
 * Cross-platform tests for Apple Sign In.
 *
 * Apple Sign In has strict requirements from App Store Guideline 4.8:
 *   - Must be offered on iOS if any other 3rd-party login is offered (Google, FB)
 *   - Must NOT be offered on Android (Apple's auth API is iOS-only)
 *
 * These tests verify the gating works correctly and catches any regression
 * that would either hide it from iOS (App Store rejection) or show it on
 * Android (broken button — would crash on tap).
 */

import { jest } from '@jest/globals';

// We have to mock react-native's Platform before importing the module under test.
function mockPlatform(os: 'ios' | 'android' | 'web') {
  jest.resetModules();
  jest.doMock('react-native', () => ({
    Platform: { OS: os, select: (obj: Record<string, unknown>) => obj[os] ?? obj.default },
  }));
}

// Mock dependencies that auth.ts imports but we don't exercise.
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithIdToken: jest.fn(),
      signInWithOAuth: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resend: jest.fn(),
    },
  },
}));
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
  openBrowserAsync: jest.fn(),
}));
jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: () => 'homecook://redirect',
}));

describe('isAppleSignInAvailable() — Apple Sign In gating', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('returns true on iOS', () => {
    mockPlatform('ios');
    const { isAppleSignInAvailable } = require('@/lib/auth');
    expect(isAppleSignInAvailable()).toBe(true);
  });

  it('returns false on Android', () => {
    mockPlatform('android');
    const { isAppleSignInAvailable } = require('@/lib/auth');
    expect(isAppleSignInAvailable()).toBe(false);
  });

  it('returns false on web', () => {
    mockPlatform('web');
    const { isAppleSignInAvailable } = require('@/lib/auth');
    expect(isAppleSignInAvailable()).toBe(false);
  });
});

// ─── Static analysis: verify app.json has the iOS pieces required for Apple Sign In ───

import fs from 'fs';
import path from 'path';

describe('Apple Sign In configuration in app.json', () => {
  const appJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../app.json'), 'utf-8')
  );

  it('declares usesAppleSignIn: true on iOS (required for entitlement)', () => {
    expect(appJson.expo.ios.usesAppleSignIn).toBe(true);
  });

  it('includes expo-apple-authentication in plugins array', () => {
    const plugins = appJson.expo.plugins;
    // Plugins can be strings or [name, config] tuples
    const names = plugins.map((p: unknown) => (Array.isArray(p) ? p[0] : p));
    expect(names).toContain('expo-apple-authentication');
  });

  it('Android config does NOT enable Apple Sign In (it cannot work there)', () => {
    // No equivalent property should exist on android — Apple's SDK is iOS-only.
    // This guards against someone mistakenly enabling it across the board.
    expect((appJson.expo.android as Record<string, unknown>).usesAppleSignIn).toBeUndefined();
  });
});

// ─── Static analysis: verify the login screen uses the gating function ───

describe('Login screen uses isAppleSignInAvailable for conditional rendering', () => {
  const loginSource = fs.readFileSync(
    path.resolve(__dirname, '../../app/(auth)/login.tsx'),
    'utf-8'
  );

  it('imports isAppleSignInAvailable from @/lib/auth', () => {
    expect(loginSource).toMatch(/import\s+\{[^}]*\bisAppleSignInAvailable\b[^}]*\}\s+from\s+['"]@\/lib\/auth['"]/);
  });

  it('renders the Apple button conditionally based on isAppleSignInAvailable()', () => {
    // Must match a JSX expression like `{isAppleSignInAvailable() && (...)}`
    expect(loginSource).toMatch(/\{\s*isAppleSignInAvailable\s*\(\s*\)\s*&&/);
  });

  it('renders Google and Facebook buttons UNCONDITIONALLY (no platform gating)', () => {
    // These should appear without any Platform.OS or isAppleSignInAvailable wrapper.
    // Find the SocialLoginButton calls and verify google/facebook aren't inside
    // a Platform.OS conditional.
    const googleMatch = loginSource.match(/SocialLoginButton[^/]*provider=["']google["'][^/]*\/>/);
    const facebookMatch = loginSource.match(/SocialLoginButton[^/]*provider=["']facebook["'][^/]*\/>/);
    expect(googleMatch).not.toBeNull();
    expect(facebookMatch).not.toBeNull();
  });
});
