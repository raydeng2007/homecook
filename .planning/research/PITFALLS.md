# App Store Submission Pitfalls

**Domain:** Expo SDK 52 + React Native meal planning app (iOS App Store + Google Play Store)
**Researched:** 2026-03-29
**App:** HomeCook — household meal planning, recipe CRUD, calendar, shopping list, OAuth (Google + Facebook + email)

---

## Critical Pitfalls

Mistakes that cause outright rejection or require a full resubmission cycle.

---

### Pitfall 1: Missing "Sign in with Apple" for Social OAuth

**What goes wrong:** Apple Guideline 4.8 requires that any app offering a third-party login (Google, Facebook) must also offer an equivalent privacy-respecting login option. HomeCook offers Google OAuth and Facebook OAuth but no Sign in with Apple. This is a near-certain rejection on first submission.

**Why it happens:** Developers focus on building auth that works and overlook Apple's requirement that applies specifically at submission time.

**Consequences:** Rejection with message citing Guideline 4.8. Cannot ship to App Store until resolved.

**Prevention:**
- Implement Sign in with Apple using `expo-apple-authentication` before submitting.
- Supabase supports Apple OAuth natively — follow the Supabase + React Native Apple auth guide.
- Use the native `expo-apple-authentication` flow (not the web OAuth redirect) on iOS — Apple reviewers test on device.
- Add the `com.apple.developer.applesignin` entitlement in `app.json` under `ios.entitlements`.

**Detection:** Missing from `app.json` `plugins` list. No `expo-apple-authentication` in `package.json`.

**Phase:** Must be addressed before any App Store submission attempt.

**Confidence:** HIGH — Apple Developer documentation, multiple rejection reports confirm this requirement.

---

### Pitfall 2: Account Deletion Not Surfaced In-App (Apple Guideline 5.1.1v)

**What goes wrong:** Apple requires all apps that support account creation to provide an in-app path for users to initiate deletion of their account. The deletion function exists as `delete_user_account` in `migration-006`, but it is unclear whether this is accessible from within the app UI. Reviewers explicitly test this during review.

**Why it happens:** The backend function was written but the UI entry point may not be wired in the Household settings screen.

**Consequences:** Rejection citing Guideline 5.1.1(v). This is a mandatory requirement, not optional.

**Prevention:**
- Add a clearly labeled "Delete Account" action in the Household or Profile screen.
- Confirm it calls `delete_user_account` RPC and signs the user out on success.
- Show a confirmation dialog with explicit consequences ("All your recipes and meal plans will be deleted").
- Verify the RPC migration-006 has actually been applied in the Supabase dashboard.

**Detection:** Check `app/(app)/household.tsx` for a "Delete Account" button connected to the RPC.

**Phase:** Must be verified/implemented before submission.

**Confidence:** HIGH — Apple Developer News, App Store Review Guideline 5.1.1(v), June 2022 enforcement.

---

### Pitfall 3: Privacy Manifest Missing (PrivacyInfo.xcprivacy)

**What goes wrong:** Since May 1, 2024, Apple requires all apps to include a `PrivacyInfo.xcprivacy` file declaring which privacy-sensitive APIs the app and its dependencies access. React Native core and common Expo modules access APIs in Apple's "Required Reason API" list (UserDefaults, file timestamps, system boot time, disk space). Missing this file causes upload rejection at the binary validation step — before human review even begins.

**Why it happens:** This is a relatively new requirement that many tutorials and boilerplate projects predate. EAS Build does not automatically generate this file.

**Consequences:** `ITMS-91053` upload error. Binary is rejected by App Store Connect before reaching review queue.

**Prevention:**
- Add `PrivacyInfo.xcprivacy` to `app.json` via the Expo privacy manifest config plugin.
- Follow the Expo documentation at `docs.expo.dev/guides/apple-privacy/`.
- Include entries for `NSPrivacyAccessedAPICategoryUserDefaults` (used by AsyncStorage/SecureStore), `NSPrivacyAccessedAPICategoryFileTimestamp`, and `NSPrivacyAccessedAPICategoryDiskSpace` — React Native core accesses all of these.
- Run `npx expo prebuild` and inspect `ios/HomeCook/PrivacyInfo.xcprivacy` to verify the file exists and is populated.

**Detection:** Check `app.json` for `expo.ios.privacyManifests` key. Check that `PrivacyInfo.xcprivacy` exists after `expo prebuild`.

**Phase:** Must be in place before any EAS production build.

