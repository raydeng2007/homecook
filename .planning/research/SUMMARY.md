# Project Research Summary

**Project:** HomeCook
**Domain:** Expo SDK 52 / React Native mobile app — App Store submission readiness
**Researched:** 2026-03-29
**Confidence:** HIGH

## Executive Summary

HomeCook is a household meal planning app built on Expo SDK 52 with Supabase as its backend. It already has functional core features — recipe CRUD, calendar-based meal planning, shopping list generation, household management, and OAuth authentication. The research focused entirely on what stands between the current codebase and a successful first App Store (iOS) and Google Play (Android) submission. The answer is clear: this is not a "build more features" milestone. It is a hardening, compliance, and quality milestone.

The recommended approach is to work through four sequential concerns in order of blocking severity. First, fix the critical show-stoppers that cause outright rejection before any review happens (Sign in with Apple missing, privacy manifest absent, Android target SDK unconfigured). Second, harden security and stability so the app does not crash or expose other users' data during review. Third, satisfy legal and metadata requirements so the app can be submitted at all. Fourth, add a testing infrastructure that prevents regressions during the hardening work and gives confidence before submission.

The two highest risks are: (1) the Sign in with Apple requirement — HomeCook currently offers Google and Facebook OAuth, which triggers mandatory Apple Guideline 4.8 enforcement without a "Sign in with Apple" option, causing near-certain rejection on first submission; and (2) unverified Supabase RLS state — migrations 005-007 exist in the repo but have not been confirmed as applied in production, meaning any authenticated user may be able to read other households' data via the public anon key. Both must be resolved before any production build.

## Key Findings

### Recommended Stack

The existing stack (Expo SDK 52, jest-expo preset, Maestro for E2E) is the correct foundation. No major changes are needed. What must be added is the testing infrastructure layer: Jest + jest-expo for unit and component tests, `expo-router/testing-library` for screen-level integration tests, and GitHub Actions for CI. Maestro should stay as the E2E layer but Maestro flows should be migrated from coordinate-based taps to `testID`-based taps to prevent breakage when UI reflows.

**Core technologies:**
- `jest` + `jest-expo ~52.0.x`: Unit/component test runner — only maintained Expo-compatible preset; must use `npx expo install` not `npm install` to avoid version skew
- `@testing-library/react-native ~13.x`: Component rendering — replaced deprecated `react-test-renderer`; v13 fixes expo-font 13 incompatibility with SDK 52
- `expo-router/testing-library` (`renderRouter`): Screen-level tests — official Expo API; avoids needing to manually mock `useRouter`, `useLocalSearchParams`
- Maestro (keep existing): E2E — already installed with 11 test flows; lower setup cost than Detox for managed Expo workflow
- GitHub Actions: CI for type checking, unit tests, and lint on every PR
- EAS Workflows: Native build + Maestro E2E gate before store submission
- `expo-apple-authentication`: Sign in with Apple — required for any app offering third-party OAuth on iOS (Apple Guideline 4.8)
- `expo-build-properties`: Android target SDK 35 configuration — required for Google Play submissions as of August 2025

**Critical version/config notes:**
- NativeWind v4 `className` is not testable via `toHaveStyle()` in Jest — test behavior, not styles
- Test files must NOT live in `app/` — Expo Router bundles everything there, causing route errors; all tests go in `__tests__/`
- No `package-lock.json` exists — `npm ci` in GitHub Actions will fail; run `npm install` and commit the lockfile first

### Expected Features

The research defines what is required versus what can be deferred, scoped to this milestone (store submission).

**Must have (table stakes — submission blockers):**
- Sign in with Apple — required by Apple Guideline 4.8 since third-party OAuth already exists
- Privacy manifest (`PrivacyInfo.xcprivacy`) — required since May 2024; missing causes binary rejection before human review
- Android target API 35 (`expo-build-properties` config) — required by Google Play as of August 2025
- Privacy policy at a publicly accessible URL (currently only exists as local HTML files)
- In-app link to privacy policy and terms of service — Apple Guideline 5.1.1
- Account deletion wired to UI and verified end-to-end — Apple Guideline 5.1.1(v), mandatory since June 2022
- App Privacy Label completed in App Store Connect
- Data Safety section completed in Google Play Console
- App Store screenshots: iPhone 6.9" and iPad 13" (required because `supportsTablet: true`)
- Google Play screenshots (minimum 2) and feature graphic (1024x500)
- Demo account with pre-populated data in App Store Connect review notes
- Content rating questionnaire completed (both stores)

