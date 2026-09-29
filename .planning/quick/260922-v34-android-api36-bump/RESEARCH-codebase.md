# Research: Android targetSdkVersion 35 → 36 (Android 16) impact audit

Repo: `/Users/rayray/Desktop/projects/homecook` — Expo SDK 52 (installed `expo@52.0.48`), React Native `0.76.9`, Expo Router `~4.0.14`, `newArchEnabled: false`. Research only — no files changed.

Current Android config (`app.json`):
- `expo.android.versionCode`: `19`
- `expo-build-properties` plugin: `compileSdkVersion: 35`, `targetSdkVersion: 35`
- No `edgeToEdgeEnabled` key anywhere in the repo (grepped `*.json/*.ts/*.tsx` — zero hits).
- `react-native-safe-area-context@4.12.0` is installed (pulled in transitively as an `expo-router` peer dependency) but **is not imported anywhere** in `app/` or `components/` — confirmed via repo-wide grep for `SafeAreaView|useSafeAreaInsets|SafeAreaProvider`: zero results.

Context: the app already targets API 35 today. Android 15 (API 35) made edge-to-edge the default for apps targeting SDK 35+, but still let RN/Expo apps opt out via a window attribute. **Android 16 (API 36) removes the opt-out** — edge-to-edge becomes non-negotiable once `targetSdkVersion` is 36. That is the single biggest reason this bump is riskier than the 34→35 one: any screen currently relying on the system to draw a status-bar-colored background or that isn't already insets-aware will be exposed for the first time.

---

## 1. Edge-to-edge / insets audit

No screen or component uses `SafeAreaView` or `useSafeAreaInsets`. Every top offset is a hardcoded NativeWind class. Table below: every route file and every component with layout implications.