**Confidence:** HIGH — Apple Developer Documentation, Expo GitHub tracking issue #27796, enforced since May 2024.

---

### Pitfall 4: Google Play Closed Testing Requirement (New Personal Accounts)

**What goes wrong:** Personal Google Play Console accounts created after November 13, 2023 must complete a closed testing round with at least 12 opt-in testers for 14 consecutive days before being allowed to publish to production. Apps submitted to production without satisfying this gating requirement are blocked, not rejected — the "Publish" button is simply unavailable.

**Why it happens:** Developers don't discover this requirement until they try to publish and find production access locked.

**Consequences:** 14-day minimum delay before the first Play Store release, even if the app is fully ready.

**Prevention:**
- Determine if the Google Play Console account was created before or after November 13, 2023.
- If personal account created after that date: set up a closed testing track immediately at the start of the milestone, not at the end.
- Recruit 12 testers (friends, family, beta users) and have them opt in to the test.
- The 14-day clock starts from the day testers opt in — start early.
- Organization accounts are exempt from this requirement.

**Detection:** Log into Google Play Console, go to the app's "Testing" section. If a "Closed testing requirements" warning is shown, the requirement applies.

**Phase:** Must be started at the beginning of the submission milestone, not the end.

**Confidence:** HIGH — Google Play Console Help documentation, confirmed by community reports.

---

### Pitfall 5: RLS Not Applied — Data Leak Between Households

**What goes wrong:** The CONCERNS.md audit identifies that RLS migration status is uncertain. If migrations 005-007 have not been applied in production Supabase, any authenticated user can query any other household's recipes, meal plans, and member data using the public anon key. App Store review does not catch this, but it is a production data security failure that violates Apple's data privacy guidelines and could trigger removal after publication.

**Why it happens:** Migration scripts exist in the repo but have not been verified as applied in the live Supabase project. The `home_members` policy also had a self-referencing recursion bug (addressed in migration-007).

**Consequences:** Cross-household data exposure. Post-launch removal risk if reported. Possible GDPR/privacy law liability.

**Prevention:**
- In Supabase Dashboard → Authentication → Policies, verify RLS is enabled on `recipes`, `meal_plans`, `home_members`, and `homes` tables.
- Confirm migration-007 (recursion-safe `home_members` policy) is applied, not just migration-005.
- Test with two separate test accounts: log in as User A, attempt to fetch User B's recipes via Supabase client — should return empty or error.
- Add `created_by = auth.uid()` filter to `deleteRecipe` and `updateRecipe` in `lib/recipes.ts` as client-side defense-in-depth.

**Detection:** Run `SELECT * FROM recipes` using a Supabase client authenticated as a user who owns zero recipes. If rows return, RLS is not active.

**Phase:** Security hardening phase, before any production deployment.

**Confidence:** HIGH — CONCERNS.md audit, Supabase RLS documentation.

---

## Moderate Pitfalls

Issues that cause rejection but are straightforward to resolve.

---

### Pitfall 6: Reviewer Cannot Log In — Demo Account Required

