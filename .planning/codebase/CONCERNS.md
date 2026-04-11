# Codebase Concerns

**Analysis Date:** 2026-03-26

## Tech Debt

**Duplicated `formatDateKey` utility across 5 files:**
- Issue: The same `formatDateKey(date: Date): string` helper is copy-pasted in 5 separate files instead of being shared.
- Files: `app/(app)/index.tsx`, `app/(app)/planner.tsx`, `app/(app)/shopping.tsx`, `components/MonthCalendarGrid.tsx`, `components/WeekCalendarStrip.tsx`
- Impact: Bug risk if format changes in one place but not others. Maintenance overhead.
- Fix approach: Extract to `lib/date-utils.ts` and import everywhere. Also move `formatWeekLabel` and `getWeekRange` from `app/(app)/shopping.tsx` there.

**Hardcoded color values in `types/database.ts` and `lib/recipe-visuals.ts`:**
- Issue: `MEAL_TYPE_COLORS` in `types/database.ts` (lines 151-156) and all palette arrays in `lib/recipe-visuals.ts` use hardcoded hex values. The user has explicitly requested centralized, swappable palettes (per MEMORY.md).
- Files: `types/database.ts`, `lib/recipe-visuals.ts`, `hooks/useThemeColors.ts`
- Impact: Violates the user's stated convention. Colors scattered across files make palette changes error-prone.
- Fix approach: Centralize all color definitions in one palette file (e.g., `lib/palette.ts`). `useThemeColors.ts`, `ThemeContext.tsx`, `tailwind.config.js`, and `types/database.ts` should all import from it.

**Duplicated theme color definitions across 3 sources:**
- Issue: Theme colors are defined independently in `contexts/ThemeContext.tsx` (CSS vars), `hooks/useThemeColors.ts` (JS values), and `tailwind.config.js` (Tailwind config). The comment "To change palette: update values here + ThemeContext.tsx + tailwind warm[]" in `useThemeColors.ts` (line 11) confirms this is a known maintenance burden.
- Files: `contexts/ThemeContext.tsx`, `hooks/useThemeColors.ts`, `tailwind.config.js`
- Impact: Palette changes require coordinated edits to 3 files. Easy to get out of sync.
- Fix approach: Single source of truth for colors, with ThemeContext and useThemeColors deriving from it.

**Silent error swallowing in multiple locations:**
- Issue: Several catch blocks silently discard errors with no user feedback or logging.
- Files:
  - `components/AddMealModal.tsx` lines 52-53 (recipe load failure silently ignored)
  - `components/AddMealModal.tsx` lines 105-106 (meal plan save failure silently ignored)
  - `app/(app)/recipes/edit.tsx` lines 26-27 (recipe load failure silently ignored)
  - `lib/recipes.ts` lines 84-85, 94-95 (`getPersonalRecipes` silently ignores query errors)
- Impact: Users see no feedback when operations fail. Debugging becomes difficult.
- Fix approach: At minimum, show an Alert or toast for user-facing actions. For data loading, surface the error in UI state.

**RLS migration status uncertain:**
- Issue: Migration scripts exist in `scripts/migration-005-rls-policies.sql` through `scripts/migration-007-fix-rls-recursion.sql`, but the CLAUDE.md checklist marks "Supabase Row Level Security (RLS) policies for multi-household support" as incomplete (unchecked). The `home_members` SELECT policy has a self-referencing subquery that can cause infinite recursion (migration-007 was created to fix this).
- Files: `scripts/migration-005-rls-policies.sql`, `scripts/migration-007-fix-rls-recursion.sql`
- Impact: If RLS is not properly applied, any authenticated user could read/write other households' data via the Supabase anon key. Critical security gap.
- Fix approach: Verify which migrations have been applied in the Supabase dashboard. Confirm `home_members` policies use the recursion-safe approach from migration-007.

**`getAllRecipes()` fetches up to 5000 rows client-side for search:**
- Issue: `lib/recipes.ts` `getAllRecipes()` (line 31) uses `.range(0, 4999)` to fetch all recipes into memory. Called when users type in the public cookbook search bar (`app/(app)/recipes/index.tsx` line 163).
- Files: `lib/recipes.ts` lines 26-37, `app/(app)/recipes/index.tsx` lines 160-169
- Impact: As the recipe count grows, this will cause significant memory usage and slow network transfers on mobile. Search is client-side only.
- Fix approach: Implement server-side full-text search using Supabase `textSearch()` or a Postgres `tsvector` index. Remove the `allRecipesCache` pattern.

## Security Considerations

**`.env` file is not gitignored:**
- Risk: The `.gitignore` only ignores `.env*.local`, not `.env` itself. The `.env` file exists at the project root. If committed, Supabase keys would be exposed in version history.
- Files: `.gitignore`, `.env`
- Current mitigation: `.env` is currently listed as not tracked by git (not in `git ls-files --cached`), but it is also not excluded by `.gitignore` rules. A future `git add .` or `git add -A` would stage it.
- Recommendations: Add `.env` to `.gitignore` immediately. Run `git check-ignore .env` to verify.