**Should have (rejection risk reducers):**
- Silent error swallowing fixed in `AddMealModal`, `recipes/edit.tsx`, `lib/recipes.ts` — reviewer sees frozen app otherwise
- `ErrorBoundary` mounted in `app/_layout.tsx` — file exists but is untracked; must be integrated
- RLS verified applied (migrations 005-007 confirmed in Supabase dashboard)
- Accessibility labels on critical reviewer path: tab bar, calendar cells, recipe cards, action buttons
- iPad layout tested on iPad Pro 12.9" simulator — `MonthCalendarGrid` and `CustomTabBar` FAB are at risk
- `.env` added to `.gitignore` — currently only `.env*.local` is excluded

**Defer (post-launch):**
- App preview video (high effort, low urgency for first submission)
- Localization / i18n
- Push notifications
- Server-side recipe search (current client-side fetch is adequate for v1 but watch for performance on review device)
- TestFlight beta program (submit straight to production after internal testing)

### Architecture Approach

The app's four-layer dependency graph maps directly to four test categories, each depending only on layers below it. This makes the test build order unambiguous: pure utilities first (zero setup, highest ROI), then Supabase data layer tests with a single mock boundary at `lib/supabase.ts`, then context and hook tests, then component tests, and finally screen integration tests using `renderRouter` (most expensive, keep minimal). The Supabase singleton at `lib/supabase.ts` is the single mock boundary for the entire test suite — mock it once in `__mocks__/lib/supabase.ts` and all data layer tests consume it.

**Major components and test approach:**
1. `__tests__/unit/` — Pure functions: `lib/validation.ts`, `lib/ingredient-normalize.ts`, `lib/ingredient-categories.ts`, `lib/portion-scaling.ts`, `lib/recipe-visuals.ts` — no mocks needed
2. `__tests__/data/` — Async Supabase functions: `lib/recipes.ts`, `lib/meal-plans.ts`, `lib/homes.ts`, `lib/auth.ts` — mock `lib/supabase.ts` at module boundary
3. `__tests__/contexts/` — `HomeContext` retry logic, `ThemeContext` AsyncStorage persistence — these are NOT covered by Maestro E2E
4. `__tests__/components/` — `RecipeForm` validation gate, `AddMealModal` selection logic, `ServingStepper` bounds — test via RNTL `fireEvent`
5. `__tests__/screens/` — Keep minimal; only cover gaps Maestro cannot test (loading states, error retry UI)

**Key structural constraint:** `lib/recipes.ts` has two inconsistent error contracts — `getRecipes()` throws on error, `getAllRecipes()` returns `[]` on error (silent failure on a 5000-row query). This must be tested explicitly and is a production risk that warrants fixing.

### Critical Pitfalls

1. **Sign in with Apple missing** — Apple Guideline 4.8 requires it for any app with third-party OAuth. Implement `expo-apple-authentication` with Supabase Apple provider before any iOS submission attempt. Add `com.apple.developer.applesignin` entitlement to `app.json`.

2. **Privacy manifest (`PrivacyInfo.xcprivacy`) absent** — Required since May 2024. Missing causes `ITMS-91053` binary rejection before human review. Add via Expo privacy manifest config plugin (`docs.expo.dev/guides/apple-privacy/`). React Native core requires entries for `NSPrivacyAccessedAPICategoryUserDefaults`, `NSPrivacyAccessedAPICategoryFileTimestamp`, and `NSPrivacyAccessedAPICategoryDiskSpace`.

