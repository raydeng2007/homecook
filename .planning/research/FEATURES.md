# Feature Landscape: App Store Readiness

**Domain:** iOS App Store + Google Play Store submission requirements for a household meal planning app
**Researched:** 2026-03-29
**Scope:** Existing Expo SDK 52 + React Native app preparing for first store submission

---

## Context: What the App Already Has

Before categorizing requirements, this is what HomeCook already has that is store-relevant:

- Email/password and OAuth (Google, Facebook) authentication — implemented
- Privacy policy HTML document at `legal/privacy-policy.html` — exists
- Terms of service HTML document at `legal/terms-of-service.html` — exists
- In-app account deletion flow (`household.tsx` + `migration-006-delete-account.sql`) — implemented
- `app.json` with `bundleIdentifier`, `package`, camera/photo usage description strings — configured
- `eas.json` with dev/preview/production build profiles — configured
- App icon (`assets/icon.png`) and splash screen (`assets/splash.png`) — present

What is NOT yet done is tracked below.

---

## Table Stakes

Features/requirements where missing = app gets rejected or cannot be submitted.

### Legal & Privacy

| Requirement | Why Required | Complexity | Current Status |
|-------------|--------------|------------|----------------|
| Privacy policy at a publicly accessible URL | Apple requires a URL in App Store Connect metadata and in-app link. Google Play requires URL in store listing. Rejection without it. | Low | HTML file exists locally; needs to be hosted at a public URL |
| Privacy policy linked inside the app | Apple guideline 5.1.1. Must be accessible without login. | Low | Not confirmed as in-app link — needs verification/implementation |
| Terms of service linked inside the app | Required for apps with accounts and user-generated content (recipes are UGC). | Low | HTML file exists locally; needs hosting + in-app link |
| In-app account deletion | Apple guideline 5.1.1(v), mandatory since June 2022. Must allow users to initiate deletion from within the app without going to a website. | Low | Already implemented in `household.tsx` — verify it deletes all user data end-to-end |
| Accurate App Privacy Label (iOS) | Required by Apple before any submission. Must declare all data types collected (email, name, app content). Inaccurate labels cause rejection. | Medium | Not yet filled in App Store Connect |
| Data Safety section (Google Play) | Mandatory declaration in Play Console. Must declare: data collected, data shared, security practices. | Medium | Not yet filled in Play Console |
| Encryption declaration (iOS) | `usesNonExemptEncryption: false` already set in `app.json` — this is the export compliance declaration. | None | Already done in `app.json` |

### Technical Build Requirements

| Requirement | Why Required | Complexity | Current Status |
|-------------|--------------|------------|----------------|
| iOS build with iOS 18 SDK (Xcode 16) | Apple requires builds uploaded after April 2025 to use Xcode 16 / iOS 18 SDK. EAS Build uses latest by default. | None | EAS `production` profile uses `image: "latest"` — satisfied automatically |
| Android target API level 35 (Android 15) | Google Play requires new submissions to target API 35 as of August 31, 2025. | Low | Expo SDK 52 + React Native 0.76 target API 35 by default — verify in build output |
| Android App Bundle (.aab) format | Google Play requires AAB, not APK, for new apps. EAS produces AAB for production by default. | None | EAS production build produces AAB — satisfied |
| 64-bit architecture support | Apple requirement for all submissions. React Native 0.76 + Expo SDK 52 already produce 64-bit builds. | None | Already satisfied |
| App not in placeholder/beta state | Apple rejects apps that feel unfinished: empty screens, placeholder text ("Lorem ipsum"), non-functional buttons. | Medium | Shopping list placeholder tab needs real content or removal. Several silent error states need user-visible feedback. |
| No crashes during review | Even one crash during Apple's review causes rejection. The reviewer may not have the same data state as a regular user. | Medium | Silent error-swallowing (AddMealModal, recipe edit) could cause reviewer to see blank screens. Needs fix. |
| Demo account credentials provided | If app requires login, Apple reviewers must be given working credentials. Credentials go in App Store Connect Review Notes. | Low | Need to create a dedicated demo account with pre-populated recipes and meal plans |
| `bundleIdentifier` (iOS) and `package` (Android) configured | Unique reverse-domain identifiers required for submission. | None | Already set (`io.rayray.homecook`) |
| App icon 1024x1024 PNG | Required for App Store Connect upload. | Low | `assets/icon.png` exists — verify it is exactly 1024x1024 PNG, no rounded corners (Apple adds corners) |
| Android adaptive icon | Required for Play Store for modern Android home screens. | None | `assets/adaptive-icon.png` configured in `app.json` |
| Splash screen | Not a hard rejection but causes immediate negative impression if missing. | None | Already configured via `expo-splash-screen` |

