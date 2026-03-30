# Phase 1: Testing Foundation - Research

**Researched:** 2026-03-29
**Domain:** Jest unit testing for Expo SDK 52 / React Native 0.76 pure utility functions
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Test files go in `__tests__/` at the project root (NOT inside `app/` — Expo Router treats files in `app/` as routes and will fail to bundle test files). Mirror source structure inside `__tests__/` (e.g., `__tests__/lib/validation.test.ts`).
- **D-02:** Use `jest-expo` preset with jest.config.js at project root.
- **D-03:** Naming convention: `{module}.test.ts` for pure function tests.
- **D-04:** Extract `formatDateKey`, `formatWeekLabel`, and `getWeekRange` from the 5 files where they're duplicated into a new `lib/date-utils.ts` module. Update all imports in: `app/(app)/index.tsx`, `app/(app)/planner.tsx`, `app/(app)/shopping.tsx`, `components/MonthCalendarGrid.tsx`, `components/WeekCalendarStrip.tsx`.
- **D-05:** This extraction happens IN this phase (not deferred), since tests need a single source to import from.
- **D-06:** Thorough coverage — happy paths + edge cases + error cases for each function. Target ~15-25 tests per module. Cover: empty strings, null/undefined inputs, boundary values, Unicode characters (for ingredient names), fractional amounts (for portion scaling), timezone edge cases (for date utils).

### Claude's Discretion

- Test file organization within `__tests__/` (flat vs nested) — Claude can decide based on what makes sense
- Specific edge cases to cover per module — Claude should identify the most valuable cases
- Whether to add a `test` script to `package.json` — yes, required

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-01 | Jest + jest-expo test framework installed and configured with jest.config.js | jest-expo 52.x is the SDK-matched preset; install via `npx expo install`; jest.config.js must include `moduleNameMapper`, `transformIgnorePatterns` for nativewind, and `testPathIgnorePatterns: ['/app/']` |
| TEST-02 | Unit tests for validation functions (lib/validation.ts) with edge cases | 4 exported functions verified: `validateEmail`, `validatePassword`, `validatePasswordMatch`, `validateName` — all pure, no imports, ideal for unit tests |
| TEST-03 | Unit tests for ingredient normalization (lib/ingredient-normalize.ts) | 2 exported functions: `normalizeIngredient`, `pickDisplayName` — pure functions with complex logic (depluralization, synonym map, protected compounds) requiring thorough edge case coverage |
| TEST-04 | Unit tests for portion scaling (lib/portion-scaling.ts) | 5 exported functions: `formatQuantity`, `getScaleFactor`, `scaleQuantity`, `scaleIngredients`, `scaleCalories` plus `caloriesPerServing` — all pure; imports `Ingredient` type from `@/types/database` requiring `moduleNameMapper` in jest config |
| TEST-05 | Unit tests for date utility functions (extracted to lib/date-utils.ts) | `formatDateKey`, `getWeekRange`, `formatWeekLabel` are duplicated across 5 files with identical implementations — extract to new `lib/date-utils.ts` and update 5 import sites |
| TEST-06 | package-lock.json generated and committed (CI blocker) | `package-lock.json` already exists (lockfileVersion 3) but does NOT include jest-expo or @testing-library yet — after `npx expo install`, `npm install` must run to update the lockfile, then commit it |
</phase_requirements>

---

## Summary

This phase establishes Jest unit testing from zero. The project has no test infrastructure at all: no `jest.config.js`, no `__tests__/` directory, no test scripts in `package.json`, and jest-expo/testing-library are not in devDependencies. The Maestro E2E suite exists separately in `.maestro/` and is out of scope.

The target functions are all pure utilities with no side effects, no network calls, and no React Native native module dependencies. This makes setup straightforward: install jest-expo (the Expo SDK 52 preset), configure the jest.config.js with the correct `moduleNameMapper` for the `@/` path alias and correct `transformIgnorePatterns` for NativeWind/ESM packages, then write tests. The only complication is that `lib/portion-scaling.ts` and `lib/ingredient-categories.ts` import from `@/types/database` — this is handled by the `moduleNameMapper`, not by mocking.

The date utility extraction (D-04/D-05) is a prerequisite for TEST-05. Three functions are duplicated verbatim across 5 files — the implementations are identical, confirmed by inspection. Extraction is mechanical: create `lib/date-utils.ts`, export the three functions, update 5 import sites with `import { formatDateKey } from '@/lib/date-utils'` (and the other two where applicable).

