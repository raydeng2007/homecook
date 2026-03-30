# Architecture Patterns: Testing Structure for Homecook

**Domain:** Expo SDK 52 / React Native mobile app with Supabase backend
**Researched:** 2026-03-29
**Confidence:** HIGH (Expo official docs + React Native Testing Library docs + verified patterns)

---

## Overview

The app has a clear four-layer dependency graph that directly maps to four test categories. Each layer depends only on layers below it, which makes the test build order straightforward: test the bottom (pure utilities) first, work upward to the UI surface last.

```
app/ (screens)              ← Layer 4: Integration tests (renderRouter)
    depends on
components/                 ← Layer 3: Component tests (RNTL render)
    depends on
contexts/ + hooks/          ← Layer 2: Context/hook tests (renderWithProviders)
    depends on
lib/ (data + utilities)     ← Layer 1: Unit tests (no React, pure Jest)
    depends on
lib/supabase.ts (singleton) ← Mock boundary: jest.mock('@/lib/supabase')
```

The Supabase client singleton (`lib/supabase.ts`) is the single mock boundary for all of Layer 1 and above. Everything above it is testable with mocked Supabase responses.

---

## Test Categories

### Layer 1: Pure Utility Unit Tests

**What:** Functions with no React, no Supabase, deterministic input/output.

**Files to test:**
- `lib/validation.ts` — `validateEmail`, `validatePassword`, `validatePasswordMatch`, `validateName`
- `lib/ingredient-normalize.ts` — `normalizeIngredient` (prep-word stripping, depluralization, synonym resolution)
- `lib/ingredient-categories.ts` — `categorizeIngredient` (category detection for shopping list grouping)
- `lib/portion-scaling.ts` — `formatQuantity`, `scaleIngredients`, calorie scaling
- `lib/recipe-visuals.ts` — `getRecipeGradient`, `getRecipeEmoji` (deterministic from recipe id)

**No mocks needed.** These are pure functions. Test with direct imports and plain `expect()` assertions.

**Confidence HIGH.** These are the highest-value tests per implementation effort: zero test infrastructure required, directly validate the critical shopping-list aggregation logic.

---

### Layer 1: Supabase Data Layer Tests

**What:** Async functions in `lib/` that call the Supabase client (recipes.ts, meal-plans.ts, homes.ts, saved-recipes.ts, auth.ts).

**Mock boundary:** `lib/supabase.ts` — mock the entire module at this single point.

**Mock pattern:**

```typescript
// __mocks__/lib/supabase.ts  (manual mock, auto-loaded via moduleNameMapper)
export const supabase = {
  from: jest.fn(),
  auth: {
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
  rpc: jest.fn(),
};
```

**Per-test override pattern:**

```typescript
import { supabase } from '@/lib/supabase';

const mockFrom = supabase.from as jest.Mock;

beforeEach(() => {
  mockFrom.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: mockRecipe, error: null }),
  });
});
```

**Key behaviors to test per module:**
- `lib/recipes.ts`: throws on error, returns `[]` on `getAllRecipes` error (different error contract — important to test)
- `lib/meal-plans.ts`: correct `home_id` scoping, correct date range queries
- `lib/homes.ts`: RPC call shape (`get_or_create_home`), member query
- `lib/auth.ts`: `mapAuthError()` message mapping, `{ success, error }` result shape for all branches

---

### Layer 2: Context and Hook Tests

**What:** `contexts/AuthContext.tsx`, `contexts/HomeContext.tsx`, `contexts/ThemeContext.tsx`, `hooks/useThemeColors.ts`

**Mock requirements:**
- `lib/supabase.ts` (same mock as Layer 1)
- `@react-native-async-storage/async-storage` (official jest mock)

**AsyncStorage mock (setup file):**

```typescript
// jest.setup.ts
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

**Testing pattern for contexts — test through the hook, not the provider internals:**

```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { HomeProvider } from '@/contexts/HomeContext';
import { useHome } from '@/contexts/HomeContext';