| File | Top handling | Bottom handling |
|---|---|---|
| `app/(app)/index.tsx:106` | `<View className="px-5 pt-14 pb-2">` inside `<View className="screen">` (no top inset at all on the `screen` wrapper) | `contentContainerStyle={{ paddingBottom: 32 }}` (`app/(app)/index.tsx:102`) — arbitrary, not tab-bar-aware |
| `app/(app)/shopping.tsx:416` | `<View className="px-5 pt-14 pb-3 bg-surface-1">` | `contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}` (`app/(app)/shopping.tsx:562`) |
| `app/(app)/planner.tsx:108` | `<View className="px-5 pt-14 pb-4 bg-surface-1 flex-row items-center">` | `contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}` (`app/(app)/planner.tsx:157`) |
| `app/(app)/household.tsx:303` | `<View className="px-5 pt-14 pb-4 bg-surface-1 flex-row justify-between items-center">` | `contentContainerStyle={{ paddingBottom: 32 }}` (`app/(app)/household.tsx:317`) |
| `app/(app)/recipes/index.tsx:239` | `<View className="px-5 pt-14 pb-3 bg-surface-1 flex-row justify-between items-center">` | `paddingBottom: 32` (`app/(app)/recipes/index.tsx:362`) |
| `app/(app)/recipes/[id].tsx:234` | `<View className="px-5 pt-14 pb-3 bg-surface-1 flex-row items-center justify-between">` | `contentContainerStyle={{ paddingBottom: 32 }}` (`app/(app)/recipes/[id].tsx:288`) |
| `app/(app)/recipes/create.tsx:43` | `<View className="px-6 pt-14 pb-4 bg-surface-1 flex-row items-center gap-3">` | body delegated to `RecipeForm` (see below) |
| `app/(app)/recipes/edit.tsx:79` | `<View className="px-6 pt-14 pb-4 bg-surface-1 flex-row items-center gap-3">` | body delegated to `RecipeForm` |
| `app/(auth)/login.tsx:105` | `<View className="screen items-center justify-center px-6">` — vertically centered, no hardcoded top offset, so low risk | vertically centered |
| `app/(auth)/email-sign-in.tsx:66,73` | `className="screen"` wrapping `<View className="flex-1 px-6">` — no explicit top offset (content likely starts near the very top edge, so may draw under the status bar under forced edge-to-edge; needs a visual check) | `KeyboardAvoidingView` handles bottom (`app/(auth)/email-sign-in.tsx:65`) |
| `app/(auth)/email-sign-up.tsx:87` | `className="screen"`, `contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}` — same "no top offset" pattern as email-sign-in | same |
| `app/(auth)/email-confirmation.tsx:54` | `<View className="screen px-6">` → inner `<View className="flex-1 justify-center items-center">` — centered, low risk | centered |
| `components/RecipeForm.tsx:110-116` | No top offset of its own; it's mounted below the `pt-14` header in `create.tsx`/`edit.tsx`, so it inherits their spacing. `KeyboardAvoidingView` (`components/RecipeForm.tsx:111`) + `ScrollView` `paddingBottom: 48` (`components/RecipeForm.tsx:116`) | same |
| `components/CustomTabBar.tsx:47` | n/a (bottom bar) | `<View className="bg-surface-1 border-t border-surface-3 flex-row items-end pb-6 pt-2 px-4">` — **hardcoded `pb-6` (24px), not `useSafeAreaInsets().bottom`**. This is the bottom gesture-nav bar risk: on 3-button nav Android devices `pb-6` is arbitrary padding; on gesture-nav devices where the system gesture bar overlaps app content under edge-to-edge, 24px may not be enough and tab labels/icons can sit flush against or under the gesture pill. |
| `components/AddMealModal.tsx:290-296` | `<Modal visible presentationStyle="pageSheet" animationType="slide">` → inner header `<View className="px-5 pt-6 pb-4 ...">` (`components/AddMealModal.tsx:283` region) — only `pt-6`, not `pt-14`, because pageSheet modals get their own chrome **on iOS**. `presentationStyle` is **iOS-only**; RN's Modal on Android always renders edge-to-edge full screen regardless of `presentationStyle`. So on Android this modal's `pt-6` header has no status-bar allowance at all today, and will be more visibly wrong once edge-to-edge is unconditional. | List content `contentContainerStyle={{ paddingBottom: 32 }}` (`components/AddMealModal.tsx` ~line 283) |
| `app/(app)/household.tsx:655-663` (Join Household `<Modal>`) | Same pattern: `presentationStyle="pageSheet"`, header `<View className="px-5 pt-6 pb-4 ...">` (`app/(app)/household.tsx` ~663) — same Android status-bar risk as above | n/a |
| `components/OnboardingOverlay.tsx:90-91` | `position: 'absolute', bottom: 110` — hardcoded pixel offset assumed to sit just above `CustomTabBar`. Coupled to `CustomTabBar`'s own hardcoded `pb-6`; if the tab bar is fixed to use real insets later, this constant will drift out of sync. | same finding |
| `components/ErrorBoundary.tsx:41-49` | Inline `style={{ flex: 1, justifyContent: 'center', ... }}` — centered, no top offset, renders without theme/SafeArea context by design (documented in the file). Low risk. | centered |

**Pattern summary:** every primary tab screen uses the same recipe: `screen` (bg + flex-1, zero insets) wrapping a header `View` with `pt-14` (56px) standing in for status-bar-height + visual breathing room. `pt-14` is a guess tuned to typical Android/iOS status bars; it is not derived from any inset API. Under forced edge-to-edge on API 36, if the platform's status bar or newly-exposed system bars use more space than 56px (e.g., a device with a display cutout, or a gesture-nav bottom inset changing how the app's content area is measured), headers can draw partially under the status bar, or leave excess/inconsistent gaps if the inset is smaller.

## 2. Status bar

| File:line | Usage |
|---|---|
| All 11 screens listed in `__tests__/platform/statusbar-consistency.test.ts` (`app/(auth)/login.tsx:106`, `email-sign-in.tsx:68`, `email-sign-up.tsx:85`, `email-confirmation.tsx:52`, `app/(app)/index.tsx:98`, `planner.tsx:105`, `shopping.tsx:413`, `household.tsx:300`, `recipes/index.tsx:236`, `recipes/create.tsx:40`, `recipes/[id].tsx:231`) plus `recipes/edit.tsx:76` | `<StatusBar style={statusBarStyle} />` from `expo-status-bar`, where `statusBarStyle` comes from `hooks/useThemeColors.ts:37` (`(isDark ? 'light' : 'dark')`). No `translucent` or `backgroundColor` prop is passed anywhere — good, since `backgroundColor` is ignored under edge-to-edge and would be dead code anyway. |
| `components/WeekCalendarStrip.tsx:124`, `components/MonthCalendarGrid.tsx:145` | `backgroundColor={...}` props found by grep — these are **not** `StatusBar` props, they're `Circle`/shape `backgroundColor` fill props for the hexagon/date-selector SVG shapes. Unrelated to the status bar; false positive worth noting so it isn't mis-triaged during the actual bump PR. |