3. **RLS not confirmed applied — cross-household data leak** — Migrations 005-007 exist in repo but production status is unverified. Run `SELECT * FROM recipes` as a user who owns no recipes; if rows return, RLS is inactive. Also add `created_by = auth.uid()` client-side filters to `deleteRecipe` and `updateRecipe` as defense-in-depth.

4. **Google Play 14-day closed testing gate** — Personal Play Console accounts created after November 13, 2023 must complete 14 consecutive days with 12 opt-in testers before production access is available. Start recruiting testers at the beginning of the submission milestone, not at the end.

5. **Silent catch blocks cause frozen UI during review** — `AddMealModal` (2 locations), `recipes/edit.tsx`, and `lib/recipes.ts` have silent error swallowing. Apple reviewers testing edge cases see blank/frozen screens and reject under Guideline 2.1. Replace all silent catches with `Alert.alert` and mount the existing `ErrorBoundary` component in `app/_layout.tsx`.

## Implications for Roadmap

Based on combined research, a five-phase structure is recommended, ordered by blocking dependency:

### Phase 1: Testing Infrastructure Setup
**Rationale:** Testing infrastructure must exist before hardening work begins so that regressions are caught during the security and stability fixes. Starting without tests means every change in Phases 2-4 is unverified. This is also the lowest-risk phase to execute first — no production or submission consequence if it takes an extra day.
**Delivers:** Working Jest + jest-expo config, Supabase mock boundary, `renderWithProviders` test utility, GitHub Actions CI, `package-lock.json` committed, unit tests covering pure utility functions
**Addresses:** No store requirements directly, but enables confident execution of Phases 2-5
**Avoids:** `transformIgnorePatterns` breakage (follow jest-expo default exactly), test files in `app/` directory, NativeWind `toHaveStyle` assertions

### Phase 2: Security Hardening
**Rationale:** Security issues (RLS unverified, `.env` not gitignored) must be resolved before any production deployment. A live app with cross-household data exposure is a post-launch emergency that could trigger store removal. These changes also cannot be tested confidently if Phase 1 is incomplete.
**Delivers:** RLS confirmed active on all tables (migrations 005-007 verified in Supabase dashboard), client-side `created_by` guards on `deleteRecipe`/`updateRecipe`, `.env` gitignored, Supabase keys rotated if there is any doubt
**Addresses:** RLS security gap, credential exposure risk
**Avoids:** Cross-household data leak enabling post-launch removal; Supabase key exposure in git history

### Phase 3: Critical Compliance Fixes
**Rationale:** These are outright submission blockers — missing any one causes automatic rejection before or during review. Sign in with Apple is the single highest-priority item in the entire project. None of this work delivers user-visible features; it all delivers reviewability.
**Delivers:** Sign in with Apple via `expo-apple-authentication` + Supabase Apple provider; `PrivacyInfo.xcprivacy` via Expo config plugin; Android target SDK 35 via `expo-build-properties`; account deletion flow verified end-to-end in UI; `updates.url` in `app.json` corrected or removed
**Addresses:** Apple Guideline 4.8 (Sign in with Apple), Apple `ITMS-91053` (privacy manifest), Google Play API 35 requirement, Apple Guideline 5.1.1(v) (account deletion)
**Avoids:** Near-certain first-submission rejection from Guideline 4.8; binary-level upload failure before human review

### Phase 4: Stability and Accessibility Hardening
**Rationale:** Apple reviewers test edge cases. Silent failures and missing accessibility labels are documented rejection risks. This phase makes the app reviewer-proof and generates the stable, populated state needed for screenshots in Phase 5.
**Delivers:** All silent catch blocks replaced with user-visible error messages; `ErrorBoundary` mounted in `app/_layout.tsx`; `accessibilityLabel` on full reviewer path (tabs, calendar cells, recipe cards, CTAs); iPad layout verified on iPad Pro 12.9" simulator; `accessibilityRole` on all `Pressable` elements; camera/photo permissions audited and removed if unused
**Addresses:** Guideline 2.1 (app not functioning as expected), accessibility audit gaps, iPad layout risk, permission declaration accuracy
**Avoids:** Frozen UI during reviewer's test path; rejection for broken iPad layout (`supportsTablet: true`); rejection for unused declared permissions