**Primary recommendation:** Install with `npx expo install jest jest-expo`, write `jest.config.js` per the verified pattern below, extract date utils, then write tests. No component tests, no Supabase mocking needed for this phase.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `jest` | 29.7.0 (managed by jest-expo) | Test runner | Standard; jest-expo pins the compatible version — do not manually specify |
| `jest-expo` | ~52.0.x | Expo-aware Jest preset | Mocks native Expo modules, handles Metro-compatible Babel transform; SDK-version-matched |
| `@testing-library/react-native` | ~13.x | Component assertions (v2 scope, not this phase) | Included for completeness; not needed for pure function tests |

**For this phase only**, the install is minimal — pure function tests don't need `@testing-library/react-native`:

```bash
npx expo install jest jest-expo
```

Add to `package.json` devDependencies after install:
```json
"devDependencies": {
  "jest": "29.7.0",
  "jest-expo": "~52.0.x"
}
```

**Version verification:** Use `npx expo install` — it resolves the exact version peer-compatible with `expo@~52.0.11`. Running plain `npm install jest-expo` risks version skew.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jest-expo | Vitest | Vitest has no React Native preset; jest-expo is the only maintained preset for Expo's module system — no alternative |
| jest-expo | plain Jest | Without the preset, all native Expo module mocks must be written manually — high setup cost for no benefit |

---

## Architecture Patterns

### Recommended Project Structure

```
homecook/
├── __tests__/
│   └── lib/
│       ├── validation.test.ts
│       ├── ingredient-normalize.test.ts
│       ├── portion-scaling.test.ts
│       ├── date-utils.test.ts
│       └── ingredient-categories.test.ts
├── lib/
│   ├── date-utils.ts          ← NEW: extracted from 5 files
│   ├── validation.ts          (existing)
│   ├── ingredient-normalize.ts (existing)
│   ├── portion-scaling.ts     (existing)
│   └── ingredient-categories.ts (existing)
├── jest.config.js             ← NEW
└── package.json               ← add "test" script
```

Nested structure (`__tests__/lib/`) is preferred over flat (`__tests__/`) because the project has multiple source directories (`lib/`, `components/`, `contexts/`). When component tests are added in v2, the nesting avoids naming collisions.

### Pattern 1: jest.config.js

```javascript
// jest.config.js — source: .planning/research/STACK.md (verified against Expo docs)
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '(jest-)?react-native' +
      '|@react-native(-community)?' +
      '|expo(nent)?' +
      '|@expo(nent)?/.*' +
      '|@expo-google-fonts/.*' +
      '|react-navigation' +
      '|@react-navigation/.*' +
      '|@unimodules/.*' +
      '|unimodules' +
      '|sentry-expo' +
      '|native-base' +
      '|react-native-svg' +
      '|nativewind' +
      '|tailwindcss' +
      ')/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/app/'],
};
```

**Critical notes on each key:**
- `setupFilesAfterFramework`: Only include `@testing-library/jest-native/extend-expect` if that package is installed. For this phase (pure functions only), this line can be omitted until component tests are added.
- `transformIgnorePatterns`: `nativewind` and `tailwindcss` MUST be in the allowlist — both ship ESM-only code that Jest (CommonJS environment) cannot parse without Babel transformation.
- `moduleNameMapper`: Maps `@/` to `<rootDir>/` matching the `paths` in `tsconfig.json`. Required because `lib/portion-scaling.ts` imports `@/types/database`.
- `testPathIgnorePatterns`: Must exclude `/app/` — Expo Router tries to bundle every file in `app/` as a route, including test files.

### Pattern 2: package.json test scripts

```json
"scripts": {
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "test": "jest",
  "test:watch": "jest --watch"
}
```

### Pattern 3: New lib/date-utils.ts

```typescript
// lib/date-utils.ts
// Extracted from: app/(app)/index.tsx, app/(app)/planner.tsx,
//   app/(app)/shopping.tsx, components/MonthCalendarGrid.tsx,
//   components/WeekCalendarStrip.tsx

/**
 * Format a Date as a YYYY-MM-DD key for Supabase date columns.
 * Uses local timezone (getFullYear/getMonth/getDate, not UTC methods).
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get the Monday–Sunday range for the week containing baseDate.
 */
export function getWeekRange(baseDate: Date): { start: Date; end: Date } {
  const monday = new Date(baseDate);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { start: monday, end: sunday };
}

/**
 * Format a week range as a human-readable label, e.g. "Mar 24 – Mar 30".
 */
export function formatWeekLabel(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
}
```

