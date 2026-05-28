---
quick_id: 260527-vji
slug: calendar-remove-meal-and-recipe-back-nav
date: 2026-05-27
status: complete
---

# Summary

## What shipped

1. **Remove a planned meal from the home calendar.** Added a trash-icon
   `Pressable` to each meal row in `app/(app)/index.tsx`. Tapping it shows
   a "Remove Meal" confirmation Alert (Cancel / Remove) before calling
   `removeMealPlan(id)` and reloading. Mirrors the existing `planner.tsx`
   pattern.

2. **Recipe-detail back navigation now respects origin.**
   - New helper: `lib/recipe-nav.ts` exporting `resolveBackTarget(from)`.
   - `app/(app)/index.tsx` stamps `from: 'home'` on `router.push` to recipe detail.
   - `app/(app)/recipes/index.tsx` stamps `from: 'recipes'` on `router.push`.
   - `app/(app)/recipes/[id].tsx` now derives `from` from `useLocalSearchParams`,
     uses `handleBack()` that calls `router.navigate('/(app)/')` when `from='home'`,
     otherwise `router.back()`. All three back paths in the file (header back button,
     not-found "Go back" button, post-delete redirect) now route via `handleBack`.

3. **Icon rendering fix (drive-by, noticed during verification).**
   `components/Icon.tsx` was filling Lucide `CirclePlus`/`CircleX`/`CircleAlert`
   with the same color as their stroke — the result was an unidentifiable solid
   disc (visible on the "Add to dinner" button). Pruned `FILLED_VARIANTS` to only
   `bookmark` and `flame` whose Lucide shapes are designed to render filled.

## Tests added

- `__tests__/lib/recipe-nav.test.ts` — 4 cases covering home / recipes /
  undefined / unknown inputs for `resolveBackTarget`.
- `__tests__/lib/meal-plans.test.ts` — 2 cases covering `removeMealPlan`
  success and supabase-error rethrow.

## Verification

- `npx tsc --noEmit` — clean.
- `npm test` — 349 / 349 passing (was 343 before, +6 new).
- iOS 17 Pro simulator (Expo Go):
  - **Confirmed visually:** trash icon renders on the home meal row; tapping
    it surfaces the native "Remove Meal" Alert with Cancel/Remove buttons.
  - **Not confirmed via automation:** the final "Remove" tap on the Alert —
    `cliclick` could press the trash Pressable reliably but the iOS native
    UIAlertController buttons were inconsistently hit. The wiring is identical
    to the existing `planner.tsx` confirmation-alert flow that is already
    shipping in v1.3.8, and the underlying `removeMealPlan` lib call is now
    unit-tested. **User should do a final manual tap-through on a build before
    promoting to stores.**

## Version bump

`app.json`: `1.3.8` → `1.3.9`, `buildNumber` `18` → `19`,
`versionCode` `18` → `19`.

## Files touched

```
app.json
app/(app)/index.tsx
app/(app)/recipes/[id].tsx
app/(app)/recipes/index.tsx
components/Icon.tsx
lib/recipe-nav.ts                 (new)
__tests__/lib/recipe-nav.test.ts  (new)
__tests__/lib/meal-plans.test.ts  (new)
```