### Phase 5: Metadata, Legal, and Submission
**Rationale:** All technical blockers resolved in Phases 1-4. This phase completes the submission pipeline: legal hosting, store console setup, screenshots, and the Google Play tester gate. The Google Play closed testing track must be started at the beginning of this phase (or earlier) given the 14-day minimum clock.
**Delivers:** Privacy policy and terms hosted at permanent public URL; in-app links to both; App Store Connect metadata complete (subtitle, keywords, description, screenshots for iPhone 6.9" and iPad 13", App Privacy Label, content rating, support URL); Google Play Console metadata complete (Data Safety, content rating, screenshots, feature graphic 1024x500); demo account with pre-populated recipes and meal plans; App Review Notes with credentials; Google Play closed testing track with 12 testers
**Addresses:** All metadata table stakes from FEATURES.md, all legal requirements, all submission console dependencies
**Avoids:** Missing screenshot sizes blocking upload; missing credentials causing Guideline 2.1 rejection; 14-day Play Store gate delay if testers not recruited early

### Phase Ordering Rationale

- Phase 1 (Testing) unlocks confident execution of all subsequent phases. Without it, every security and stability fix in Phases 2-4 is a blind change.
- Phase 2 (Security) before Phase 3 (Compliance) because security issues carry production consequences beyond store submission. RLS gaps could enable data extraction the moment a production build is deployed, regardless of review status.
- Phase 3 (Compliance) before Phase 4 (Stability) because the compliance fixes (Sign in with Apple, privacy manifest) require new native modules and `app.json` config changes that may introduce new instability. Better to surface those issues before the stability pass.
- Phase 4 (Stability) before Phase 5 (Metadata) because screenshots and the demo account must show a stable, error-free, accessible app. Capturing screenshots before fixing silent crashes produces screenshots that do not represent the actual reviewer experience.
- Phase 5 (Metadata) is last because it depends on a fully compliant, stable build and requires populated data to generate meaningful screenshots.

### Research Flags

Phases likely needing deeper research or extra caution during planning:
- **Phase 3 (Sign in with Apple):** The native `expo-apple-authentication` flow vs. web OAuth redirect has important nuances for Apple reviewer testing on device. Verify the current Supabase Apple OAuth guide specifically for Expo managed workflow — the integration pattern may have changed since common tutorials were written.
- **Phase 3 (Privacy manifest completeness):** The specific "Required Reason API" categories depend on which Expo SDK modules are installed. Run `npx expo prebuild` and audit the generated `PrivacyInfo.xcprivacy` against Apple's required reasons list — do not assume the Expo config plugin covers everything.
- **Phase 5 (Google Play closed testing gate):** Confirm whether the Play Console account was created before or after November 13, 2023. If after, the 12-tester / 14-day clock must start at the beginning of Phase 5 (or earlier). This is a calendar constraint that research cannot resolve — it requires checking the Play Console account.

Phases with standard patterns (research-phase not needed):
- **Phase 1:** Jest + jest-expo setup is fully documented by Expo and RNTL. The `transformIgnorePatterns` config and mock structure are established patterns with no ambiguity.
- **Phase 2:** RLS verification is a Supabase dashboard operation with clear documentation. No novel patterns required.
- **Phase 4:** Error boundary mounting and `accessibilityLabel` additions follow standard React Native patterns with no platform-specific gotchas.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Expo official docs, npm package versions verified for SDK 52. One MEDIUM item: Maestro Cloud pricing/SLA for March 2026 not independently verified. |
| Features | HIGH | Apple and Google store requirements sourced directly from official guidelines and Expo submission docs. Rejection patterns sourced from multiple independent reports. |
| Architecture | HIGH | Test architecture sourced from Expo official docs and RNTL maintainer (Callstack). NativeWind jest limitation confirmed via GitHub issue #1398. expo/expo #28000 confirms test-in-app/ bundling failure. |
| Pitfalls | HIGH | All critical pitfalls sourced from official Apple/Google documentation with confirmed enforcement dates. RLS and silent-catch risks sourced from first-party CONCERNS.md audit. |

