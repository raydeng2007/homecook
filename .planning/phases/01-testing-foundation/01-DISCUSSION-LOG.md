# Phase 1: Testing Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 1-testing-foundation
**Areas discussed:** Date utility extraction, Coverage depth

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Test organization | Where test files live, naming conventions | |
| Date utility extraction | formatDateKey duplicated in 5 files, extract before testing | ✓ |
| Coverage depth | Minimal vs thorough test coverage | ✓ |
| You decide on all | Claude has full discretion | |

---

## Date Utility Extraction

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, extract in Phase 1 (Recommended) | Create lib/date-utils.ts, move functions, update imports, then test | ✓ |
| Test inline, extract later | Write tests against one copy now, extract in Phase 2 | |
| Skip date util tests | Don't test date utilities at all | |

**User's choice:** Extract in Phase 1
**Notes:** User agreed with recommended approach — extract first, then test the shared module.

---

## Coverage Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Thorough (Recommended) | Happy paths + edge cases + error cases, ~15-25 tests per module | ✓ |
| Happy path only | Core functionality, ~5-8 tests per module | |
| Critical paths only | Test validation + normalization only, skip others' edge cases | |

**User's choice:** Thorough
**Notes:** Full edge-case coverage for all four utility modules.

---

## Claude's Discretion

- Test file organization within `__tests__/` (flat vs nested)
- Specific edge cases to cover per module
- Adding `test` script to `package.json`

## Deferred Ideas

None — discussion stayed within phase scope
