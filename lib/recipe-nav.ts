/**
 * Origin a route can stamp on the recipe detail screen so that the back
 * action returns the user to where they came from rather than to whichever
 * screen happens to be at the top of the recipes Stack.
 *
 * - 'home'    — pushed from the Home / Calendar tab (`/(app)/`)
 * - 'recipes' — pushed from the Cookbook list inside the recipes Stack
 */
export type RecipeOrigin = 'home' | 'recipes';

/**
 * Outcome of deciding where to send the user when they tap "back" inside
 * the recipe detail screen. Keeping this as a plain object lets us unit
 * test the logic without mocking expo-router.
 *
 *  - { kind: 'navigate', href } — call `router.navigate(href)`. Used when
 *      the detail screen was pushed from outside the recipes Stack (e.g.
 *      the Home tab) so a plain `router.back()` would pop within the
 *      recipes Stack and land on the Cookbook list instead.
 *  - { kind: 'back' } — call `router.back()`. The detail was pushed from
 *      within the recipes Stack so the default pop is correct.
 */
export type BackTarget =
  | { kind: 'navigate'; href: '/(app)/' }
  | { kind: 'back' };

export function resolveBackTarget(from: RecipeOrigin | undefined): BackTarget {
  if (from === 'home') return { kind: 'navigate', href: '/(app)/' };
  return { kind: 'back' };
}
