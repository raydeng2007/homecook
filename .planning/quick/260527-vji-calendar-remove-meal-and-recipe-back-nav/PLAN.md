---
quick_id: 260527-vji
slug: calendar-remove-meal-and-recipe-back-nav
date: 2026-05-27
status: in-progress
---

# Calendar Remove Meal + Recipe-Detail Back-Nav Context

Two small UX fixes:

## 1. Remove a planned meal from the home/calendar view

**Problem:** Home calendar shows planned meals but the only action is "tap row to open recipe". No way to delete a meal that was added by mistake (the planner.tsx screen has a delete button, but home doesn't).

**Fix:** Add a trailing close-icon Pressable on each meal row in `app/(app)/index.tsx`. On press, show a confirmation Alert and call `removeMealPlan(id)`, then reload. Mirror the planner.tsx pattern.

## 2. Recipe-detail back navigation context

**Problem:** When a user taps a recipe from the home calendar and then taps Back, they land on the recipes list (Cookbook) tab — not back on Home. This happens because pushing `/(app)/recipes/[id]` from `/(app)/` enters the recipes Stack, so `router.back()` pops within that stack back to `recipes/index`.

**Fix:**
- Add `lib/recipe-nav.ts` with a `resolveBackTarget(from)` pure helper.
- Home and Cookbook navigate with a `from` param (`'home'` vs `'recipes'`).
- Recipe detail uses `handleBack()` that branches on `from`: `router.navigate('/(app)/')` when from=home, else `router.back()`.

## Tests

- `__tests__/lib/recipe-nav.test.ts` — covers `resolveBackTarget` for home/recipes/undefined inputs.
- `__tests__/lib/meal-plans.test.ts` — covers `removeMealPlan` success + error paths.

## Verification

- `npx tsc --noEmit`
- `npm test`
- iPhone 17 Pro sim: log in → home → add meal → delete meal → tap recipe from home → tap back (lands on home) → switch to Cookbook → tap recipe → tap back (lands on Cookbook). Screenshots of each terminal state.
- Bump app.json version (patch) + iOS buildNumber + Android versionCode.

## Files to touch

- `app/(app)/index.tsx` — wire delete icon, pass `from='home'` on navigate.
- `app/(app)/recipes/index.tsx` — pass `from='recipes'` on navigate.
- `app/(app)/recipes/[id].tsx` — `handleBack` helper, replace `router.back()` calls.
- `lib/recipe-nav.ts` — new helper.
- `__tests__/lib/recipe-nav.test.ts` — new.
- `__tests__/lib/meal-plans.test.ts` — new.
- `app.json` — version bump.