### Pattern 4: Import update in consuming files

```typescript
// Before (in each of the 5 files):
function formatDateKey(date: Date): string { ... }  // local duplicate

// After:
import { formatDateKey } from '@/lib/date-utils';
// (also import getWeekRange, formatWeekLabel where used)
```

Files to update and which functions each uses:
- `app/(app)/index.tsx` — `formatDateKey`
- `app/(app)/planner.tsx` — `formatDateKey`
- `app/(app)/shopping.tsx` — `formatDateKey`, `formatWeekLabel`, `getWeekRange`
- `components/MonthCalendarGrid.tsx` — `formatDateKey`
- `components/WeekCalendarStrip.tsx` — `formatDateKey`

### Anti-Patterns to Avoid

- **Placing tests in `app/`:** Expo Router bundles all files in `app/` as routes. Even a `.test.ts` file will cause a build failure. Tests MUST live in `__tests__/`.
- **Using `npm install` for jest-expo:** Plain `npm install` ignores peer constraints. Use `npx expo install jest-expo` to get the SDK-matched version.
- **Testing NativeWind styles with `toHaveStyle`:** NativeWind v4's CSS-to-StyleSheet transform only runs inside the Metro bundler — Jest doesn't use Metro. `toHaveStyle` will always fail for className-based styles. This phase avoids this entirely (pure functions, no components).
- **Importing from `jest` in config:** Use `module.exports = {}` syntax, not ES module `export default` — `jest.config.js` runs in Node CommonJS context.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Expo module mocking | Custom `__mocks__/` for expo-modules | `jest-expo` preset | jest-expo automatically mocks all Expo native modules including expo-font, expo-linking, etc. |
| Path alias resolution | Manual `jest.config` paths | `moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' }` | One-line config; matches tsconfig.json paths exactly |
| Date formatting | Custom date format logic in tests | Test the existing `formatDateKey` implementation directly | The implementation is already correct; tests verify behavior, not reimplements it |

**Key insight:** For pure function tests, jest-expo's preset does all the heavy lifting. The only hand-rolled pieces are the `moduleNameMapper` (one line), `transformIgnorePatterns` (for NativeWind), and `testPathIgnorePatterns` (for Expo Router).

---

## Common Pitfalls

### Pitfall 1: `/app/` test file routing collision

**What goes wrong:** If a test file is accidentally placed in `app/` (e.g., `app/lib/validation.test.ts`), Expo Router tries to treat it as a screen route. This causes a bundle error: "The following route doesn't exist: lib/validation.test".

**Why it happens:** Expo Router file-system routing treats every `.ts/.tsx` file in `app/` as a potential route segment.

**How to avoid:** `testPathIgnorePatterns: ['/node_modules/', '/app/']` in jest.config.js prevents Jest from discovering tests there. Place all tests under `__tests__/`.

**Warning signs:** Jest finds 0 tests, OR Expo bundler throws "route doesn't exist" errors after adding test files.

---

### Pitfall 2: ESM parse error for NativeWind / Tailwind

**What goes wrong:** `SyntaxError: Cannot use import statement in a module` when running tests.

**Why it happens:** `nativewind` and `tailwindcss` ship as ESM-only packages. Jest runs in a CommonJS Node environment by default and cannot parse untransformed ESM.

**How to avoid:** Both packages MUST appear in `transformIgnorePatterns`'s allowlist. The allowlist pattern is a negative lookahead — packages listed here get Babel-transformed; packages NOT listed are skipped (assumed CommonJS). If `nativewind` is missing from the list, Jest skips its transformation and crashes on the `import` statement.

**Warning signs:** Error message contains `nativewind` or `tailwindcss` in the stack trace.

---

### Pitfall 3: `@/` path alias resolution failure

**What goes wrong:** `Cannot find module '@/types/database' from 'lib/portion-scaling.ts'`

**Why it happens:** Jest resolves modules in Node, which doesn't know about TypeScript's `paths` config. `lib/portion-scaling.ts` and `lib/ingredient-categories.ts` both import from `@/types/database`.

**How to avoid:** `moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' }` in jest.config.js translates `@/` imports to absolute paths.

**Warning signs:** Import error pointing to a path starting with `@/`.

---

### Pitfall 4: package-lock.json not updated after install

**What goes wrong:** `npm ci` in a fresh environment (or CI) fails with "npm ci can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync".