**No authorization check on recipe delete/update:**
- Risk: `lib/recipes.ts` `deleteRecipe(id)` and `updateRecipe(id, updates)` only filter by `id`, not by `created_by`. Without RLS, any authenticated user could delete or modify any recipe.
- Files: `lib/recipes.ts` lines 171-207
- Current mitigation: The RLS SELECT policy on recipes allows all authenticated users to read, and UPDATE/DELETE policies reportedly check `created_by = auth.uid()`. But this depends on migration-005 having been applied.
- Recommendations: Add explicit `created_by` checks in the client-side code as defense-in-depth, and confirm RLS policies are active.

**`removeMember` has no ownership validation in client code:**
- Risk: `lib/homes.ts` `removeMember(memberId)` deletes by member ID with no client-side check. Relies entirely on RLS policy enforcement.
- Files: `lib/homes.ts` lines 57-64
- Current mitigation: UI only shows the remove button to owners (`app/(app)/household.tsx` line 526). RLS policy (migration-005) restricts DELETE to home owners.
- Recommendations: Ensure RLS is applied. Add server-side validation in an RPC function for defense-in-depth.

**Non-cryptographic invite code generation:**
- Risk: `regenerate_invite_code` in migration-005 uses `md5(random()::text)` to generate invite codes, which is predictable. 8-character alphanumeric codes (base-36) have limited entropy.
- Files: `scripts/migration-005-rls-policies.sql` lines 223-225
- Current mitigation: Codes are only 8 characters and uppercase alphanumeric, giving about 36^8 possible values (~2.8 trillion). Brute-force at API rate limits is impractical for targeted attacks.
- Recommendations: Consider using `gen_random_uuid()` or `pgcrypto` for code generation. Add rate limiting on the `join_home_by_code` endpoint.

## Performance Bottlenecks

**Large screen components without memoization:**
- Problem: `app/(app)/household.tsx` (724 lines), `app/(app)/recipes/index.tsx` (456 lines), and `app/(app)/recipes/[id].tsx` (438 lines) are monolithic screen components with many inline functions and no `React.memo` on child renders.
- Files: `app/(app)/household.tsx`, `app/(app)/recipes/index.tsx`, `app/(app)/recipes/[id].tsx`
- Cause: FlatList `renderItem` callbacks are defined inline and recreated every render. State changes at the top level trigger full re-renders.
- Improvement path: Extract FlatList renderItem into memoized components. Use `useCallback` for event handlers passed to children.

**`getPersonalRecipes` makes 3 sequential queries:**
- Problem: `lib/recipes.ts` `getPersonalRecipes()` makes 3 separate Supabase queries sequentially (own recipes, saved IDs, then saved recipes by IDs).
- Files: `lib/recipes.ts` lines 75-125
- Cause: No compound query or RPC to fetch this in one round trip.
- Improvement path: Create a Supabase RPC function that returns the user's personal collection in a single query. Alternatively, parallelize the first two queries with `Promise.all`.

**Meal plans reload on every date selection:**
- Problem: `app/(app)/index.tsx` calls `getMealPlansForDate()` every time the user taps a new date, with no caching of previously fetched dates.
- Files: `app/(app)/index.tsx` lines 48-61
- Cause: `loadMealPlans` depends on `dateKey` and fetches fresh data each time.
- Improvement path: Cache meal plan data by date key in a `Map` or use the already-fetched month data from `MonthCalendarGrid` instead of re-querying per date.

**Client-side cuisine keyword search:**
- Problem: `app/(app)/recipes/index.tsx` implements smart search with hardcoded cuisine keyword expansion (lines 18-61), iterating over all recipes in memory.
- Files: `app/(app)/recipes/index.tsx` lines 18-61
- Cause: No server-side search capability.
- Improvement path: Move search to Postgres full-text search. The cuisine keyword expansion could become a Postgres function or synonym dictionary.

## Fragile Areas

**`MonthCalendarGrid` and `WeekCalendarStrip` date handling:**
- Files: `components/MonthCalendarGrid.tsx`, `components/WeekCalendarStrip.tsx`
- Why fragile: Both components use JavaScript `Date` objects with manual day-of-week arithmetic. Timezone edge cases (midnight crossings, DST transitions) can cause off-by-one date selections.
- Safe modification: Always test date logic across timezone boundaries. Consider using a lightweight date library like `date-fns`.
- Test coverage: No automated tests exist for date calculations.

**Ingredient normalization fallback chain:**
- Files: `lib/meal-plans.ts` lines 94-131, `app/(app)/shopping.tsx` lines 64-123
- Why fragile: `getMealPlansForRange` has a fallback for when the `normalized_ingredients` column does not exist (error code 42703). The shopping list aggregation has two code paths: server-normalized and client-normalized. Both paths must produce compatible output.
- Safe modification: Once migration-008 is confirmed applied everywhere, remove the fallback path to simplify.
- Test coverage: None. The aggregation logic in `shopping.tsx` is complex and entirely untested.

