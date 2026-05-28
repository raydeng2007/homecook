/**
 * Tests for resolveBackTarget — pure helper that decides where the recipe
 * detail screen should send the user when they tap "back". Behavior depends
 * on the `from` route param the caller stamped when pushing the detail
 * screen.
 *
 *  - from === 'home'    → jump back to the home tab (the recipes Stack
 *                          would otherwise pop to the Cookbook list).
 *  - from === 'recipes' → standard router.back() (pops within recipes Stack
 *                          back to the Cookbook list).
 *  - from absent / unknown → standard router.back() (safe default).
 */

import { resolveBackTarget } from '@/lib/recipe-nav';

describe('resolveBackTarget', () => {
  it('returns a navigate target to /(app)/ when from = home', () => {
    expect(resolveBackTarget('home')).toEqual({
      kind: 'navigate',
      href: '/(app)/',
    });
  });

  it('returns back when from = recipes', () => {
    expect(resolveBackTarget('recipes')).toEqual({ kind: 'back' });
  });

  it('returns back when from is undefined', () => {
    expect(resolveBackTarget(undefined)).toEqual({ kind: 'back' });
  });

  it('returns back for unknown values (forward-compatible default)', () => {
    // @ts-expect-error — testing runtime safety for unknown values
    expect(resolveBackTarget('shopping')).toEqual({ kind: 'back' });
    // @ts-expect-error
    expect(resolveBackTarget('')).toEqual({ kind: 'back' });
    // @ts-expect-error
    expect(resolveBackTarget(null)).toEqual({ kind: 'back' });
  });
});
