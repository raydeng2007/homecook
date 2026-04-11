# Testing Patterns

**Analysis Date:** 2026-03-26

## Test Framework

**Unit/Integration Tests:**
- No test framework is configured. No Jest, Vitest, or any other test runner is installed.
- No test scripts in `package.json` (only `start`, `android`, `ios`, `web`).
- No `jest.config.*` or `vitest.config.*` files exist.
- Zero project-level test files (`*.test.*` or `*.spec.*`) exist outside `node_modules/`.

**Type Checking (primary quality gate):**
- TypeScript strict mode serves as the main code quality check
- Config: `tsconfig.json` with `"strict": true`
- Run: `npx tsc --noEmit`

## E2E Testing: Maestro

**Framework:** Maestro (mobile UI testing tool)

**Location:** `.maestro/` directory

**Test Files:**
- `.maestro/01_login.yaml` - Login screen and email auth flow
- `.maestro/02_home_calendar.yaml` - Home tab and calendar interactions
- `.maestro/03_cookbook_recipes.yaml` - Cookbook tab and recipe browsing
- `.maestro/04_recipe_create_keyboard.yaml` - Recipe creation with keyboard testing
- `.maestro/full_test.yaml` - Comprehensive end-to-end flow covering all screens
- `.maestro/household_kb_test.yaml` - Household keyboard interactions
- `.maestro/keyboard_test.yaml` - Keyboard behavior testing (v1)
- `.maestro/keyboard_test_v2.yaml` - Keyboard behavior testing (v2)
- `.maestro/keyboard_test_v3.yaml` - Keyboard behavior testing (v3)
- `.maestro/dismiss.yaml` - Dismiss helper
- `.maestro/dismiss_and_test.yaml` - Dismiss + test combo

**App Target:** `host.exp.Exponent` (Expo Go)

**Run Command:**
```bash
maestro test .maestro/full_test.yaml        # Full suite
maestro test .maestro/01_login.yaml         # Single test
```

**Maestro Test Patterns:**

Test IDs are added to components for Maestro targeting:
```typescript
// In components/CustomTabBar.tsx
const TAB_CONFIG: Record<string, TabConfig> = {
  index: { icon: 'home', iconOutline: 'home-outline', label: 'Home', testID: 'tab-home' },
  'recipes/index': { icon: 'book', iconOutline: 'book-outline', label: 'Cookbook', testID: 'tab-cookbook' },
  // ...
};

// In components/LoadingButton.tsx
<Pressable testID={testID} ... />
```

**Maestro interaction patterns used:**
```yaml
# Wait for element
- extendedWaitUntil:
    visible: "Homecook"
    timeout: 15000

# Tap by testID
- tapOn:
    id: "tab-cookbook"

# Tap by coordinates (when testID not available)
- tapOn:
    point: "50%,74%"

# Text input
- inputText: "test@homecook.live"

# Keyboard management
- hideKeyboard

# Screenshots for visual verification
- takeScreenshot: "P1_01_login_screen"

# Scroll
- scroll
- scrollUntilVisible:
    element:
      id: "household-join-input"
    direction: "DOWN"
```

**Full test coverage (`.maestro/full_test.yaml`):**
1. Login via email (Phase 1)
2. Home tab: calendar navigation, month/week toggle, add meal modal (Phase 2)
3. Cookbook tab: search, personal/public tabs, scrolling (Phase 3)
4. Shopping tab: week navigation (Phase 4)
5. Household tab: name editing, join code, theme toggle (Phase 5)
6. Tab navigation: cycle through all tabs (Phase 6)

## Test Coverage

**No coverage tooling.** No coverage reports, thresholds, or CI enforcement.

**Coverage by area (qualitative assessment):**

| Area | Unit Tests | E2E Tests (Maestro) |
|------|-----------|---------------------|
| Auth flow | None | Login flow covered |
| Recipe CRUD | None | Create partially covered |
| Meal plans | None | Add modal covered |
| Shopping list | None | Navigation covered |
| Household | None | Name edit, join code covered |
| Form validation | None | Implicit via E2E |
| Data layer (`lib/*.ts`) | None | None |
| Theme switching | None | Toggle covered |

## CI/CD Pipeline

**No CI/CD pipeline detected.**
- No `.github/workflows/` directory
- No `Jenkinsfile`, `Dockerfile`, `circle.yml`, or similar
- `eas.json` exists (Expo Application Services) for builds but no automated pipeline

**EAS Build:**
- Config: `eas.json` (present but untracked)
- Used for building standalone app binaries via Expo's cloud build service

## Mocking

**Not applicable.** No unit tests exist, so no mocking patterns are established.

**If adding unit tests, mock these:**
- `@/lib/supabase` - Supabase client singleton
- `expo-router` - Navigation hooks (`useRouter`, `useSegments`)
- `@react-native-async-storage/async-storage` - Theme persistence
- `expo-web-browser` - OAuth browser sessions

## Adding Tests (Recommendations)

**To add a unit test framework:**
1. Install: `npm install -D jest @testing-library/react-native @testing-library/jest-native jest-expo`
2. Add to `package.json` scripts: `"test": "jest", "test:watch": "jest --watch"`
3. Create `jest.config.js` with `preset: 'jest-expo'`
4. Place test files co-located with source: `components/LoadingButton.test.tsx`

**Priority areas for unit tests:**
1. `lib/validation.ts` - Pure functions, easy to test, high value
2. `lib/portion-scaling.ts` - Pure computation logic
3. `lib/ingredient-normalize.ts` - Data transformation logic
4. `lib/ingredient-categories.ts` - Category mapping logic
5. `components/RecipeForm.tsx` - Form validation logic

**To add a Maestro test:**
1. Create `.maestro/{NN}_{feature}.yaml`
2. Use `testID` props on interactive elements for targeting
3. Follow existing coordinate-based tap pattern as fallback
4. Include `takeScreenshot` calls for visual verification
5. Test against Expo Go (`appId: host.exp.Exponent`)

---

*Testing analysis: 2026-03-26*