**Household leave/join flow:**
- Files: `lib/homes.ts` lines 108-155, `scripts/migration-005-rls-policies.sql` lines 142-204
- Why fragile: `join_home_by_code` and `leave_home` RPCs perform multi-step mutations (delete membership, create home, insert membership) without explicit transaction wrapping beyond the function body. A failure mid-operation could leave orphaned data.
- Safe modification: Verify the PostgreSQL function body is treated as a single transaction (it is by default for PL/pgSQL functions). Add error handling within the functions.
- Test coverage: None.

## Missing Critical Features

**No automated test suite:**
- Problem: Zero test files exist in the project (`find` returns only `node_modules` tests). No test runner configured (no jest, vitest, or testing-library in `package.json`).
- Blocks: Cannot verify regressions, cannot safely refactor, no CI safety net.

**No input sanitization on recipe content:**
- Problem: Recipe titles, descriptions, and instructions are `.trim()`-ed but not sanitized for length, HTML, or injection content before storage.
- Files: `lib/recipes.ts` lines 144-166, `components/RecipeForm.tsx` lines 49-74
- Blocks: Could allow excessively long content or unexpected characters that break rendering.

**No offline support or optimistic updates for core flows:**
- Problem: All data operations require network connectivity. Meal plan changes, recipe CRUD, and shopping list generation fail silently or with errors when offline.
- Blocks: Poor user experience in low-connectivity scenarios (common mobile use case: grocery store).

## Accessibility Gaps

**Limited accessibility labels across the app:**
- Problem: Only 25 total `accessibilityLabel`/`accessibilityRole`/`accessible` usages across 12 files. Many interactive elements (calendar dates, meal plan cards, ingredient checkboxes, tab switches) lack accessibility labels.
- Files: Most screen files in `app/(app)/` and most components in `components/`
- Impact: Screen reader users cannot navigate the app effectively. Calendar hexagon date selectors are particularly problematic without labels.
- Fix approach: Audit all `Pressable` and interactive `View` elements. Add `accessibilityLabel` to every touchable element. Add `accessibilityRole` for buttons, tabs, and checkboxes.

**No accessible names for member list items:**
- Problem: In `app/(app)/household.tsx`, non-self members display as "Member" with a truncated user ID. No meaningful information is conveyed to screen readers.
- Files: `app/(app)/household.tsx` lines 471-476
- Impact: Cannot distinguish between household members using assistive technology.
- Fix approach: Fetch user profile data (name, email) from Supabase auth when displaying members.

## Test Coverage Gaps

**No test infrastructure exists:**
- What's not tested: Everything. Zero application test files.
- Files: No `__tests__/` directories, no `*.test.tsx` or `*.spec.ts` files.
- Risk: Any code change can introduce regressions undetected. The only testing is manual (Maestro E2E flows in `.maestro/`).
- Priority: Critical. At minimum, add unit tests for:
  1. `lib/recipes.ts` - CRUD operations with mocked Supabase client
  2. `lib/ingredient-normalize.ts` - Pure functions, easy to test
  3. `lib/portion-scaling.ts` - Pure functions, easy to test
  4. `app/(app)/shopping.tsx` `aggregateIngredients()` - Complex logic with no tests
  5. Date utility functions (currently duplicated across files)

## Dependencies at Risk

**NativeWind v4 is pre-stable:**
- Risk: NativeWind `^4.1.23` is a major version with potential breaking changes. The NativeWind v4 ecosystem is still maturing.
- Impact: Upgrade issues could break all styling across the app.
- Migration plan: Pin to exact version. Monitor NativeWind releases. Consider evaluating alternatives if v4 remains unstable.

**No lockfile verification in CI:**
- Risk: No CI pipeline exists. `package-lock.json` is present but never verified automatically.
- Impact: Dependency drift between environments. No automated security audit of dependencies.
- Migration plan: Set up a basic GitHub Actions workflow with `npm ci` and `npm audit`.

**React Native 0.76.x + Expo SDK 52:**
- Risk: Both are recent releases. Expo SDK 52 is the current stable, but upgrading to SDK 53+ may require significant migration effort.
- Impact: Need to stay on compatible RN + Expo SDK versions together.
- Migration plan: Follow Expo upgrade guides when new SDKs release. Test thoroughly before upgrading.

## Scaling Limits

**All recipes fetched for public cookbook search:**
- Current capacity: Works with hundreds of recipes. `getAllRecipes()` fetches up to 5000.
- Limit: At ~1000+ recipes, the initial search load will noticeably lag on mobile. At 5000+, it hits the hardcoded `.range(0, 4999)` limit.
- Scaling path: Implement server-side search with Postgres full-text indexing. Add pagination to search results.

**Shopping list computed entirely client-side:**
- Current capacity: Works for typical weekly plans (7-21 meals).
- Limit: Households with many members adding many meals per day could generate very large ingredient lists.
- Scaling path: Move aggregation logic to a Supabase RPC function that returns pre-aggregated data.

---

*Concerns audit: 2026-03-26*