### Metadata (Required for Submission)

| Requirement | Why Required | Complexity | Current Status |
|-------------|--------------|------------|----------------|
| App name (max 30 chars iOS, max 50 chars Android) | Required field. "HomeCook" is 8 chars — fine. | None | "HomeCook" — ready |
| Short description (Google Play, max 80 chars) | Required field in Play Console. | Low | Not yet written |
| Full description (max 4000 chars iOS, unlimited Android) | Required field for both stores. | Low | Not yet written |
| Keywords (iOS only, max 100 chars) | Not required but strongly recommended for discoverability — leaving blank hurts ranking significantly. | Low | Not yet written |
| Subtitle (iOS, max 30 chars) | Not required but appears directly under app name in search — major ASO factor. | Low | Not yet written |
| Content rating / age rating | Apple requires you to answer a questionnaire to generate a rating. Google requires the IARC rating questionnaire. | Low | Not yet done |
| Screenshots — iPhone 6.9" (1290x2796 px) | Required by Apple for all 2025+ submissions. Apple scales down to all smaller sizes from this. Minimum 1 screenshot. | Medium | Not yet created |
| Screenshots — iPad 13" (2064x2752 px) | Required because `supportsTablet: true` is set in `app.json`. | Medium | Not yet created |
| Screenshots — Android phone (min 2 screenshots) | Required for Play Store. Minimum 320px, maximum 3840px. | Medium | Not yet created |
| Feature graphic (Google Play, 1024x500 px) | Required by Google Play. Displayed prominently on store listing. | Low | Not yet created |
| Support URL | Apple requires a URL where users can get support. | Low | Needs a hosted page or email link |
| Contact email (Google Play) | Required field in Play Console developer settings. | None | Should use developer email |
| Category selection | Required on both stores. "Food & Drink" is the appropriate primary category. | None | Not yet selected in consoles |

### Permission Declarations

| Requirement | Why Required | Complexity | Current Status |
|-------------|--------------|------------|----------------|
| Camera usage description string | Apple requires `NSCameraUsageDescription` if camera permission is declared. | None | Already set in `app.json` infoPlist |
| Photo library usage description string | Apple requires `NSPhotoLibraryUsageDescription`. | None | Already set in `app.json` infoPlist |
| Permissions must match actual usage | Apple rejects apps that declare permissions they do not use. If camera is declared, the app must actually use the camera. If it doesn't, remove the permission. | Low | Verify camera/photo permissions are actually exercised in the recipe creation flow |

---

## Differentiators

Requirements not strictly mandatory for submission but that improve review pass rate, user trust, discoverability, and rating quality.

### Stability and Quality

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Fix all silent error swallowing | Apple reviewers actively test edge cases. A blank screen where a list should appear can cause rejection for "not functioning as expected." | Medium | 4 known locations in CONCERNS.md: AddMealModal (2x), recipe edit load, recipes lib |
| Server-side recipe search | Current client-side `getAllRecipes()` fetches up to 5000 rows. App Store review happens on real devices. A slow or crashing search screen is a rejection risk. | High | Requires Postgres full-text search migration |
| Error boundaries and fallback UI | Unhandled JS exceptions in React Native crash the app. An `ErrorBoundary` prevents white screens. | Low | `components/ErrorBoundary.tsx` exists (untracked per git status) — integrate it |
| Input validation completeness | Apple tests edge cases: very long text, special characters, empty fields. Trim-only validation is insufficient. | Medium | Add max-length enforcement on recipe fields |

