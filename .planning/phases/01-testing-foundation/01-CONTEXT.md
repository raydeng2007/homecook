# Phase 1: Testing Foundation - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Install Jest + jest-expo test framework, extract duplicated date utilities into a shared module, write thorough unit tests for all pure utility functions (validation, ingredient normalization, portion scaling, date utils), and commit package-lock.json. No component tests, no integration tests, no CI pipeline — those are v2.

</domain>

<decisions>
## Implementation Decisions

### Test Organization
- **D-01:** Test files go in `__tests__/` at the project root (NOT inside `app/` — Expo Router treats files in `app/` as routes and will fail to bundle test files). Mirror source structure inside `__tests__/` (e.g., `__tests__/lib/validation.test.ts`).
- **D-02:** Use `jest-expo` preset with jest.config.js at project root.
- **D-03:** Naming convention: `{module}.test.ts` for pure function tests.

### Date Utility Extraction
- **D-04:** Extract `formatDateKey`, `formatWeekLabel`, and `getWeekRange` from the 5 files where they're duplicated into a new `lib/date-utils.ts` module. Update all imports in: `app/(app)/index.tsx`, `app/(app)/planner.tsx`, `app/(app)/shopping.tsx`, `components/MonthCalendarGrid.tsx`, `components/WeekCalendarStrip.tsx`.
- **D-05:** This extraction happens IN this phase (not deferred), since tests need a single source to import from.

### Coverage Depth
- **D-06:** Thorough coverage — happy paths + edge cases + error cases for each function. Target ~15-25 tests per module. Cover: empty strings, null/undefined inputs, boundary values, Unicode characters (for ingredient names), fractional amounts (for portion scaling), timezone edge cases (for date utils).

### Claude's Discretion
- Test file organization within `__tests__/` (flat vs nested) — Claude can decide based on what makes sense
- Specific edge cases to cover per module — Claude should identify the most valuable cases
- Whether to add a `test` script to `package.json` — yes, required

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Testing Setup
- `.planning/codebase/TESTING.md` — Current testing state (zero tests, Maestro E2E only), recommended packages and setup steps
- `.planning/research/STACK.md` — Testing stack research: jest-expo version pinning, NativeWind limitations, known issues

### Source Files to Test
- `lib/validation.ts` — Form validators (pure functions)
- `lib/ingredient-normalize.ts` — Ingredient name normalization (pure functions)
- `lib/portion-scaling.ts` — Recipe portion scaling logic (pure functions)
- `lib/ingredient-categories.ts` — Category mapping logic

### Files with Duplicated Date Utils (extraction targets)
- `app/(app)/index.tsx` — has `formatDateKey`
- `app/(app)/planner.tsx` — has `formatDateKey`
- `app/(app)/shopping.tsx` — has `formatDateKey`, `formatWeekLabel`, `getWeekRange`
- `components/MonthCalendarGrid.tsx` — has `formatDateKey`
- `components/WeekCalendarStrip.tsx` — has `formatDateKey`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing test infrastructure — everything needs to be created from scratch
- `tsconfig.json` with `strict: true` is already configured
- `.maestro/` has E2E flows with `testID` props on components — these stay separate from unit tests

### Established Patterns
- All data layer functions are in `lib/` as async wrappers around Supabase client
- Pure utility functions (validation, normalization, scaling) have no side effects — ideal for unit testing
- `@/` path alias is used everywhere — jest.config.js needs `moduleNameMapper` to support it

### Integration Points
- `package.json` needs `"test": "jest"` script added
- `jest.config.js` created at project root
- `package-lock.json` must be generated via `npm install` and committed

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard jest-expo setup with thorough coverage of pure functions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-testing-foundation*
*Context gathered: 2026-03-29*
