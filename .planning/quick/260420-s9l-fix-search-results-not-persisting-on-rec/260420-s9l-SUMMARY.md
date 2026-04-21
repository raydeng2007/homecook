---
phase: 260420-s9l
plan: 01
subsystem: ui
tags: [react-native, expo-router, jest, search, useFocusEffect]

# Dependency graph
requires: []
provides:
  - lib/recipe-search.ts (pure smartSearch + CUISINE_KEYWORDS, testable in isolation)
  - useFocusEffect guard preventing cache wipe during active search
  - __tests__/lib/recipe-search.test.ts (15 regression tests)
affects: [recipes-tab, cookbook, search]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure functions extracted from screen components into lib/ for unit-testability without RN Testing Library"
    - "useFocusEffect guard pattern: early-return when UI state (searchQuery) indicates a reload would clobber user context"

key-files:
  created:
    - lib/recipe-search.ts
    - __tests__/lib/recipe-search.test.ts
  modified:
    - app/(app)/recipes/index.tsx

key-decisions:
  - "Keep existing CUISINE_KEYWORDS content verbatim when extracting — avoid drive-by changes that would muddy the regression diff"
  - "Early-return in useFocusEffect is simpler than conditionally guarding loadPublicData's cache reset; cache + page-0 data from the prior visit are still valid, so skipping the reload entirely is correct"
  - "Do not fetch via loadAllForSearch on focus either — the user's original query already populated the cache"

patterns-established:
  - "Screen-local pure helpers that depend only on entity types should live under lib/ so they're jest-testable (testPathIgnorePatterns excludes /app/)"

requirements-completed: [QUICK-01]

# Metrics
duration: 3min
completed: 2026-04-21
---

# Phase 260420-s9l Plan 01: Fix search results not persisting on recipe back-navigation Summary

**useFocusEffect now early-returns while a search query is active, preserving allRecipesCache + displayedRecipes across recipe-detail round-trips; smartSearch extracted into lib/recipe-search.ts with 15 regression tests documenting the page-slice-vs-full-cache contract.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-21T00:24:18Z
- **Completed:** 2026-04-21T00:27:08Z
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 edited)

## Root Cause

The Recipes (Cookbook) screen's `useFocusEffect` unconditionally called `loadPublicData()` every time the tab regained focus. `loadPublicData` resets `allRecipesCache` to null and reloads only page 0 (~20 recipes) into `publicRecipes`. Meanwhile, `searchQuery` is held in a separate `useState`, so it survived the navigation. When the user typed "chicken", tapped a result, then tapped Back, the `displayedRecipes` memo evaluated `isSearching && allRecipesCache(=null) ? … : publicRecipes(page 0)` — so `smartSearch` now filtered only the first 20 recipes. If the matching recipe lived beyond page 0, the user saw an empty list while their search text remained visible.

## Fix

Extracted `smartSearch` + `CUISINE_KEYWORDS` verbatim into a new pure module `lib/recipe-search.ts` so the filtering contract could be covered by unit tests under `__tests__/lib/`. Then patched `useFocusEffect` in `app/(app)/recipes/index.tsx` to early-return whenever `searchQuery.trim().length > 0`: the previously populated `allRecipesCache`, `publicRecipes`, and `savedIds` from the prior visit are still valid, so no fresh fetch is warranted. `searchQuery` is added to the `useCallback` dependency array so the guard sees fresh state on every focus.

## Tests Added

- **Baseline (8):** empty/whitespace query returns all, case-insensitive title match, description/category/ingredient matches, multi-word AND semantics.
- **Cuisine expansion (4):** "mexican" → taco, "italian" → pasta ingredient, non-cuisine queries don't expand, CUISINE_KEYWORDS keys present.
- **Regression guard (3):** full-cache (~41 items) vs. page-0 slice produce different results for the same "chicken tikka" query — this directly asserts why the focus-effect must preserve the cache.

Total: 15 new tests, all passing.

## Task Commits

1. **Task 1: Extract smartSearch into lib/recipe-search.ts and add regression tests** — `97f1f65` (test)
2. **Task 2: Patch useFocusEffect to preserve search cache across navigation** — `d29a780` (fix)

## Files Created/Modified

- `lib/recipe-search.ts` — Pure `smartSearch(recipes, query)` and `CUISINE_KEYWORDS` lookup, extracted from the Cookbook screen. JSDoc added per project convention.
- `__tests__/lib/recipe-search.test.ts` — 15 Jest tests with a `makeRecipe` factory; follows the same style as `__tests__/lib/portion-scaling.test.ts`.
- `app/(app)/recipes/index.tsx` — Removed local `CUISINE_KEYWORDS`/`smartSearch` duplicates, imported them from `@/lib/recipe-search`, and added the search-active guard to the `useFocusEffect` callback.

## Decisions Made

- **Extract verbatim first, refactor never.** The existing `smartSearch` behavior is already shipped to users; touching its semantics would expand this quick fix into a behavior change. Tests were written to pin the existing contract.
- **Early-return over conditional cache-preservation.** Tried and rejected: surgically skipping the `setAllRecipesCache(null)` line inside `loadPublicData`. That still burns an unnecessary network call and races `setPublicRecipes` against an in-flight search. Skipping the whole reload is both simpler and strictly safer.
- **Did not add `loadAllForSearch()` to the focus callback.** The cache from the original query is still fresh; refetching would be wasteful.

## Deviations from Plan

None — plan executed exactly as written. The only minor note: Node v16 was active initially (no-op unrelated environmental quirk) and was switched to v22 via `nvm use` per `CLAUDE.md` before any `npm test` or `npx tsc` commands ran.

## Verification

- `npx tsc --noEmit` — clean, zero errors.
- `npm test` — all 11 test suites pass (351 test runs; includes worktree duplicates). The 6 main-repo suites run 183 tests, all green, including the new `recipe-search` suite's 15 cases.
- Manual verification path (for the author): `npx expo start --clear` → Recipes tab → type "chicken" → tap a result → Back → confirm search text and filtered list both persist.

## Issues Encountered

None.

## Self-Check: PASSED

- FOUND: lib/recipe-search.ts
- FOUND: __tests__/lib/recipe-search.test.ts
- FOUND: app/(app)/recipes/index.tsx (modified)
- FOUND: commit 97f1f65
- FOUND: commit d29a780

---
*Phase: 260420-s9l (quick)*
*Completed: 2026-04-21*