### Accessibility

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| `accessibilityLabel` on all interactive elements | Apple's App Store Review Guidelines (Section 4.2) expect apps to be functional and usable. Accessibility gaps can cause rejection for "Design — Minimum Functionality." Not a hard reject threshold but increasingly enforced. Also required under European Accessibility Act (EAA) for EU distribution. | Medium | CONCERNS.md documents only 25 total accessibility labels across the app. Calendar hexagon selectors have no labels. |
| `accessibilityRole` on buttons and tabs | Screen readers need role hints to convey action type (button, tab, checkbox). | Low | Audit all `Pressable` elements |
| Minimum 44pt touch targets | Apple HIG minimum. WCAG 2.2 success criterion 2.5.8 for mobile apps. | Low | Calendar date cells may be smaller than 44pt on small iPhones — verify |
| Avoid color-only information | WCAG requirement. Don't rely on color alone to convey meal type status. | Low | Meal type color badges should also use icons or labels |

### Trust & Legal Quality

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Privacy policy hosted at permanent URL | The local HTML files need a permanent public URL (not localhost). A common approach: host on GitHub Pages, Notion public page, or a simple static site. | Low | Files already written — just needs hosting |
| Contact/support URL hosted | Apple requires a working support URL that reviewers actually visit. | Low | Can be the same domain as privacy policy or a mailto: link |
| Privacy policy URL linked inside settings/profile screen | Apple expects users to find the privacy policy without leaving the app. | Low | Add a "Privacy Policy" tappable link in household/settings screen |
| User content reporting mechanism | Apple guideline 1.2 for UGC apps: must have a mechanism to report offensive content. Recipes are user-generated. This applies even if content is not public-facing. | Medium | No reporting mechanism currently exists. A simple "Report" option on recipe cards satisfies this. |

### Metadata Quality (ASO Impact)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Subtitle with keyword | iOS subtitle (30 chars) appears in search results under the app name. "Meal Planning for Families" or "Plan meals, shop smarter" captures high-intent searches. | None | Copy writing task only |
| Keyword field optimization (iOS) | 100-character keyword field, comma-separated, no spaces. Targets terms not already in name/subtitle. Example: "recipe,grocery,household,calendar,dinner,cook" | None | Copy writing task only |
| App preview video (optional, up to 3) | Preview videos increase conversion rates 10–30% in A/B tests. For a calendar/planning app, showing the daily loop in 15–30 seconds is highly effective. | Medium | Requires screen recording + light editing |
| Localized screenshots | Screenshots in English are sufficient for v1 US/international launch. Localization is a post-launch growth lever. | High | Defer to post-launch |

### Security (Affects Review and Rejection Risk)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| RLS verification | If RLS is not applied, any authenticated user can access other households' data via the Supabase anon key. Apple and Google do not directly test this, but data leakage discovered post-launch causes emergency removal. | Medium | CONCERNS.md marks RLS status as "uncertain." Migration 007 (recursion fix) must be confirmed applied. |
| `.env` added to `.gitignore` | Not a store requirement, but Supabase keys exposed in a public repo can result in the app being taken down by Apple/Google on security grounds. | None | Single `.gitignore` line addition |
| Authorization checks in recipe CRUD | Defense-in-depth against RLS misconfiguration. | Low | Add `created_by` filter to `deleteRecipe` and `updateRecipe` client-side |

---

## Anti-Features

Features to explicitly NOT build for this submission milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| UGC moderation system | Apple guideline 1.2 requires reporting for UGC apps, but HomeCook's recipes are private-household content, not public social content. Over-engineering a full moderation pipeline wastes time and introduces new failure modes. | Add a simple "Report content" option that sends an email to support — one day of work, satisfies the requirement |
| Offline support / optimistic updates | Offline-first architecture requires significant state management changes (React Query or similar) and conflict resolution logic. Out of scope per PROJECT.md. | Ensure graceful degradation: show "You're offline" when network is unavailable instead of silent failure |
| Push notifications | Requires additional Apple/Google developer configuration, entitlements, and backend infrastructure. Not needed for v1. | Defer — add post-launch when users request reminders for shopping or meal prep |
| App preview video (v1) | High effort, low urgency. The app needs to pass review first; ASO optimization is post-launch. | Add after initial approval. Prioritize screenshot quality instead. |
| Localization / i18n | Full localization is a major engineering investment. English-only is acceptable for initial launch. | Ship in English. Add localization after user demand in specific markets is demonstrated. |
| Payment / in-app purchases | Free app for v1. Adding IAP adds complexity, requires Apple IAP API compliance, and 30% revenue cut. | Explicitly out of scope per PROJECT.md. If monetization is added later, it requires a separate review pass. |
| Social sharing / public recipes | Adds UGC moderation requirements, reporting systems, and content policy work. Not needed for household-private use. | Explicitly out of scope per PROJECT.md. |
| TestFlight beta program | A structured TestFlight program requires additional setup and delays launch. The app can go straight to production after internal testing. | Use the EAS preview build for internal testing, then submit directly to production. |