**Why it happens:** `npx expo install` updates `package.json` devDependencies but only updates the lockfile if `npm install` is run afterward. If only the `package.json` change is committed, the lockfile is out of sync.

**How to avoid:** After `npx expo install jest jest-expo`, explicitly run `npm install` to regenerate `package-lock.json`, then stage and commit both files.

**Warning signs:** `npm ci` error about lockfile out of sync; the jest-expo entry is in `package.json` devDependencies but not in `package-lock.json` node_modules entries.

---

### Pitfall 5: timezone sensitivity in date-utils tests

**What goes wrong:** `formatDateKey` and `getWeekRange` use local-timezone Date methods (`getFullYear`, `getMonth`, `getDate`, `setDate`). In UTC-offset environments (e.g., CI running in UTC), a Date constructed as `new Date('2024-01-15')` (which is midnight UTC) represents Jan 14 in UTC-8. Tests that hardcode expected strings like `'2024-01-15'` may pass locally but fail in CI.

**Why it happens:** `new Date('2024-01-15')` parses as UTC midnight. Calling `.getDate()` on it in a UTC-8 timezone returns 14, not 15.

**How to avoid:** Use `new Date(2024, 0, 15)` (local-time constructor with year/month/day arguments) in tests, NOT `new Date('2024-01-15')` (ISO string). The local-time constructor always creates midnight in the local timezone.

**Warning signs:** Tests pass locally, fail in CI; error shows date off by one day.

---

## Code Examples

### validation.test.ts structure

```typescript
// __tests__/lib/validation.test.ts
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateName,
} from '@/lib/validation';

describe('validateEmail', () => {
  it('returns null for valid email', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });
  it('returns error for empty string', () => {
    expect(validateEmail('')).toBe('Email is required');
  });
  it('returns error for whitespace-only', () => {
    expect(validateEmail('   ')).toBe('Email is required');
  });
  it('returns error for missing @', () => {
    expect(validateEmail('notanemail')).toBe('Please enter a valid email address');
  });
  it('returns error for missing TLD', () => {
    expect(validateEmail('user@domain')).toBe('Please enter a valid email address');
  });
  it('trims whitespace before validating', () => {
    expect(validateEmail('  user@example.com  ')).toBeNull();
  });
});
```

### date-utils.test.ts — timezone-safe pattern

```typescript
// __tests__/lib/date-utils.test.ts
import { formatDateKey, getWeekRange, formatWeekLabel } from '@/lib/date-utils';

describe('formatDateKey', () => {
  it('formats a date as YYYY-MM-DD', () => {
    // Use local-time constructor to avoid UTC parse ambiguity
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    expect(formatDateKey(date)).toBe('2024-01-15');
  });
  it('zero-pads single-digit month and day', () => {
    const date = new Date(2024, 2, 5); // Mar 5
    expect(formatDateKey(date)).toBe('2024-03-05');
  });
});

describe('getWeekRange', () => {
  it('returns Monday as start for a Wednesday input', () => {
    const wednesday = new Date(2024, 0, 17); // Wed Jan 17
    const { start } = getWeekRange(wednesday);
    expect(formatDateKey(start)).toBe('2024-01-15'); // Mon
  });
  it('returns Sunday as start-6 for a Sunday input (rolls back to that Monday)', () => {
    const sunday = new Date(2024, 0, 21); // Sun Jan 21
    const { start } = getWeekRange(sunday);
    expect(formatDateKey(start)).toBe('2024-01-15'); // Mon
  });
});
```

### portion-scaling.test.ts — key edge cases

```typescript
// __tests__/lib/portion-scaling.test.ts
import { formatQuantity, getScaleFactor, scaleQuantity, scaleCalories } from '@/lib/portion-scaling';

describe('formatQuantity', () => {
  it('returns "" for zero', () => expect(formatQuantity(0)).toBe(''));
  it('returns "" for negative', () => expect(formatQuantity(-1)).toBe(''));
  it('returns integer as string', () => expect(formatQuantity(3)).toBe('3'));
  it('formats 0.5 as ½', () => expect(formatQuantity(0.5)).toBe('½'));
  it('formats 1.5 as "1 ½"', () => expect(formatQuantity(1.5)).toBe('1 ½'));
  it('formats 0.25 as ¼', () => expect(formatQuantity(0.25)).toBe('¼'));
  it('formats 0.333 as ⅓', () => expect(formatQuantity(0.333)).toBe('⅓'));
  it('falls back to 1 decimal for non-fraction', () => expect(formatQuantity(1.6)).toBe('1.6'));
});

describe('scaleQuantity', () => {
  it('returns original string for non-numeric "to taste"', () => {
    expect(scaleQuantity('to taste', 2)).toBe('to taste');
  });
  it('returns original string for "pinch"', () => {
    expect(scaleQuantity('pinch', 3)).toBe('pinch');
  });
  it('scales numeric quantity', () => {
    expect(scaleQuantity('2', 1.5)).toBe('3');
  });
});
```

