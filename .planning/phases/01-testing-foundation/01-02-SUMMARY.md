---
phase: 01-testing-foundation
plan: 02
subsystem: testing
tags: [jest, jest-expo, typescript, date-utils, validation, unit-tests]

# Dependency graph
requires:
  - phase: 01-01
    provides: Jest test harness with jest-expo preset configured for Expo SDK 52
provides:
  - lib/date-utils.ts as single source of truth for formatDateKey, getWeekRange, formatWeekLabel
  - 45 passing unit tests covering lib/validation.ts and lib/date-utils.ts
  - TypeScript clean (npx tsc --noEmit exits 0) with @types/jest for test files
affects:
  - 01-03 (E2E test plan will use same harness)
  - Any future plans touching date logic — import from @/lib/date-utils

# Tech tracking
tech-stack:
  added:
    - "@types/jest ^30.0.0 (devDependency, for TypeScript type resolution in test files)"
  patterns:
    - "Shared date utilities extracted to lib/date-utils.ts — all date logic from one source"
    - "Test files use new Date(year, month, day) constructor (not ISO string) to avoid UTC offset issues in CI"
    - "jest.config.js transformIgnorePatterns must include expo-modules-core (needed by jest-expo setup)"

key-files:
  created:
    - lib/date-utils.ts
    - __tests__/lib/validation.test.ts
    - __tests__/lib/date-utils.test.ts
  modified:
    - app/(app)/index.tsx
    - app/(app)/planner.tsx
    - app/(app)/shopping.tsx
    - components/MonthCalendarGrid.tsx
    - components/WeekCalendarStrip.tsx
    - jest.config.js
    - package.json

key-decisions:
  - "Extracted formatDateKey/getWeekRange/formatWeekLabel into lib/date-utils.ts — was duplicated in 5 files"
  - "Added expo-modules-core to jest transformIgnorePatterns — jest-expo setup imports it and it's ESM-only"
  - "Added @types/jest manually to package.json devDependencies (npm install --save is blocked by .npmrc save=false)"
  - "Test date constructors always use new Date(year, month, day) not ISO strings for CI timezone safety"

patterns-established:
  - "lib/date-utils.ts: single source of truth for all date key formatting and week range logic"
  - "Test pattern: new Date(year, month, day) for timezone-safe date construction in Jest"
  - "jest.config.js: expo-modules-core must be in transformIgnorePatterns alongside other Expo packages"

requirements-completed:
  - TEST-02
  - TEST-05

# Metrics
duration: 6min
completed: 2026-04-01
---

# Phase 01 Plan 02: Date Utils Extraction + Unit Tests Summary

**lib/date-utils.ts extracted from 5 duplicate sites, 45 unit tests added for validation and date-utils, TypeScript clean**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-01T01:53:56Z
- **Completed:** 2026-04-01T02:00:18Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Created `lib/date-utils.ts` as the single source of truth for 3 date utility functions previously duplicated across 5 files
- Removed all 5 duplicate `formatDateKey` local definitions; all files now import from `@/lib/date-utils`
- 25 unit tests for all 4 validation functions (validateEmail, validatePassword, validatePasswordMatch, validateName)
- 20 unit tests for all 3 date utils functions (formatDateKey, getWeekRange, formatWeekLabel)
- TypeScript exits 0 with all test files present; `npm test` runs 45 tests with 0 failures

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lib/date-utils.ts and update 5 import sites** - `3f02c3e` (refactor)
2. **Task 2: Write validation unit tests** - `9efce0b` (test) + `29de023` (chore: @types/jest fix)
3. **Task 3: Write date-utils unit tests** - `9aec843` (test)

**Plan metadata:** (this commit)

## Files Created/Modified
- `lib/date-utils.ts` - New shared module: formatDateKey, getWeekRange, formatWeekLabel
- `__tests__/lib/validation.test.ts` - 25 test cases for all 4 validation functions
- `__tests__/lib/date-utils.test.ts` - 20 test cases for all 3 date utility functions
- `app/(app)/index.tsx` - Removed local formatDateKey, import from @/lib/date-utils
- `app/(app)/planner.tsx` - Removed local formatDateKey, import from @/lib/date-utils
- `app/(app)/shopping.tsx` - Removed all 3 local date functions, import all from @/lib/date-utils
- `components/MonthCalendarGrid.tsx` - Removed local formatDateKey, import from @/lib/date-utils
- `components/WeekCalendarStrip.tsx` - Removed local formatDateKey, import from @/lib/date-utils
- `jest.config.js` - Added expo-modules-core to transformIgnorePatterns
- `package.json` - Added @types/jest ^30.0.0 to devDependencies

## Decisions Made
- Extracted exactly as planned — the 3 functions in lib/date-utils.ts are verbatim from shopping.tsx (most complete source)
- @types/jest added to package.json by hand because .npmrc `save=false` blocks npm install from updating package.json automatically
- Test date constructors use `new Date(year, month, day)` throughout to avoid UTC midnight offset issues in CI environments

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] expo-modules-core missing from jest transformIgnorePatterns**
- **Found during:** Task 2 (Write validation unit tests)
- **Issue:** Running `npm test` failed with "SyntaxError: Cannot use import statement outside a module" because jest-expo's setup.js imports `expo-modules-core/src/web/index.web.ts` which is TypeScript/ESM that must be transpiled
- **Fix:** Added `expo-modules-core` to the transformIgnorePatterns exclusion list in jest.config.js
- **Files modified:** jest.config.js
- **Verification:** `npm test -- --testPathPattern="validation"` passes 25 tests
- **Committed in:** 9efce0b (Task 2 commit)

**2. [Rule 2 - Missing Critical] @types/jest missing from package.json**
- **Found during:** Verification (TypeScript check after Task 3)
- **Issue:** `npx tsc --noEmit` reported TS2582 "Cannot find name 'describe'" across all test files because @types/jest was not in package.json; test files cannot be compiled cleanly without it
- **Fix:** Added `"@types/jest": "^30.0.0"` to devDependencies in package.json (npm install --save was blocked by .npmrc)
- **Files modified:** package.json
- **Verification:** `npx tsc --noEmit` exits 0 with no errors
- **Committed in:** 29de023 (chore commit)

---

**Total deviations:** 2 auto-fixed (1 blocking/transform, 1 missing-critical/types)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- `.npmrc` has `save=false` which silently prevents `npm install` from updating package.json. Worked around by editing package.json directly and verifying node_modules installation.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 45 unit tests passing; test harness is confirmed to work end-to-end
- lib/date-utils.ts is a clean, well-documented module ready for use in any future plan
- All existing imports updated — zero duplicate date logic in app/ or components/
- No blockers for Plan 03 (E2E test infrastructure)

## Self-Check: PASSED

- lib/date-utils.ts: FOUND
- __tests__/lib/validation.test.ts: FOUND
- __tests__/lib/date-utils.test.ts: FOUND
- Commit 3f02c3e: FOUND in git history
- Commit 9efce0b: FOUND in git history
- Commit 9aec843: FOUND in git history
- Commit 29de023: FOUND in git history

---
*Phase: 01-testing-foundation*
*Completed: 2026-04-01*