---

## Feature Dependencies

```
Privacy policy hosted URL
  → App Store Connect metadata submission (requires working URL)
  → In-app privacy policy link (requires working URL)
  → Google Play store listing (requires working URL)

Demo account with pre-populated data
  → Apple App Store review submission (reviewers need populated state to evaluate the app)

Account deletion verified end-to-end
  → App Store Connect submission (Apple actively tests this for account-based apps)

Screenshots (iPhone 6.9", iPad 13")
  → App Store Connect submission (required fields, cannot submit without them)

Android screenshots (minimum 2)
  → Google Play Console submission (required fields)

Feature graphic (1024x500)
  → Google Play Console submission (required field)

App Privacy Label (iOS)
  → App Store Connect submission (required before upload)

Data Safety section (Android)
  → Google Play Console submission (required before release)

Content rating questionnaire
  → Both stores (must be completed before submission)

RLS confirmed applied
  → Secure production submission (security precondition)

Silent error swallowing fixed
  → Crash-free review experience (reduces rejection risk)
```

---

## MVP Submission Checklist

Minimum required to pass first submission review:

**Legal (1–2 days):**
1. Host `privacy-policy.html` and `terms-of-service.html` at a permanent public URL
2. Add Privacy Policy + Terms links inside the app (settings or profile screen)
3. Verify account deletion works end-to-end and deletes all user data from Supabase

**Metadata (1 day):**
4. Write app description (short + full) for both stores
5. Write iOS keywords (100 chars) and subtitle (30 chars)
6. Create App Store screenshots: iPhone 6.9" and iPad 13"
7. Create Google Play screenshots (minimum 2) and feature graphic (1024x500)
8. Create demo account with pre-populated recipes and meal plans

**Store Console Setup (1 day):**
9. Complete App Privacy Label questionnaire in App Store Connect
10. Complete Data Safety section in Google Play Console
11. Complete content rating questionnaire (both stores)
12. Enter support URL and contact email

**Stability (2–3 days):**
13. Fix silent error swallowing in AddMealModal, recipe edit, and recipes lib
14. Verify camera/photo permissions are actually used — remove if not
15. Confirm RLS migrations have been applied in Supabase dashboard
16. Add `.env` to `.gitignore`

**Defer (post-launch):**
- App preview video
- Localization
- Server-side search
- Push notifications

---

## Sources

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
- [Apple Upcoming Requirements — SDK minimums](https://developer.apple.com/news/upcoming-requirements/)
- [Apple Account Deletion Requirement](https://developer.apple.com/news/?id=12m75xbj)
- [Apple Screenshot Specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)
- [Google Play Target API Level Requirements](https://support.google.com/googleplay/android-developer/answer/11926878)
- [Google Play Data Safety Section](https://support.google.com/googleplay/android-developer/answer/10787469)
- [App Store Requirements: iOS & Android Submission Guide 2026](https://natively.dev/articles/app-store-requirements)
- [App Store Review Guidelines 2026 — Adapty](https://adapty.io/blog/how-to-pass-app-store-review/)
- [Common Apple App Store Rejection Reasons 2025](https://twinr.dev/blogs/apple-app-store-rejection-reasons-2025/)
- [Expo Submit to Apple App Store](https://docs.expo.dev/submit/ios/)
- [Expo Submit to Android / Google Play](https://docs.expo.dev/submit/android/)
- [European Accessibility Act — Mobile Apps](https://blog.usablenet.com/mobile-app-accessibility-guidelines)
- [WCAG 2.2 Mobile Accessibility](https://www.levelaccess.com/blog/wcag-for-mobile-apps/)
