# Requirements: Homecook App Store Launch

**Defined:** 2026-03-29
**Core Value:** Households can plan meals together and generate accurate shopping lists — the daily-use loop must work flawlessly.

## v1 Requirements

Requirements for app store submission. Each maps to roadmap phases.

### Testing

- [ ] **TEST-01**: Jest + jest-expo test framework installed and configured with jest.config.js
- [ ] **TEST-02**: Unit tests for validation functions (lib/validation.ts) with edge cases
- [ ] **TEST-03**: Unit tests for ingredient normalization (lib/ingredient-normalize.ts)
- [ ] **TEST-04**: Unit tests for portion scaling (lib/portion-scaling.ts)
- [ ] **TEST-05**: Unit tests for date utility functions (extracted to lib/date-utils.ts)
- [ ] **TEST-06**: package-lock.json generated and committed (CI blocker)

### Security

- [ ] **SEC-01**: Sign in with Apple implemented as login option (iOS App Store hard blocker)
- [ ] **SEC-02**: RLS policies verified applied in production Supabase (migrations 005-007)
- [ ] **SEC-03**: .env added to .gitignore to prevent accidental key exposure
- [ ] **SEC-04**: Client-side created_by guards on recipe update/delete as defense-in-depth
- [ ] **SEC-05**: Account deletion UI wired to delete_user_account RPC and verified end-to-end

### Compliance

- [ ] **COMP-01**: Privacy manifest (PrivacyInfo.xcprivacy) configured in app.json expo.ios.privacyManifests
- [ ] **COMP-02**: Android target API 35 set via expo-build-properties in app.json
- [ ] **COMP-03**: Privacy policy hosted at public URL and linked in app
- [ ] **COMP-04**: Terms of service hosted at public URL and linked in app

### Stability

- [ ] **STAB-01**: Silent catch in AddMealModal recipe load replaced with user-facing error
- [ ] **STAB-02**: Silent catch in AddMealModal meal plan save replaced with user-facing error
- [ ] **STAB-03**: Silent catch in recipe edit load replaced with user-facing error
- [ ] **STAB-04**: Silent catches in getPersonalRecipes replaced with error propagation
- [ ] **STAB-05**: Input length validation on recipe title, description, and instructions
- [ ] **STAB-06**: Input content sanitization to prevent unexpected characters breaking rendering
- [ ] **STAB-07**: ErrorBoundary verified mounted at root layout covering all screens

### Submission

- [ ] **SUB-01**: App Store Connect listing created with description, keywords, category
- [ ] **SUB-02**: Google Play Console listing created with description, category
- [ ] **SUB-03**: iPhone screenshots captured (6.7" and 6.1" sizes)
- [ ] **SUB-04**: iPad screenshots captured (12.9" size)
- [ ] **SUB-05**: Android phone screenshots captured
- [ ] **SUB-06**: Demo account credentials prepared for Apple reviewer
- [ ] **SUB-07**: EAS production build profile configured and verified
- [ ] **SUB-08**: App submitted to iOS App Store via eas submit
- [ ] **SUB-09**: App submitted to Google Play via eas submit
- [ ] **SUB-10**: Google Play closed testing track started with 12 testers (14-day gate)

## v2 Requirements

Deferred to post-launch. Tracked but not in current roadmap.

### Testing Expansion

- **TEST-V2-01**: Data layer tests with mocked Supabase client (recipes, meal plans, homes CRUD)
- **TEST-V2-02**: Component tests for RecipeForm, AddMealModal, and other interactive components
- **TEST-V2-03**: CI pipeline (GitHub Actions) running TypeScript + Jest on every push
- **TEST-V2-04**: Code coverage thresholds enforced in CI
- **TEST-V2-05**: Screen integration tests with Expo Router renderRouter

### Accessibility

- **ACC-V2-01**: Accessibility labels on all interactive elements (Pressable, touchable Views)
- **ACC-V2-02**: Accessibility roles for buttons, tabs, and checkboxes
- **ACC-V2-03**: Screen reader navigation path tested end-to-end

### Performance

- **PERF-V2-01**: Server-side full-text search replacing client-side 5000-row fetch
- **PERF-V2-02**: Memoization of FlatList renderItem callbacks in large screens
- **PERF-V2-03**: Meal plan date caching to prevent re-queries on each date tap

## Out of Scope

| Feature | Reason |
|---------|--------|
| Offline support / optimistic updates | Defer to post-launch based on user feedback |
| Push notifications | Not needed for v1, adds complexity |
| Social features (sharing, comments) | Not core to household meal planning |
| Web deployment | Focus on native mobile for app store launch |
| Payments / subscriptions | Free app for v1 |
| Localized store descriptions | English-only for v1 launch |
| ASO keyword optimization | Can iterate post-launch based on data |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEST-01 | Phase 1 | Pending |
| TEST-02 | Phase 1 | Pending |
| TEST-03 | Phase 1 | Pending |
| TEST-04 | Phase 1 | Pending |
| TEST-05 | Phase 1 | Pending |
| TEST-06 | Phase 1 | Pending |
| SEC-01 | Phase 3 | Pending |
| SEC-02 | Phase 2 | Pending |
| SEC-03 | Phase 2 | Pending |
| SEC-04 | Phase 2 | Pending |
| SEC-05 | Phase 2 | Pending |
| COMP-01 | Phase 3 | Pending |
| COMP-02 | Phase 3 | Pending |
| COMP-03 | Phase 3 | Pending |
| COMP-04 | Phase 3 | Pending |
| STAB-01 | Phase 2 | Pending |
| STAB-02 | Phase 2 | Pending |
| STAB-03 | Phase 2 | Pending |
| STAB-04 | Phase 2 | Pending |
| STAB-05 | Phase 2 | Pending |
| STAB-06 | Phase 2 | Pending |
| STAB-07 | Phase 2 | Pending |
| SUB-01 | Phase 4 | Pending |
| SUB-02 | Phase 4 | Pending |
| SUB-03 | Phase 4 | Pending |
| SUB-04 | Phase 4 | Pending |
| SUB-05 | Phase 4 | Pending |
| SUB-06 | Phase 4 | Pending |
| SUB-07 | Phase 4 | Pending |
| SUB-08 | Phase 4 | Pending |
| SUB-09 | Phase 4 | Pending |
| SUB-10 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-29 after roadmap creation*