No `translucent` prop usage anywhere. Since `expo-status-bar`'s `<StatusBar>` component itself doesn't set `backgroundColor`/`translucent` here, there's nothing to strip for edge-to-edge compliance — this area is in reasonably good shape already, the residual risk is purely the missing inset padding covered in §1.

## 3. Back handling / predictive back

| File:line | Usage |
|---|---|
| *(none)* | No `BackHandler` import/usage anywhere in `app/` or `components/`. |
| `app/(app)/household.tsx:659` | `<Modal onRequestClose={() => setShowJoinModal(false)}>` — standard, closes modal on hardware back. Compatible with predictive back. |
| `components/AddMealModal.tsx:294` | `<Modal onRequestClose={handleClose}>` — same pattern, fine. |
| `app/(app)/planner.tsx:110`, `recipes/create.tsx:30,45`, `recipes/edit.tsx:43,65,81`, `recipes/[id].tsx:88`, `app/(auth)/email-sign-in.tsx:76`, `email-sign-up.tsx:93` | `router.back()` calls — all standard Expo Router navigation, no custom back interception, no `beforeRemove` listeners found. |

No custom back-press interception exists anywhere, so there's nothing that would actively conflict with Android's predictive-back gesture (no swallowed back events, no `BackHandler.addEventListener` returning `true` to block default behavior). The only latent risk is generic: Android 16 enables predictive back system-wide by default (it's been opt-in via manifest flag since API 33/34), so the two `Modal`s should be exercised with the back gesture specifically to confirm the slide-back preview animates correctly over `presentationStyle="pageSheet"` — this is a "verify visually" item, not a code defect.

## 4. Orientation / fixed-dimension assumptions

- `app.json:7` — `"orientation": "portrait"`. Android 16 (large-screen/foldable changes) is expected to stop honoring app-declared orientation/resizability restrictions on large screens in some configurations (behavior still evolving per Google's large-screen compatibility push); if it stops honoring `portrait`, the app could be shown in a landscape or resizable window on a tablet/foldable for the first time.
- **No `Dimensions.get(...)` calls anywhere** in `app/` or `components/` (grep returned zero results) — no module-scope-computed fixed widths that would go stale on rotation/resize.
- Only fixed pixel widths found are small, intentional UI element sizes, not layout-breaking assumptions:
  - `app/(auth)/login.tsx:123` — logo `{ width: 144, height: 144 }` (fixed logo size, fine even on tablet).
  - `components/RecipeImage.tsx:26,32` — `width: 160` / `width: 56` (thumbnail sizes).
  - `components/MonthCalendarGrid.tsx:158` — `w-[30px] h-[30px]` calendar cell.
  - `components/CustomTabBar.tsx:83` — `min-w-[64px]` tab touch target (a *minimum*, not a hard cap — fine).
  - `components/ErrorBoundary.tsx:52` — `width: 80` icon circle.
  - Text `max-w-[260px]`/`max-w-[280px]` (`app/(app)/shopping.tsx:528,546`, `household.tsx:686`) — text wrap caps, harmless on wider screens.
- `ios.supportsTablet: true` (`app.json:16`) exists for iOS but there is **no equivalent Android tablet/large-screen declaration** (no `android.resizeableActivity`, no multi-window/large-screen support declared) — if Android 16 forces resizability on large screens regardless of manifest flags, the app has never been visually verified in a non-phone-sized window. This is a real gap but orthogonal to the SDK bump itself; worth flagging as a pre-existing gap that the bump will surface.

**Conclusion:** no code assumes a fixed pixel width for full-screen layout (everything downstream of `screen`/`flex-1` uses Flexbox percentages), so an orientation/window-size change by itself is unlikely to break layout structurally — the actual visible risk on tablet/foldable is that no one has looked at these screens on a screen wider than a phone, combined with the `pt-14` hardcoded header offset which was tuned for a phone-shaped status bar.

## 5. expo-constants

- No direct import of `expo-constants` anywhere in `app/`, `components/`, `lib/`, `contexts/`, or `hooks/` (grep returned zero results).
- `node_modules/expo-constants` **is present** at the top level (confirmed via `ls`), even though nothing in this repo imports it directly.
- It's pulled in as a peer dependency of `expo-router` (`node_modules/expo-router/package.json` lists `"expo-constants": "~17.0.8"` under `peerDependencies`).
- Other installed packages that declare a dependency on `expo-constants` (via `grep -rl "expo-constants" node_modules/*/package.json`): `expo-asset`, `expo-auth-session`, `expo-constants` itself, `expo-router`, `expo-linking`, `expo`.
- Practical implication: `expo-constants` is exercised indirectly (e.g., by `expo-auth-session`'s `makeRedirectUri()` in `lib/auth.ts`, and by Expo Router's internals) but this app has no code that reads `Constants.platform` or similar Android-specific fields directly, so there's no first-party code path to audit here for API-36-specific breakage. Any risk is contained inside `expo-router`/`expo-auth-session` internals, which are Expo-maintained and expected to already handle SDK-version differences.

## 6. `Platform.OS === 'android'` branches

Full inventory (repo-wide grep of `app/`, `components/`, `lib/`, `contexts/`, `hooks/`):

| File:line | Branch | What it does |
|---|---|---|
| `app/(auth)/email-sign-in.tsx:65` | `Platform.OS === 'ios' ? 'padding' : 'height'` | `KeyboardAvoidingView` behavior — Android gets `'height'`. |
| `app/(auth)/email-sign-up.tsx:82` | same pattern | same |
| `components/RecipeForm.tsx:111` | same pattern | same |
| `components/OnboardingOverlay.tsx:73` | `Platform.OS === 'web' ? ... : ...` | Chooses blur style; not an iOS/Android branch, Android and iOS get the same (native) branch. |
| `lib/auth.ts:130` | `return Platform.OS === 'ios';` | Backing implementation of `isAppleSignInAvailable()` — gates the Apple Sign In button to iOS only, per `__tests__/platform/apple-sign-in.test.ts`. |

None of these branches touch layout/inset/status-bar concerns, so they are not expected to interact with the edge-to-edge change. They're listed here purely as the complete `Platform.OS` inventory per the audit brief; no action needed on any of them for the API 36 bump itself.

## 7. Existing tests asserting on `app.json` Android fields

| Test file | What it checks (relevant to this bump) |
|---|---|
| `__tests__/config/app-config.test.ts` | Line 75-78: `expo.android.versionCode` must be `>= 2`, a `number`. Line 84-91: adaptive icon foreground image must exist on disk. Line 93-95: adaptive icon `backgroundColor` must be a hex color. **Does not assert on `targetSdkVersion`/`compileSdkVersion` at all** — only `cross-platform-config.test.ts` does that. |
| `__tests__/platform/cross-platform-config.test.ts` | Lines 167-174, inside `describe('Android-specific configuration ...')`, `it('targets Android API 35 (Play Store requirement as of Aug 2024)', ...)`: asserts `buildProps[1].android.compileSdkVersion >= 35` and `buildProps[1].android.targetSdkVersion >= 35` via `toBeGreaterThanOrEqual(35)`. **This test will still pass unmodified after bumping to 36** (`>=35` is satisfied by `36`), but its name/comment ("targets Android API 35") will become stale and should be updated for clarity when the plan lands, even though it won't fail CI. Also contains the `versionCode`/`buildNumber` positivity/parity checks (lines 60-63) that must be re-satisfied whenever `versionCode` is bumped as part of this release. |

No other test file references `targetSdkVersion`, `compileSdkVersion`, or Android `versionCode` (confirmed via repo-wide grep of `__tests__/`).

---

## Top risks for API 36, ranked by likelihood × visibility

1. **`CustomTabBar` bottom padding (`components/CustomTabBar.tsx:47`, hardcoded `pb-6`) drawing under/against the gesture-nav bar.** This is the single most likely visible regression — it's the persistent bottom nav on every authenticated screen, gets tapped constantly, and has zero inset awareness today. High likelihood (edge-to-edge is now unconditional) × high visibility (every screen, every session).

2. **All primary screen headers using hardcoded `pt-14` instead of a safe-area inset** (`app/(app)/index.tsx:106`, `shopping.tsx:416`, `planner.tsx:108`, `household.tsx:303`, `recipes/index.tsx:239`, `recipes/[id].tsx:234`, `recipes/create.tsx:43`, `recipes/edit.tsx:79`). High likelihood of at least cosmetic misalignment on some device/status-bar combos, high visibility since it's the top of every core screen.

3. **`AddMealModal` and the Household "Join" `Modal`'s `pt-6` header on Android** (`components/AddMealModal.tsx:283`, `app/(app)/household.tsx:663`) — `presentationStyle="pageSheet"` is iOS-only, so on Android these modals already render full-bleed; `pt-6` was never validated against the Android status bar and edge-to-edge enforcement makes any gap more visible. Medium-high likelihood, medium visibility (only shown when adding a meal or joining a household, but a core flow per the CLAUDE.md "core value" of meal planning).

4. **No `SafeAreaProvider`/`useSafeAreaInsets` anywhere despite `react-native-safe-area-context` already being installed.** This is the root cause of #1 and #2 — flagged separately because it means there's no quick device-specific fallback; every screen would need either a provider + hook wiring or continued hardcoded tuning. Structural risk rather than a single visible bug.

5. **No Android large-screen/tablet declaration paired with `orientation: portrait`** (`app.json:7`, no Android-side resizability config vs. `ios.supportsTablet: true` at `app.json:16`). Lower likelihood for a typical phone-only user base, but if Android 16's large-screen changes cause the app's portrait lock to be overridden on a tablet/foldable/Chromebook, nothing in the codebase has ever been checked at that width. Lower likelihood, but high visibility (a fully broken/cramped layout) if it does occur.

---

## Manual test checklist (device, after bumping to targetSdkVersion 36)

Run on at least one gesture-navigation Android device/emulator and one 3-button-navigation device/emulator, in both dark and light theme:

- [ ] Cold-start the app, confirm splash → login screen renders with no content clipped under the status bar (`app/(auth)/login.tsx`).
- [ ] Sign in, land on Home tab (`app/(app)/index.tsx`) — confirm the "Welcome back, Chef" header (`pt-14` block) isn't overlapped by the status bar/clock.
- [ ] Tap through all 4 bottom tabs (Home, Cookbook, Shopping, Household) — on each, check the `CustomTabBar` bottom edge: confirm tab labels/icons are fully visible above the gesture pill / nav bar, not clipped or crowded (`components/CustomTabBar.tsx`).
- [ ] Open the Planner (`app/(app)/planner.tsx`) via a date — check header offset and `router.back()` (top-left back button) plus the Android hardware/gesture back action.
- [ ] Tap "Add Meal" to open `AddMealModal` (`components/AddMealModal.tsx`) — since `presentationStyle="pageSheet"` is iOS-only, explicitly check the Android rendering is full-screen with the header not under the status bar; test swipe-back / hardware back closes it via `onRequestClose`.
- [ ] On Household tab, open "Join a Household" modal (`app/(app)/household.tsx:655`) — same modal-header check as above.
- [ ] Open Recipes list → a recipe detail → Edit — check `pt-14`/`pt-6` headers on `recipes/index.tsx`, `recipes/[id].tsx`, `recipes/edit.tsx`, and that the `RecipeForm`'s `KeyboardAvoidingView` still leaves the Save button reachable above the keyboard.
- [ ] Trigger the Onboarding overlay (fresh install / cleared `@homecook_onboarding_seen` AsyncStorage key) and confirm the `bottom: 110` callout (`components/OnboardingOverlay.tsx:90`) still points at the tab bar correctly, not floating above/below it.
- [ ] Exercise Android predictive back (swipe from edge) on: a modal (`AddMealModal`, Join Household modal), a pushed Recipe detail/edit screen, and the Planner screen — confirm the system preview animation looks correct and doesn't reveal any status-bar / nav-bar gap that wasn't visible before.
- [ ] If a tablet emulator or large-screen/foldable device is available, launch the app there once and screenshot Home + a modal — purely to confirm nothing catastrophically breaks now that `orientation: portrait` may not be enforced.
- [ ] Run `npm test` and confirm `__tests__/platform/cross-platform-config.test.ts`'s "targets Android API 35" test still passes (it will, since the assertion is `>= 35`), and update its title/comment as part of the actual bump PR so it doesn't read as stale.
