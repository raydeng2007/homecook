/**
 * Deep iOS-specific test for the Apple Sign In FLOW.
 *
 * Unlike apple-sign-in.test.ts (which tests the platform gate), this test
 * mocks the iOS native module and verifies the entire signInWithApple()
 * function does exactly the right thing — same approach Apple's reviewers
 * would test the flow with.
 *
 * Without this test, regressions like these could ship undetected:
 *  - Missing FULL_NAME or EMAIL scope (Apple shows ugly fallback UX)
 *  - signInWithIdToken called with wrong provider (auth fails silently)
 *  - ERR_REQUEST_CANCELED treated as a failure (false error popup)
 *  - Missing identityToken handled wrong (App Store rejection bait)
 *
 * Since we can't run this on iOS Simulator from CI, we mock the native
 * SDK and verify our integration with it byte-for-byte.
 */

import { jest } from '@jest/globals';

// Mock react-native's Platform to look like iOS.
jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj.ios ?? obj.default },
}));

// Mock the Supabase client.
const mockSignInWithIdToken = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithIdToken: (...args: unknown[]) => mockSignInWithIdToken(...args),
    },
  },
}));

// Mock the Apple native module.
const mockSignInAsync = jest.fn();
jest.mock('expo-apple-authentication', () => ({
  signInAsync: (...args: unknown[]) => mockSignInAsync(...args),
  AppleAuthenticationScope: { FULL_NAME: 'FULL_NAME', EMAIL: 'EMAIL' },
}));

// Mock the other things auth.ts imports.
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: () => 'homecook://redirect',
}));

import { signInWithApple } from '@/lib/auth';

beforeEach(() => {
  mockSignInAsync.mockReset();
  mockSignInWithIdToken.mockReset();
});

describe('signInWithApple() — full flow on iOS', () => {
  it('requests both FULL_NAME and EMAIL scopes from Apple', async () => {
    mockSignInAsync.mockResolvedValue({ identityToken: 'eyJabc...' } as never);
    mockSignInWithIdToken.mockResolvedValue({ data: {}, error: null } as never);

    await signInWithApple();

    expect(mockSignInAsync).toHaveBeenCalledWith({
      requestedScopes: ['FULL_NAME', 'EMAIL'],
    });
  });

  it('exchanges the identity token with Supabase using provider="apple"', async () => {
    mockSignInAsync.mockResolvedValue({ identityToken: 'eyJabc...' } as never);
    mockSignInWithIdToken.mockResolvedValue({ data: {}, error: null } as never);

    await signInWithApple();

    expect(mockSignInWithIdToken).toHaveBeenCalledWith({
      provider: 'apple',
      token: 'eyJabc...',
    });
  });

  it('returns { success: true } on successful flow', async () => {
    mockSignInAsync.mockResolvedValue({ identityToken: 'eyJabc...' } as never);
    mockSignInWithIdToken.mockResolvedValue({ data: {}, error: null } as never);

    const result = await signInWithApple();
    expect(result.success).toBe(true);
  });

  it('returns a user-friendly error when Apple omits the identity token', async () => {
    // Apple can do this if the user has Sign In with Apple disabled at the
    // device level. We must not crash — must show a clear error.
    mockSignInAsync.mockResolvedValue({ identityToken: null } as never);

    const result = await signInWithApple();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/identity token/i);
    // Supabase should NOT have been called
    expect(mockSignInWithIdToken).not.toHaveBeenCalled();
  });

  it('returns "cancelled" message (not generic error) when user dismisses Apple sheet', async () => {
    // This was a real UX issue — without special handling, dismissing the
    // Apple sheet showed "Failed to sign in" which is misleading.
    const cancelError = new Error('User canceled');
    (cancelError as Error & { code: string }).code = 'ERR_REQUEST_CANCELED';
    mockSignInAsync.mockRejectedValue(cancelError as never);

    const result = await signInWithApple();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cancel/i);
  });

  it('returns generic error for non-cancellation native errors', async () => {
    mockSignInAsync.mockRejectedValue(new Error('Something broke') as never);

    const result = await signInWithApple();
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.error).not.toMatch(/cancel/i);
  });

  it('maps Supabase auth errors to user-friendly messages', async () => {
    mockSignInAsync.mockResolvedValue({ identityToken: 'eyJabc...' } as never);
    mockSignInWithIdToken.mockResolvedValue({
      data: null,
      error: { message: 'invalid login credentials' },
    } as never);

    const result = await signInWithApple();
    expect(result.success).toBe(false);
    // mapAuthError() should have translated this
    expect(result.error).toMatch(/invalid email or password/i);
  });
});
