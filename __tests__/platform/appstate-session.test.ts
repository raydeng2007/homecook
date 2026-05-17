/**
 * Cross-platform test for the AppState session refresh handler.
 *
 * Both iOS and Android transition the app between 'active' and 'background'
 * states. If the Supabase auto-refresh isn't started/stopped accordingly:
 *  - On 'background' it keeps polling unnecessarily (battery drain)
 *  - On 'active' the token may have expired without our auto-refresh
 *    catching it (silent query failures when user returns)
 *
 * This test verifies the handler exists and uses the canonical pattern.
 */

import fs from 'fs';
import path from 'path';

describe('AppState session refresh handler in lib/supabase.ts', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../../lib/supabase.ts'),
    'utf-8'
  );

  it('imports AppState from react-native', () => {
    expect(source).toMatch(/import\s+\{[^}]*\bAppState\b[^}]*\}\s+from\s+['"]react-native['"]/);
  });

  it('registers an AppState change listener', () => {
    expect(source).toMatch(/AppState\.addEventListener\s*\(\s*['"`]change['"`]/);
  });

  it('starts auto-refresh when state becomes "active"', () => {
    expect(source).toMatch(/state\s*===\s*['"]active['"][\s\S]*?startAutoRefresh/);
  });

  it('stops auto-refresh when state is not "active"', () => {
    // The handler should call stopAutoRefresh on non-active states
    expect(source).toMatch(/stopAutoRefresh/);
  });

  it('Supabase client is created with persistSession: true (works on both platforms)', () => {
    expect(source).toMatch(/persistSession:\s*true/);
  });

  it('Supabase client is created with autoRefreshToken: true (cross-platform)', () => {
    expect(source).toMatch(/autoRefreshToken:\s*true/);
  });

  it('Supabase client uses AsyncStorage for session persistence (cross-platform)', () => {
    expect(source).toMatch(/storage:\s*AsyncStorage/);
  });

  it('imports url polyfill (required for Supabase to work in React Native — both platforms)', () => {
    expect(source).toMatch(/import\s+['"]react-native-url-polyfill\/auto['"]/);
  });
});
