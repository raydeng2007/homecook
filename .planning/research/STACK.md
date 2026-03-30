# Technology Stack: Testing & App Store Readiness

**Project:** Homecook (Expo SDK 52, React Native 0.76)
**Researched:** 2026-03-29
**Scope:** Testing infrastructure (unit, integration, E2E) and CI/CD for app store launch

---

## Recommended Testing Stack

### Unit & Integration Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `jest` | ~29.x (via `npx expo install`) | Test runner | Standard; jest-expo preset is built on top of it |
| `jest-expo` | ~52.0.x | Expo-aware Jest preset | Mocks native Expo modules, handles Metro transform config; `npx expo install` pins the SDK-matched version automatically |
| `@testing-library/react-native` | ~13.x | Component rendering + assertions | Replaces deprecated `react-test-renderer`; v13 is the current stable release; query-by-role API matches accessibility best practices |
| `@testing-library/jest-native` | ~5.x | Custom jest matchers (`toHaveStyle`, `toBeVisible`) | Extends jest expect with DOM-like matchers; included in RNTL v13 via `@testing-library/jest-native/extend-expect` |

**Confidence:** HIGH — This is the stack documented by Expo at docs.expo.dev/develop/unit-testing/ and corroborated by the React Native Testing Library maintainers at Callstack.

**Install command (use this, not plain npm install):**
```bash
npx expo install jest jest-expo @testing-library/react-native @testing-library/jest-native
```

Using `npx expo install` is mandatory — it resolves the exact version peer-compatible with your installed `expo@~52.0.11`. Installing via plain `npm install` risks version skew that breaks the preset transform pipeline.

### Expo Router Integration Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `expo-router/testing-library` | (bundled with expo-router ~4.0.x) | `renderRouter` utility for testing routed screens | Official Expo-provided test harness; avoids the complexity of manually mocking `useRouter`, `useSegments`, `useLocalSearchParams` |

`renderRouter` lets you spin up an in-memory Expo Router app in tests, pass an inline route map, and assert on navigation state — no simulator required.

**Confidence:** HIGH — Documented at docs.expo.dev/router/reference/testing/

### E2E Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Maestro | latest CLI | Full-stack UI flows on real device/simulator | Already installed and in use (`.maestro/` has 11 test files). No change recommended — it runs against a real Expo Go build, which means tests exercise actual native behavior |

**What to add:**
- Migrate from coordinate-based taps (`point: "50%,74%"`) to `testID`-based taps wherever coordinates are used. Coordinates break when UI reflows (font size changes, different simulator resolution).
- Add a `maestro test .maestro/full_test.yaml` step in CI that runs after a successful EAS build.

**What NOT to add:**
- Detox — adds significant native build complexity (requires `react-native-builder-bob`, custom Podfile config, Android Instrumented Tests setup). Maestro gives 80% of the value at 20% of the setup cost for a managed Expo workflow.
- Appium — too low-level; designed for native apps not built with React Native. Community support is weaker than Maestro for Expo.

**Confidence:** MEDIUM — Maestro is actively developed and Expo has first-party integration docs for EAS + Maestro Cloud. However, Maestro Cloud pricing and SLA were not verified for March 2026.

### CI/CD

| Technology | Purpose | Why |
|------------|---------|-----|
| GitHub Actions | Run Jest unit tests on every PR and push | Free for open/private repos (2000 min/month free tier), no external service needed, integrates directly with the existing GitHub workflow |
| EAS Workflows | Build + E2E gate before store submission | Purpose-built for Expo; handles iOS signing, Android keystore, conditional build profiles, and Maestro Cloud integration in one YAML — avoids the glue-code overhead of managing `eas build` + shell scripts in GitHub Actions |

**Recommended split:**
- GitHub Actions handles: `npx tsc --noEmit`, `jest`, lint (fast, cheap, no native build needed)
- EAS Workflows handles: EAS build trigger, Maestro E2E against the built binary, EAS Submit to TestFlight/Play Store

This split avoids paying EAS compute minutes for tasks that run fine on a Node runner.

**Confidence:** MEDIUM — EAS Workflows went GA in 2024 and is documented at docs.expo.dev/eas/workflows/. GitHub Actions integration is well-established.

---

## Configuration Details

### jest.config.js

```js
// jest.config.js
const { getDefaultConfig } = require('expo/metro-config');

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

**Key notes:**
- `testPathIgnorePatterns` must exclude `/app/` — Expo Router treats all files in `app/` as routes, including `.test.tsx` files, which breaks the router build.
- `nativewind` and `tailwindcss` must be in `transformIgnorePatterns` allowlist — both ship ESM-only code that Jest (CommonJS environment) can't parse without Babel transformation.
- `moduleNameMapper` for `@/` alias must match the `paths` in `tsconfig.json`.

### NativeWind in Tests

NativeWind v4 className application is not testable via `toHaveStyle()` in Jest — the CSS-to-StyleSheet transformation only runs inside the Metro bundler, which Jest does not use. This is a documented limitation (github.com/nativewind/nativewind/issues/1398).

**Strategy:** Test behavior and structure, not NativeWind styles.

```typescript
// WRONG — will always fail
expect(button).toHaveStyle({ backgroundColor: '#6B2D3E' });