### ingredient-normalize.test.ts — key edge cases

```typescript
// __tests__/lib/ingredient-normalize.test.ts
import { normalizeIngredient, pickDisplayName } from '@/lib/ingredient-normalize';

describe('normalizeIngredient', () => {
  it('returns "" for empty string', () => expect(normalizeIngredient('')).toBe(''));
  it('lowercases input', () => expect(normalizeIngredient('ONION')).toBe('onion'));
  it('strips prep prefix "diced"', () => expect(normalizeIngredient('diced onion')).toBe('onion'));
  it('strips parentheticals', () => expect(normalizeIngredient('onion (about 2 cups)')).toBe('onion'));
  it('deplurializes "onions" to "onion"', () => expect(normalizeIngredient('onions')).toBe('onion'));
  it('preserves protected compound "ground beef"', () =>
    expect(normalizeIngredient('ground beef')).toBe('ground beef'));
  it('applies synonym: "cilantro" → "coriander"', () =>
    expect(normalizeIngredient('cilantro')).toBe('coriander'));
  it('applies synonym: "evoo" → "olive oil"', () =>
    expect(normalizeIngredient('evoo')).toBe('olive oil'));
  it('handles Unicode ingredient names', () =>
    expect(normalizeIngredient('crème fraîche')).not.toBe(''));
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-test-renderer` for RN component tests | `@testing-library/react-native` v13 | RNTL v13 (2024) | v13 dropped `react-test-renderer` dep, fixes expo-font v13 incompatibility |
| Manual Expo module mocks | `jest-expo` preset | SDK 40+ | Preset handles all Expo module mocks automatically |

**Deprecated/outdated:**
- `@testing-library/jest-native` setup via `setupFilesAfterFramework`: In RNTL v13+, the extended matchers are imported automatically — the separate setup file is optional. Only add it if using `@testing-library/jest-native` matchers explicitly.

---

## Open Questions

1. **`setupFilesAfterFramework` vs `setupFilesAfterFramework`**
   - What we know: STACK.md uses `setupFilesAfterFramework` (a typo — the correct key is `setupFilesAfterFramework`)
   - What's unclear: Whether the STACK.md config has a typo that would silently fail
   - Recommendation: Use `setupFilesAfterFramework` (correct Jest key). Since `@testing-library/jest-native` is not installed in this phase, omit this key entirely from jest.config.js for now.

2. **`ingredient-categories.ts` test scope**
   - What we know: `lib/ingredient-categories.ts` exports `guessCategory` (pure regex-based function) — CONTEXT.md canonical refs list it as a test target, but TEST-01 through TEST-06 only explicitly mention `validation.ts`, `ingredient-normalize.ts`, `portion-scaling.ts`, and `date-utils.ts`
   - What's unclear: Whether `ingredient-categories.ts` tests are in scope for this phase
   - Recommendation: Include a `__tests__/lib/ingredient-categories.test.ts` since the function is pure and testable; if scope is too wide, drop it — the phase requirements do not list it explicitly

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js 22 | `npx expo install`, running tests | ✓ (.nvmrc specifies 22, but shell session was on v16) | 22 via `nvm use` | Run `nvm use` before any commands |
| npm | `npm install`, `npm test` | ✓ | 10.2.5 | — |
| jest-expo | TEST-01 | ✗ (not installed) | — | Must install via `npx expo install` |
| jest | TEST-01 | ✗ (not in devDependencies) | — | Installed as peer by jest-expo |
| `lib/date-utils.ts` | TEST-05 | ✗ (does not exist yet) | — | Must create (extraction task) |
| `__tests__/` directory | All test files | ✗ (does not exist yet) | — | Must create |
| `jest.config.js` | All tests | ✗ (does not exist yet) | — | Must create |

**Note on package-lock.json:** The file exists at project root with lockfileVersion 3. It does NOT currently include jest-expo or @testing-library entries. After installing jest-expo, `npm install` must be run to update it.

**Missing dependencies with no fallback:**
- `jest-expo` — required to run any tests; install with `npx expo install jest jest-expo`