it('auto-creates a home on mount', async () => {
  (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockHome, error: null });

  const { result } = renderHook(() => useHome(), {
    wrapper: ({ children }) => (
      <HomeProvider userId="user-123">{children}</HomeProvider>
    ),
  });

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.home?.id).toBe('home-456');
});
```

**ThemeContext:** Test that `isDark` toggles, that `AsyncStorage.setItem` is called with the correct key/value, and that initial state loads from `AsyncStorage.getItem`.

**Confidence MEDIUM.** Context tests are more setup-heavy. The main value is verifying the HomeContext error/retry logic and the ThemeContext persistence — these are not covered by E2E Maestro flows.

---

### Layer 3: Component Tests

**What:** Shared components in `components/` that contain non-trivial logic.

**Priority order (highest ROI first):**

1. `components/RecipeForm.tsx` — validation gate, ingredient row add/remove, form submission
2. `components/AddMealModal.tsx` — date selection, meal type selection, submit callback
3. `components/MonthCalendarGrid.tsx` — hexagon date rendering, selected date highlighting, `onDateSelect` callback fires correctly
4. `components/WeekCalendarStrip.tsx` — week navigation, selected date prop
5. `components/ServingStepper.tsx` — increment/decrement bounds, callback
6. `components/LoadingButton.tsx` — disabled state during loading, accessibility label
7. `components/NutritionBadges.tsx` — renders correct values, handles zero/undefined

**Lower priority (presentational, limited logic):**
- `HexagonShape`, `RecipeImage`, `CategoryChips`, `MealTypeTabBar` — snapshot tests sufficient if tested at all

**Testing pattern:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ServingStepper } from '@/components/ServingStepper';

it('does not decrement below 1', () => {
  const onChangeMock = jest.fn();
  render(<ServingStepper value={1} onChange={onChangeMock} />);

  fireEvent.press(screen.getByLabelText('Decrease servings'));
  expect(onChangeMock).not.toHaveBeenCalled();
});
```

**NativeWind note:** NativeWind v4 `className` props compile through Babel. The `jest-expo` preset handles Babel transforms. No additional moduleNameMapper is needed for className in tests — the `className` prop passes through to the native component as a style prop in the test environment. Do not test actual visual styles; test behavior and accessible element presence.

**Confidence MEDIUM-HIGH.** RNTL is the standard; the pattern is well-established. NativeWind v4 + jest-expo compatibility is verified by the community but worth a quick smoke test during setup.

---

### Layer 4: Screen Integration Tests

**What:** Screen-level components in `app/(app)/` that compose multiple components and call data functions.

**Use `expo-router/testing-library` `renderRouter` for screens.** This is required because screens use `useLocalSearchParams`, `useRouter`, and other Expo Router hooks that need a router context.

```typescript
import { renderRouter, screen } from 'expo-router/testing-library';

it('shows recipe list on home screen', async () => {
  jest.mock('@/lib/recipes', () => ({
    getPersonalRecipes: jest.fn().mockResolvedValue([mockRecipe]),
  }));

  renderRouter({ '(app)/recipes/index': require('@/app/(app)/recipes/index') });

  await screen.findByText('Pasta Carbonara');
});
```

**Critical note:** Do NOT place test files inside `app/` directory. Expo Router treats all `.tsx` files in `app/` as routes and will attempt to bundle them, causing errors. Test files for screens must live in `__tests__/screens/`.

**Scope these tests narrowly.** Screen integration tests are the most expensive to write and maintain. Cover only the critical user-facing behaviors that Maestro E2E cannot easily assert on (e.g., loading states, error retry UI, conditional rendering).