// CORRECT — test behavior
expect(button).toBeEnabled();
expect(button).toHaveTextContent('Sign In');
fireEvent.press(button);
expect(mockOnPress).toHaveBeenCalled();
```

For visual regression (color, spacing), use Maestro E2E screenshots (`takeScreenshot`) rather than Jest style assertions.

### Supabase Mocking

Supabase must be mocked at the module level — never let Jest call the real Supabase client (it would require network access and a live `.env`).

```typescript
// __mocks__/lib/supabase.ts
export const supabase = {
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
};
```

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx jest --ci --coverage
```

---

## Alternatives Considered and Rejected

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Test runner | Jest + jest-expo | Vitest | Vitest has no React Native preset; jest-expo is the only maintained preset for Expo's module system |
| Component tests | @testing-library/react-native | enzyme | enzyme dropped React Native 0.68+ support; unmaintained |
| E2E | Maestro (keep) | Detox | Detox requires ejecting from managed workflow or significant native config; adds iOS/Android build steps to CI; overkill for a managed Expo app |
| E2E | Maestro (keep) | Playwright | Playwright tests only web; this project targets native iOS/Android, not web |
| CI for builds | EAS Workflows | Self-hosted GitHub Actions iOS runner | macOS GitHub Actions runners cost $0.16/min; EAS Build is cheaper for occasional builds |

---

## Version Pinning Notes

**Confidence levels on versions:**

- `jest-expo ~52.0.x` — HIGH. Use `npx expo install jest-expo` to get the exact SDK-matched pin. At research time jest-expo 52.0.x is current for SDK 52.
- `@testing-library/react-native ~13.x` — MEDIUM. Version 13.3.3 is listed as latest on npm as of March 2026. v13 dropped `react-test-renderer` dependency, which fixes the `isLoaded` font incompatibility with expo-font 13 (SDK 52).
- `jest ~29.x` — HIGH. jest-expo preset pins this; do not manually specify in devDependencies.
- EAS Workflows GA status — MEDIUM. Documented and production-used by ~1000 apps as of early 2025; assumed stable.

---

## Known Issues to Watch

1. **expo-font + RNTL render incompatibility**: Expo SDK 52 bumped `expo-font` to v13. If `render()` is called in tests on components that use `expo-font` (including `@expo/vector-icons`), you get `TypeError: loadedNativeFonts.forEach is not a function`. Workaround: mock `expo-font` in Jest setup, or use `renderRouter` from `expo-router/testing-library` which handles this internally.

2. **New Architecture (JSI) in tests**: React Native 0.76 has New Architecture enabled by default. Jest runs in Node (old arch JS-only environment). Native modules with JSI bindings will throw in tests — mock them at the module boundary.

3. **NativeWind className untestable via toHaveStyle**: As described above — test behavior, not styles.

4. **No lockfile**: `package.json` has no `package-lock.json`. CI `npm ci` will fail without a lockfile. Run `npm install` locally to generate it, commit the lockfile before adding CI.

---

## Sources

- [Unit testing with Jest — Expo Docs](https://docs.expo.dev/develop/unit-testing/)
- [Testing configuration for Expo Router — Expo Docs](https://docs.expo.dev/router/reference/testing/)
- [Run E2E tests on EAS Workflows and Maestro — Expo Docs](https://docs.expo.dev/eas/workflows/examples/e2e-tests/)
- [EAS Workflows introduction — Expo Docs](https://docs.expo.dev/eas/workflows/introduction/)
- [jest-expo on npm](https://www.npmjs.com/package/jest-expo)
- [@testing-library/react-native on npm](https://www.npmjs.com/package/@testing-library/react-native)
- [react-native-testing-library GitHub (Callstack)](https://github.com/callstack/react-native-testing-library)
- [NativeWind Jest issue #1398 — className toHaveStyle limitation](https://github.com/nativewind/nativewind/issues/1398)
- [expo-font / RNTL render incompatibility issue #1712](https://github.com/callstack/react-native-testing-library/issues/1712)
- [Jest issues with SDK 52 / New Architecture — expo/expo #32883](https://github.com/expo/expo/issues/32883)
- [React Native Testing Guide 2026 — React Native Relay](https://reactnativerelay.com/article/complete-guide-testing-react-native-apps-2026-unit-tests-e2e-maestro)
- [expo/expo-github-action](https://github.com/expo/expo-github-action)
- [EAS Workflows blog post](https://expo.dev/blog/expo-workflows-automate-your-release-process)

---

*Research date: 2026-03-29*