**Missing dependencies with fallback:**
- Node.js 22 — currently shell is on v16; run `nvm use` before any npm/npx commands in this phase

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | jest + jest-expo ~52.0.x |
| Config file | `jest.config.js` (does not exist yet — Wave 0 creates it) |
| Quick run command | `npm test -- --testPathPattern="validation"` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | `npm test` exits 0 and prints passing report | smoke | `npm test` | ❌ Wave 0 |
| TEST-02 | `validateEmail`, `validatePassword`, `validatePasswordMatch`, `validateName` cover happy + edge cases | unit | `npm test -- --testPathPattern="validation"` | ❌ Wave 0 |
| TEST-03 | `normalizeIngredient`, `pickDisplayName` cover empty, Unicode, synonyms, protected compounds | unit | `npm test -- --testPathPattern="ingredient-normalize"` | ❌ Wave 0 |
| TEST-04 | `formatQuantity`, `getScaleFactor`, `scaleQuantity`, `scaleIngredients`, `scaleCalories`, `caloriesPerServing` cover zero, fractions, non-numeric | unit | `npm test -- --testPathPattern="portion-scaling"` | ❌ Wave 0 |
| TEST-05 | Extracted `formatDateKey`, `getWeekRange`, `formatWeekLabel` from `lib/date-utils.ts` pass tests; 5 import sites compile without errors | unit + compile | `npm test -- --testPathPattern="date-utils" && npx tsc --noEmit` | ❌ Wave 0 |
| TEST-06 | `package-lock.json` includes jest-expo entries; `npm ci` succeeds | CI readiness | `npm ci` (verify in clean dir) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test` (full suite — fast since all pure functions, no native deps)
- **Per wave merge:** `npm test && npx tsc --noEmit`
- **Phase gate:** Full suite green + TypeScript clean before marking phase complete

### Wave 0 Gaps
- [ ] `jest.config.js` at project root — required before any test can run
- [ ] `__tests__/lib/` directory — no test files exist yet
- [ ] `__tests__/lib/validation.test.ts` — covers TEST-02
- [ ] `__tests__/lib/ingredient-normalize.test.ts` — covers TEST-03
- [ ] `__tests__/lib/portion-scaling.test.ts` — covers TEST-04
- [ ] `__tests__/lib/date-utils.test.ts` — covers TEST-05
- [ ] `lib/date-utils.ts` — prerequisite for TEST-05; must be extracted before writing tests
- [ ] `package.json` test script — `"test": "jest"` does not exist yet
- [ ] `npx expo install jest jest-expo` — neither package is in devDependencies

---

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — Full testing stack research with Expo SDK 52 specifics, NativeWind limitations, jest.config.js verified pattern
- `.planning/codebase/TESTING.md` — Confirmed zero test infrastructure; Maestro E2E details
- `lib/validation.ts` — Direct inspection of all 4 exported functions
- `lib/ingredient-normalize.ts` — Direct inspection of 10-step normalization pipeline
- `lib/portion-scaling.ts` — Direct inspection of all 6 exported functions
- `lib/ingredient-categories.ts` — Direct inspection of `guessCategory` + `CATEGORY_PATTERNS`
- `app/(app)/shopping.tsx` lines 21-44 — Verified `getWeekRange` and `formatWeekLabel` implementations
- Multiple files (index.tsx, planner.tsx, MonthCalendarGrid.tsx, WeekCalendarStrip.tsx) — Verified `formatDateKey` is identical across all 5 locations
- `package.json` — Confirmed no test script, no jest devDependencies
- `package-lock.json` — Confirmed lockfileVersion 3 exists but lacks jest-expo entries
- `tsconfig.json` — Confirmed `"@/*": ["./*"]` path mapping

### Secondary (MEDIUM confidence)
- [Expo Unit Testing Docs](https://docs.expo.dev/develop/unit-testing/) — Referenced in STACK.md; jest-expo preset usage confirmed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Verified against STACK.md which cites official Expo docs; packages confirmed compatible with SDK 52
- Architecture: HIGH — Verified by direct inspection of all source files; no guesswork
- Pitfalls: HIGH — All pitfalls verified by inspecting actual code and config files; timezone pitfall verified against JavaScript Date spec behavior
- Test examples: HIGH — Code examples are based on actual exported function signatures from source files

**Research date:** 2026-03-29
**Valid until:** 2026-06-01 (jest-expo major versions follow Expo SDK releases; SDK 53 would require re-verification)