**Confidence MEDIUM.** `renderRouter` is the official API but has known rough edges (see [expo/expo#31908](https://github.com/expo/expo/issues/31908)). Keep screen integration tests minimal until the API stabilizes further.

---

## Recommended Directory Structure

```
homecook/
├── __tests__/
│   ├── unit/
│   │   ├── validation.test.ts         # lib/validation.ts — pure functions
│   │   ├── ingredient-normalize.test.ts  # lib/ingredient-normalize.ts
│   │   ├── ingredient-categories.test.ts # lib/ingredient-categories.ts
│   │   ├── portion-scaling.test.ts    # lib/portion-scaling.ts
│   │   └── recipe-visuals.test.ts     # lib/recipe-visuals.ts
│   ├── data/
│   │   ├── recipes.test.ts            # lib/recipes.ts (mocked supabase)
│   │   ├── meal-plans.test.ts         # lib/meal-plans.ts
│   │   ├── homes.test.ts              # lib/homes.ts
│   │   ├── saved-recipes.test.ts      # lib/saved-recipes.ts
│   │   └── auth.test.ts               # lib/auth.ts (error mapping)
│   ├── contexts/
│   │   ├── HomeContext.test.tsx       # retry logic, error state
│   │   ├── AuthContext.test.tsx       # session state, redirect triggers
│   │   └── ThemeContext.test.tsx      # toggle, AsyncStorage persistence
│   ├── components/
│   │   ├── RecipeForm.test.tsx        # validation, ingredient add/remove
│   │   ├── AddMealModal.test.tsx      # date + meal type selection
│   │   ├── ServingStepper.test.tsx    # bounds checking
│   │   ├── LoadingButton.test.tsx     # loading state
│   │   └── NutritionBadges.test.tsx   # value rendering
│   └── screens/
│       ├── recipes-list.test.tsx      # search/filter behavior
│       └── shopping.test.tsx          # ingredient aggregation display
├── __mocks__/
│   └── lib/
│       └── supabase.ts                # Manual Supabase singleton mock
├── jest.setup.ts                      # Global mock setup (AsyncStorage, etc.)
├── jest.config.js                     # Jest + jest-expo configuration
└── ...
```

**Rationale for `__tests__/` at root (not co-located):**
- Expo Router bundles everything in `app/` — test files there cause route-resolution errors (confirmed [expo/expo#28000](https://github.com/expo/expo/issues/28000))
- Centralized structure keeps all test infrastructure (mocks, setup, fixtures) in one place
- Mirrors the existing `.maestro/` convention already in the project

---

## Mock Organization

### Central Mock: `__mocks__/lib/supabase.ts`

The single most important mock in the project. Every data layer function imports the supabase singleton from `@/lib/supabase`. Mock it once here; all `lib/` tests and context tests use it automatically via Jest's module mocking.

```typescript
// __mocks__/lib/supabase.ts
const mockChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  insert: jest.fn().mockResolvedValue({ data: null, error: null }),
  update: jest.fn().mockResolvedValue({ data: null, error: null }),
  delete: jest.fn().mockResolvedValue({ data: null, error: null }),
};

export const supabase = {
  from: jest.fn(() => mockChain),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
};
```

**Override per test with `mockReturnValue` / `mockResolvedValue`.** Reset with `jest.clearAllMocks()` in `beforeEach`.

### Global Setup: `jest.setup.ts`

```typescript
import '@testing-library/react-native/extend-expect';

// AsyncStorage (required — NativeModule, not available in Jest environment)
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// react-native-reanimated (required for any component using animations)
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

// Expo modules that reference native code
jest.mock('expo-linking');
jest.mock('expo-auth-session');
jest.mock('expo-web-browser');

// Environment variables for Supabase client initialization
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
```

### Test Utility: `__tests__/test-utils.tsx`

A shared `renderWithProviders` wrapper for component and context tests:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Minimal mock values for AuthContext and HomeContext
const mockAuthContext = { session: null, isLoading: false };
const mockHomeContext = {
  home: { id: 'home-test', name: 'Test Home' },
  isLoading: false,
  error: null,
  refresh: jest.fn(),
};

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      {/* Inject mock context values directly via context .Provider */}
      <AuthContext.Provider value={mockAuthContext}>
        <HomeContext.Provider value={mockHomeContext}>
          {ui}
        </HomeContext.Provider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
```

---

## Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['./jest.setup.ts'],
  testPathPattern: ['__tests__/.*\\.(test|spec)\\.[jt]sx?$'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    // jest-expo default — allows Expo and community packages to transform
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'contexts/**/*.{ts,tsx}',
    '!lib/supabase.ts',  // The singleton itself is mocked, not tested
  ],
};
```

**Key points:**
- `preset: 'jest-expo'` handles Babel transforms for JSX, TypeScript, and NativeWind className pass-through
- `moduleNameMapper` maps `@/` path alias (matches `tsconfig.json` paths)
- `transformIgnorePatterns` is the most common source of setup failures — the jest-expo default value must be preserved and extended carefully

---

## Build Order: What to Test First

| Order | Layer | Why First |
|-------|-------|-----------|
| 1 | Pure utilities (`__tests__/unit/`) | Zero setup required; highest ROI; validates shopping list aggregation logic which is core to the product |
| 2 | Data layer (`__tests__/data/`) | Validates error contracts (silent vs. throwing), query scoping by `home_id`, and auth error message mapping |
| 3 | Context tests (`__tests__/contexts/`) | `HomeContext` retry logic and `ThemeContext` persistence are not covered by Maestro E2E |
| 4 | Component tests (`__tests__/components/`) | `RecipeForm` and `AddMealModal` have conditional logic worth isolating from screen-level tests |
| 5 | Screen tests (`__tests__/screens/`) | Most expensive; only cover gaps in Maestro E2E coverage |

---

## Component Boundaries

| Component | Test Inputs | Test Outputs | Mock Needs |
|-----------|-------------|--------------|------------|
| `RecipeForm` | title, ingredients, servings props | `onSubmit` callback payload, validation error messages | None (pure props) |
| `AddMealModal` | `date`, `visible`, `onClose`, `onAdd` props | `onAdd` called with correct meal type + recipe id | None (pure props) |
| `MonthCalendarGrid` | `selectedDate`, `mealPlanDates` props | `onDateSelect` callback with correct date string | None |
| `ServingStepper` | `value`, `min`, `max`, `onChange` props | `onChange` not called at bounds | None |
| `HomeContext` | `userId` prop, mocked `supabase.rpc` | `home`, `isLoading`, `error` values via `useHome()` | Supabase mock |
| `ThemeContext` | toggle action via `useTheme()` | `isDark` toggles, AsyncStorage called | AsyncStorage mock |

---

## Data Flow Direction (Test Perspective)

```
Test calls lib function
    → lib function calls supabase mock
    → mock returns controlled { data, error }
    → lib function returns typed result or throws
    → test asserts return value / thrown error

Test renders component with renderWithProviders
    → component reads context via hook (mocked values injected)
    → component may call lib function (separately mocked)
    → test fires user events via fireEvent / userEvent
    → test asserts rendered text / accessibility state / callback calls
```

The two flows are independent. Data layer tests never need React. Component tests never need real Supabase responses. This separation keeps both test suites fast.

---

## Scalability Considerations

| Concern | Now (0 tests) | At 50 tests | At 200+ tests |
|---------|--------------|-------------|---------------|
| Supabase mock verbosity | Simple chain mock | Per-test overrides manageable | Consider factory functions per entity (e.g., `mockRecipeQuery(data)`) |
| Provider wrapping boilerplate | `renderWithProviders` utility | Stable pattern | Extract `test-utils.tsx` if not already done |
| Jest run time | Fast | Fast | Explore `--testPathPattern` to run only changed layers |
| E2E vs unit overlap | Maestro covers happy paths | Unit fills edge cases | Avoid duplicating happy-path tests across Maestro + Jest |

---

## Pitfalls Specific to This Architecture

**1. Supabase chaining mock returns `this` but tests forget to reset**
The chain mock methods return `mockReturnThis()` so callers can chain `.select().eq().order()`. If a test forgets `jest.clearAllMocks()` in `beforeEach`, leftover return values from a previous test bleed through. Always clear in `beforeEach`, not `afterEach`.

**2. `lib/recipes.ts` has two different error contracts**
`getRecipes()` throws on error. `getAllRecipes()` returns `[]` on error. Tests must cover both paths — the silent failure in `getAllRecipes` is a real production risk (5000-row query silently failing).

**3. Test files inside `app/` cause Expo Router bundling errors**
Confirmed issue ([expo/expo#28000](https://github.com/expo/expo/issues/28000)). All test files must live in `__tests__/`.

**4. `transformIgnorePatterns` is fragile**
Adding any package to `transformIgnorePatterns` incorrectly causes `SyntaxError: Cannot use import statement` at runtime. Copy the jest-expo default value exactly and only add exceptions at the end.

**5. NativeWind className does not assert visual styles**
`className="bg-primary"` passes through as a style prop, but the resolved color value is not what RNTL's `toHaveStyle` sees in tests. Do not test NativeWind-resolved colors — test behavior, text content, and accessibility props instead.

---

## Sources

- [Expo Unit Testing Documentation](https://docs.expo.dev/develop/unit-testing/) — Official setup, jest-expo preset, configuration — HIGH confidence
- [Expo Router Testing Reference](https://docs.expo.dev/router/reference/testing/) — `renderRouter`, testing-library integration — HIGH confidence
- [expo/expo issue #28000](https://github.com/expo/expo/issues/28000) — Confirmed: test files in `app/` cause bundling errors — HIGH confidence
- [React Native Testing Library](https://reactnativetesting.io/unit/setup/) — Component testing patterns — HIGH confidence
- [Async Storage Jest Integration](https://react-native-async-storage.github.io/async-storage/docs/advanced/jest/) — Official mock setup — HIGH confidence
- [Testing Supabase with RTL + MSW](https://nygaard.dev/blog/testing-supabase-rtl-msw) — Supabase mocking patterns — MEDIUM confidence
- [Jest Mocks for Supabase](https://dev.to/kazutora_hattori_66972c88/introduction-to-jest-mocks-a-collection-of-templates-for-testing-react-router-supabase-fetch-4d84) — Module factory mock templates — MEDIUM confidence
- [React Native Testing Guide 2026](https://reactnativerelay.com/article/complete-guide-testing-react-native-apps-2026-unit-tests-e2e-maestro) — Testing pyramid, tooling overview — MEDIUM confidence

---

*Research date: 2026-03-29*
