# Roadmap: Homecook App Store Launch

## Overview

The app is feature-complete. This milestone hardens it for production: a testing foundation is laid first so every subsequent change is verifiable, then security and stability issues are fixed, then store compliance blockers are resolved, and finally the submission pipeline is executed. Four phases, ordered by blocking dependency — each one unblocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Testing Foundation** - Install Jest + jest-expo, write unit tests for all pure utility functions, commit package-lock.json
- [ ] **Phase 2: Security and Stability** - Verify RLS, fix silent catches, harden auth guards, mount ErrorBoundary
- [ ] **Phase 3: Store Compliance** - Sign in with Apple, privacy manifest, Android API 35, legal pages linked in-app
- [ ] **Phase 4: Submission** - Store console setup, screenshots, demo account, build and submit to both stores

## Phase Details

### Phase 1: Testing Foundation
**Goal**: A working test harness exists and all pure utility functions have unit test coverage
**Depends on**: Nothing (first phase)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06
**Success Criteria** (what must be TRUE):
  1. `npm test` runs without error and produces a passing test report
  2. `lib/validation.ts`, `lib/ingredient-normalize.ts`, `lib/portion-scaling.ts`, and `lib/date-utils.ts` each have tests that pass edge cases
  3. `package-lock.json` exists and is committed, so `npm ci` succeeds in a fresh environment
  4. Test files live in `__tests__/` (not `app/`), and the Jest config matches the jest-expo preset exactly
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Install jest + jest-expo, create jest.config.js, add test scripts
- [ ] 01-02-PLAN.md — Extract date-utils to shared module, write validation + date-utils tests
- [ ] 01-03-PLAN.md — Write ingredient-normalize, portion-scaling, ingredient-categories tests; commit lockfile

### Phase 2: Security and Stability
**Goal**: The app cannot expose other households' data and will not show a blank/frozen screen when errors occur
**Depends on**: Phase 1
**Requirements**: SEC-02, SEC-03, SEC-04, SEC-05, STAB-01, STAB-02, STAB-03, STAB-04, STAB-05, STAB-06, STAB-07
**Success Criteria** (what must be TRUE):
  1. Running `SELECT * FROM recipes` as a Supabase user who owns no recipes returns zero rows (RLS active)
  2. Tapping "delete account" from the Household screen executes the `delete_user_account` RPC, signs the user out, and leaves no orphaned data
  3. Triggering a network error in AddMealModal and recipe edit shows a visible error message instead of a silent freeze
  4. The `.env` file is listed in `.gitignore` and does not appear in `git status` output
  5. Attempting to save a recipe with a title longer than the allowed maximum is blocked with a visible validation message
**Plans**: TBD

### Phase 3: Store Compliance
**Goal**: The app meets every hard technical requirement for iOS and Android store submission
**Depends on**: Phase 2
**Requirements**: SEC-01, COMP-01, COMP-02, COMP-03, COMP-04
**Success Criteria** (what must be TRUE):
  1. The login screen displays a "Sign in with Apple" button that completes authentication end-to-end on a physical iOS device
  2. `npx expo prebuild` produces an iOS binary that includes `PrivacyInfo.xcprivacy` with the required NSPrivacyAccessedAPI categories
  3. The EAS production build targets Android API 35 (confirmed in `app.json` via `expo-build-properties`)
  4. Tapping a "Privacy Policy" link and a "Terms of Service" link in the app opens the hosted public URLs
**Plans**: TBD
**UI hint**: yes

### Phase 4: Submission
**Goal**: Both apps are submitted to their respective stores and the Google Play closed testing gate is started
**Depends on**: Phase 3
**Requirements**: SUB-01, SUB-02, SUB-03, SUB-04, SUB-05, SUB-06, SUB-07, SUB-08, SUB-09, SUB-10
**Success Criteria** (what must be TRUE):
  1. App Store Connect listing is live with description, keywords, category, iPhone and iPad screenshots, App Privacy Label, and content rating completed
  2. Google Play Console listing is live with description, Data Safety section, content rating, phone screenshots, and feature graphic completed
  3. A demo account with pre-populated recipes and meal plans is documented in the App Review Notes field
  4. `eas submit` completes without error for the iOS production build
  5. Google Play closed testing track has 12 opt-in testers and the 14-day clock has started
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Testing Foundation | 0/3 | Not started | - |
| 2. Security and Stability | 0/? | Not started | - |
| 3. Store Compliance | 0/? | Not started | - |
| 4. Submission | 0/? | Not started | - |