**Overall confidence:** HIGH

### Gaps to Address

- **RLS production state unknown:** Migrations exist in repo but production application status is unverified. Cannot be resolved by research — requires checking the Supabase dashboard directly during Phase 2.
- **Camera/photo permission actual usage:** `app.json` declares camera and photo library permissions. If `ImagePicker` or `Camera` is not actually exercised in the current recipe creation flow, these permissions must be removed to avoid rejection under Guideline 5.1 (data minimization). Audit during Phase 4.
- **Play Console account creation date:** The Google Play closed testing gate applies only to personal accounts created after November 13, 2023. Must be verified by checking Play Console account details before scheduling Phase 5.
- **`getAllRecipes()` silent failure:** Returns `[]` on error rather than throwing, which masks a failed 5000-row query. This is a production data integrity risk beyond test coverage. Address the error contract inconsistency during Phase 4.
- **EAS Update URL misconfiguration:** `app.json` has `"updates": { "url": "" }` — an empty string. If OTA updates will not be used for v1, remove this block or set `"enabled": false` during Phase 3 build configuration work.

## Sources

### Primary (HIGH confidence)
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — Guidelines 4.8, 5.1.1, 2.1
- [Apple — Upcoming Requirements](https://developer.apple.com/news/upcoming-requirements/) — iOS 18 SDK minimum, Xcode 16
- [Apple — Privacy Manifests (Expo docs)](https://docs.expo.dev/guides/apple-privacy/) — `PrivacyInfo.xcprivacy` requirement
- [Expo Unit Testing Documentation](https://docs.expo.dev/develop/unit-testing/) — jest-expo setup, configuration
- [Expo Router Testing Reference](https://docs.expo.dev/router/reference/testing/) — `renderRouter` API
- [Expo EAS Workflows](https://docs.expo.dev/eas/workflows/introduction/) — CI/CD pipeline
- [Expo Submit to App Store](https://docs.expo.dev/submit/ios/) — submission requirements
- [Expo Submit to Google Play](https://docs.expo.dev/submit/android/) — submission requirements
- [Google Play Target API Level Requirements](https://support.google.com/googleplay/android-developer/answer/11926878) — API 35 mandate
- [Google Play Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469) — Data Safety section
- [Google Play Closed Testing Requirements](https://support.google.com/googleplay/android-developer/answer/14151465) — 14-day gate for new accounts
- [React Native Testing Library — Callstack](https://github.com/callstack/react-native-testing-library) — Component testing patterns
- [expo/expo #28000](https://github.com/expo/expo/issues/28000) — Test files in `app/` cause bundling errors (confirmed)
- [expo/expo #27796](https://github.com/expo/expo/issues/27796) — Privacy manifest tracking issue

### Secondary (MEDIUM confidence)
- [NativeWind jest issue #1398](https://github.com/nativewind/nativewind/issues/1398) — `className` not testable via `toHaveStyle`
- [expo/expo #32883](https://github.com/expo/expo/issues/32883) — JSI/New Architecture issues in Jest environment
- [expo/expo #32344](https://github.com/expo/expo/issues/32344) — `supportsTablet` prebuild bug
- [React Native Testing Guide 2026](https://reactnativerelay.com/article/complete-guide-testing-react-native-apps-2026-unit-tests-e2e-maestro) — Testing pyramid overview
- [RevenueCAT — App Store rejections guide](https://www.revenuecat.com/blog/growth/the-ultimate-guide-to-app-store-rejections/) — Rejection pattern analysis
- [EAS Workflows blog post](https://expo.dev/blog/expo-workflows-automate-your-release-process) — GA status and capabilities

### Tertiary (LOW confidence)
- Maestro Cloud pricing and SLA for March 2026 — not independently verified; assumed stable based on 2024-2025 track record

---
*Research completed: 2026-03-29*
*Ready for roadmap: yes*