**What goes wrong:** Apple reviewers test apps manually. If they cannot log in (credentials don't work, email confirmation is required, OAuth fails in their sandbox environment), the app is rejected under Guideline 2.1. This is the most common first-submission rejection.

**Why it happens:** Developers forget to provide credentials, provide expired/invalid credentials, or their auth flow requires 2FA on the test account.

**Consequences:** Immediate rejection. Fast to fix, but adds a full review cycle delay (1-3 days).

**Prevention:**
- Create a dedicated reviewer test account (e.g., `review@homecook.test` or a real email you control).
- Disable 2FA/MFA on that account.
- Pre-seed the account with at least one household, two or three recipes, and one meal plan so the reviewer can evaluate core functionality.
- Enter these credentials in App Store Connect → App Review Information → Sign-in required.
- Test the exact credentials yourself in a clean simulator before submitting.
- For Google/Facebook OAuth: note in the App Review Notes that these require real Apple/Google accounts — explain the email/password path is the easiest reviewer path.

**Detection:** Missing credentials in App Store Connect Review Information section.

**Phase:** Final pre-submission checklist step.

**Confidence:** HIGH — Multiple Apple Developer Forum threads, common rejection pattern.

---

### Pitfall 7: Android Target API Level Below Requirement

**What goes wrong:** Google Play requires all new app submissions to target Android 15 (API level 35) as of August 31, 2025. Expo SDK 52 supports API 35 but requires explicit configuration via `expo-build-properties`. Without this, EAS Build defaults to a lower target SDK and the Play Store rejects the upload.

**Why it happens:** The default `targetSdkVersion` in older Expo configurations is below 35. Developers assume EAS handles this automatically.

**Consequences:** Play Console rejects the APK/AAB at upload time with a policy violation message.

**Prevention:**
- Install `expo-build-properties` if not already present.
- In `app.json` plugins array, add:
  ```json
  ["expo-build-properties", { "android": { "targetSdkVersion": 35, "compileSdkVersion": 35 } }]
  ```
- Verify with `eas build --platform android --profile production` and inspect the build logs for the SDK version.

**Detection:** Check `android/build.gradle` after prebuild for `targetSdkVersion`. Or check `package.json` for `expo-build-properties`.

**Phase:** Build configuration phase, before first Android production build.

**Confidence:** HIGH — Google Play Developer documentation, Expo GitHub issues, confirmed for SDK 52.

---

### Pitfall 8: iPad Layout Broken Despite supportsTablet: true

**What goes wrong:** `app.json` has `ios.supportsTablet: true`. Apple reviewers test on iPad even for phone-primary apps. If the layout breaks, overflows, or presents unusable UI on iPad screen dimensions, reviewers reject under Guideline 2.1 (app not functional on the reviewed device).

**Why it happens:** Development and testing happens almost exclusively on phone simulators. NativeWind responsive utilities and flex layouts may not scale correctly to iPad proportions.

**Consequences:** Rejection citing layout/usability issues on iPad.

**Prevention:**
- Test every screen on iPad simulator (iPad Pro 12.9") before submission.
- Pay particular attention to: `MonthCalendarGrid` (hexagon layout may overflow), `RecipeForm` (long forms may need scroll constraints), `CustomTabBar` (FAB positioning on wide screens), modal sheets.
- Use `maxWidth` constraints on modal and form containers so they don't stretch to full iPad width.
- If iPad support is genuinely not a priority, set `ios.supportsTablet: false` — but then verify that `expo prebuild` does not re-add it (known Expo bug in issue #32344).

**Detection:** Run on iPad Air simulator. Look for overflowing content or misaligned elements.

**Phase:** QA / device testing phase.

**Confidence:** HIGH — Expo documentation, Apple rejection reports, known expo-prebuild bug #32344.

---

### Pitfall 9: Privacy Policy Not Accessible From Within the App

**What goes wrong:** Apple requires a privacy policy URL in App Store Connect AND the policy must be accessible from within the app itself (typically in a Settings or About screen). Apps where the policy is only in the App Store listing are rejected under Guideline 5.1.1.

**Why it happens:** Developers add the URL to App Store Connect metadata but forget an in-app link.

**Consequences:** Rejection citing Guideline 5.1.1 privacy policy access.

**Prevention:**
- Add a "Privacy Policy" link in the Household or Settings screen that opens a webview or the policy URL via `Linking.openURL`.
- The policy must be a live, reachable URL (not a placeholder).
- The policy must accurately describe what data HomeCook collects: email addresses, recipe/meal data associated with account, Google/Facebook auth tokens.
- A `legal/` directory exists in the repo — confirm a hosted privacy policy URL is established before submission.

**Detection:** Navigate to the Household screen in the app. Is there a visible privacy policy link?

**Phase:** Pre-submission metadata phase.

**Confidence:** HIGH — App Store Review Guideline 5.1.1, multiple rejection reports.

---

### Pitfall 10: App Screenshots Don't Match Actual UI

**What goes wrong:** App Store Connect requires screenshots for every supported device size. Google Play requires screenshots in specific aspect ratios. If screenshots show features that don't exist, incorrect layouts, or are missing required sizes, the submission is rejected or the listing is flagged.

**Why it happens:** Screenshots are treated as an afterthought and captured hastily from the wrong device sizes.

**Consequences:** App Store Connect upload errors for missing device sizes. Possible rejection if screenshots are misleading.

**Prevention:**
- Capture screenshots from: iPhone 6.7" (iPhone 15 Pro Max) — required for App Store, iPad Pro 12.9" (if supportsTablet: true), and a phone size for Google Play (16:9 or 9:16).
- Use the Expo web preview or iOS Simulator with screenshot tool.
- Ensure screenshots show dark mode (default theme) since that is HomeCook's primary experience.
- Do not show placeholder screens (empty Shopping tab, empty state) — show populated, functional screens.

**Detection:** Check App Store Connect submission form for missing screenshot sizes.

**Phase:** Pre-submission metadata phase.

**Confidence:** HIGH — App Store Connect submission requirements, standard knowledge.

---

## Minor Pitfalls

Fixable issues that cause review delays or minor UX friction.

---

### Pitfall 11: Permission Strings Are Too Vague

**What goes wrong:** `app.json` currently has `NSCameraUsageDescription: "HomeCook needs camera access to take photos of your recipes."` and `NSPhotoLibraryUsageDescription: "HomeCook needs photo library access to add images to your recipes."` These are acceptable but borderline. Apple reviewers flag vague strings like "to improve your experience." Descriptions should be specific and true.

**Prevention:** Ensure the strings accurately describe the actual use case. If camera/photo access is not yet implemented in v1, remove these permission strings to avoid triggering permission prompts the app never uses. Unused permissions listed are a rejection risk under Guideline 5.1 (data minimization).

**Detection:** Review `app.json` infoPlist entries. Search the codebase for actual `ImagePicker` or `Camera` usage to confirm whether these permissions are exercised.

**Phase:** Pre-submission config review.

**Confidence:** MEDIUM — App Store Review Guidelines section 5.1, community reports.

---

### Pitfall 12: .env File Could Be Committed and Expose Supabase Keys

**What goes wrong:** CONCERNS.md notes that `.env` is not gitignored (only `.env*.local` is excluded). A `git add -A` during CI setup or EAS Build configuration could commit the Supabase URL and anon key to the repository.

**Why it happens:** `.gitignore` was configured for Next.js defaults, which only exclude `.env.local`, not `.env`.

**Consequences:** Supabase service key exposure in public git history. Could allow unauthorized database access, spam account creation, or data extraction.

**Prevention:**
- Add `.env` to `.gitignore` immediately.
- Verify with `git check-ignore -v .env`.
- Rotate the Supabase anon key in the dashboard if there is any doubt the file was ever staged.
- Use EAS Secrets (`eas secret:create`) for production credentials instead of `.env` files in the build environment.

**Detection:** Run `git check-ignore .env` — if no output, it is not ignored.

**Phase:** Security hardening phase, immediately.

**Confidence:** HIGH — CONCERNS.md audit, gitignore documentation.

---

### Pitfall 13: Silent Crash During Reviewer's Test Path

**What goes wrong:** CONCERNS.md documents several silent catch blocks in `AddMealModal`, `recipes/edit.tsx`, and `lib/recipes.ts`. If any of these fail during the reviewer's walkthrough, the reviewer sees the app appear frozen or unresponsive with no error message — which reads as a crash or broken state and triggers rejection under Guideline 2.1.

**Prevention:**
- Replace all silent catch blocks with at minimum an `Alert.alert` displaying a user-friendly error message.
- Add an `ErrorBoundary` at the root level (the file `components/ErrorBoundary.tsx` already exists in the repo) — ensure it is actually mounted in `app/_layout.tsx`.
- Test the reviewer's most likely path: login → view recipes → add meal to calendar → generate shopping list. Simulate network failure mid-flow and confirm the app shows an error rather than silently failing.

**Detection:** Search codebase for `catch` blocks with empty bodies or only `console.log`.

**Phase:** Stability hardening phase, before submission.

**Confidence:** HIGH — CONCERNS.md audit, Apple Guideline 2.1.

---

### Pitfall 14: Empty App Updates URL in app.json

**What goes wrong:** `app.json` has `"updates": { "url": "" }` — an empty string. This will cause EAS Update to fail silently, and depending on the Expo SDK version, may generate a build warning or error. More importantly, if OTA updates are ever used post-launch, an incorrect URL means updates are never delivered.

**Prevention:**
- If OTA updates via EAS Update are not used for v1, remove the `updates` block entirely or set `"enabled": false`.
- If EAS Update will be used, set the URL to `https://u.expo.dev/[projectId]` where `[projectId]` is `af36abd1-c923-4dcd-ae38-9abb55da9644` (from `extra.eas.projectId`).

**Detection:** Check `app.json` `updates.url` field.

**Phase:** Build configuration phase.

**Confidence:** MEDIUM — Expo documentation on EAS Update, observation from app.json.

---

### Pitfall 15: No Accessibility Labels Blocks Accessibility Compliance

**What goes wrong:** CONCERNS.md notes only 25 total `accessibilityLabel` usages across the entire app. Apple reviewers occasionally test with VoiceOver enabled. More importantly, apps with egregious accessibility failures risk rejection under Guideline 5 (best interests of users) in rare cases, and will fail accessibility audits if the app is ever reviewed by accessibility advocates post-launch.

**Prevention:**
- At minimum, add `accessibilityLabel` to every `Pressable` and interactive element in the critical reviewer path: tab bar buttons, calendar date cells, recipe cards, "Add Meal" button.
- Calendar hexagon date selectors must have labels like `"March 15, selected"` / `"March 16"`.
- Recipe cards must have labels combining title + meal type.
- This does not need to be 100% complete for v1, but the reviewer's path should be fully labeled.

**Detection:** Enable VoiceOver on a simulator and navigate through the app. Elements read as "button" with no name indicate missing labels.

**Phase:** Accessibility pass, pre-submission.

**Confidence:** MEDIUM — CONCERNS.md audit, Apple Human Interface Guidelines accessibility requirements.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Auth implementation | Sign in with Apple missing | Add before any iOS submission |
| Auth implementation | Google/Facebook OAuth broken in reviewer sandbox | Provide email/password demo account |
| Security hardening | RLS not applied, cross-household data leak | Verify in Supabase dashboard before launch |
| Security hardening | `.env` committed with keys | Fix `.gitignore`, rotate keys |
| Build configuration | Android target SDK below 35 | Add `expo-build-properties` config |
| Build configuration | Privacy manifest missing | Add `PrivacyInfo.xcprivacy` via Expo config |
| Stability hardening | Silent catch blocks cause frozen UI | Surface errors with Alert before submission |
| QA / device testing | iPad layout broken | Test on iPad Pro 12.9" simulator |
| Pre-submission metadata | Privacy policy not in-app | Add link in Household screen |
| Pre-submission metadata | Demo credentials not provided | Add to App Store Connect review notes |
| Pre-submission metadata | Screenshots missing device sizes | Capture from correct simulators |
| Play Store launch | 14-day closed testing gate | Start recruiting 12 testers at milestone start |
| Post-launch | Account deletion not wired to UI | Verify `delete_user_account` RPC is reachable |

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|-----------|-------|
| Sign in with Apple requirement | HIGH | Apple Developer docs, confirmed guideline 4.8 |
| Account deletion requirement | HIGH | Apple Developer News, June 2022 enforcement |
| Privacy manifest requirement | HIGH | Expo tracking issue #27796, Apple docs, May 2024 enforcement |
| Android target API 35 | HIGH | Google Play Console docs, Expo SDK 52 confirmed |
| Google Play closed testing | HIGH | Play Console Help, confirmed December 2024 policy |
| iPad layout risks | HIGH | Expo known issues, Apple reviewer behavior reports |
| Demo account requirement | HIGH | Apple Guideline 2.1, widely reported rejection pattern |
| Privacy policy in-app | HIGH | Apple Guideline 5.1.1 |
| Silent crash risks | HIGH | CONCERNS.md first-party audit |
| RLS security gap | HIGH | CONCERNS.md first-party audit, Supabase docs |

---

## Sources

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple — Sign in with Apple requirement (Guideline 4.8)](https://appraysal.com/rules/4.8_sign_in_with_apple)
- [Apple — Account deletion requirement announcement](https://developer.apple.com/news/?id=12m75xbj)
- [Expo — Privacy manifests documentation](https://docs.expo.dev/guides/apple-privacy/)
- [Expo — App stores best practices](https://docs.expo.dev/distribution/app-stores/)
- [Expo — Privacy manifest tracking issue #27796](https://github.com/expo/expo/issues/27796)
- [Expo — supportsTablet prebuild bug #32344](https://github.com/expo/expo/issues/32344)
- [Google Play — Target API level requirements](https://support.google.com/googleplay/android-developer/answer/11926878)
- [Google Play — Closed testing requirements for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465)
- [Google Play — App rejection rate and reasons 2026](https://primetestlab.com/blog/google-play-app-rejection-rate-2026)
- [WorkOS — Sign in with Apple for App Store 2025](https://workos.com/blog/apple-app-store-authentication-sign-in-with-apple-2025)
- [RevenueCAT — Ultimate guide to App Store rejections](https://www.revenuecat.com/blog/growth/the-ultimate-guide-to-app-store-rejections/)
- [Adapting to Google Play API 35 — React Native](https://sujeetkumargpt06.medium.com/adapting-to-google-plays-latest-policy-api-35-react-native-android-15-4530d1dd4fb7)
