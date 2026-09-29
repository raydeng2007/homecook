# Quick Task 260922-v34 — iOS / Expo SDK Lifecycle Research

**Researched:** 2026-09-23
**Scope:** iOS App Store compliance on Expo SDK 52 + SDK lifecycle (Android API 36 is covered separately)
**Confidence:** HIGH on requirements and past build evidence; MEDIUM on whether today's `latest` EAS image breaks SDK 52

## TL;DR

The iOS side is **compliant today**. v1.3.9 (build 19) was built on EAS with **Xcode 26.2** on 2026-05-29 and was **uploaded to App Store Connect without errors**, which is after Apple's Xcode 26 cutoff of 2026-04-28.

**Risk:** `eas.json` production iOS uses `"image": "latest"`, which now points to **Xcode 26.6** instead of 26.2. Xcode 26.4 and later are known to break the `fmt` 11.0.2 library that RN 0.76.9 bundles, so the next iOS build on `latest` is likely to fail at compile time. Pin the image to `macos-sequoia-15.6-xcode-26.2`, the image that has already worked.

---

## 1. Apple App Store Connect requirements (as of Sept 2026)

| Requirement | Since | Homecook status | Source |
|---|---|---|---|
| Must be built with **Xcode 26+ / iOS 26 SDK** | 2026-04-28 | ✅ Builds 15/17/19 used `macos-sequoia-15.6-xcode-26.2` | VERIFIED: https://developer.apple.com/news/upcoming-requirements/ + EAS GraphQL `resolvedImage` |
| iOS/iPadOS apps must **target iOS 13+** | 2026-09-09 | ✅ SDK 52 deployment target is 15.1 (local `ios/Podfile` default `'15.1'`) | VERIFIED: same Apple page + local Podfile |
| Answer the **new age-rating questionnaire** in ASC | 2026-01-31 | ⚠️ Can't check from the repo. The user must confirm it's done in App Store Connect → App Information → Age Rating | VERIFIED (requirement): same Apple page |
| **Required-reason API** declarations (privacy manifest) | 2024-05-01 | ✅ `ios.privacyManifests` declares UserDefaults (CA92.1), FileTimestamp (C617.1), DiskSpace (E174.1), SystemBootTime (35F9.1), the standard RN/Expo set. Pod manifest aggregation is enabled | VERIFIED: Apple page + app.json |
| EU DSA trader status | 2024-10 / 2025-02 | ⚠️ Only applies if distributing in the EU. This is an ASC account setting | VERIFIED: Apple page |

Apple's page lists no other active or upcoming upload requirements (checked 2026-09-23).

## 2. Can SDK 52 / RN 0.76.9 build with Xcode 26? What does EAS use?

- **Default EAS image for SDK 52:** `macos-sequoia-15.3-xcode-16.2`, which uses **Xcode 16.2**. Apple no longer accepts uploads built with it. VERIFIED: https://docs.expo.dev/build-reference/infrastructure/
- **`latest` alias:** "assigned to the image with the most up-to-date versions of the software." Today that is `macos-tahoe-26.5-xcode-26.6` (**Xcode 26.6**). VERIFIED: same doc; https://expo.dev/changelog/sdk-58-beta says "the `latest` EAS Build image ships Xcode 26.6."
- **Direct evidence from this project (EAS GraphQL API, 2026-09-23):**

  | Build | Date | resolvedImage | RN | ASC submission |
  |---|---|---|---|---|
  | 19 (v1.3.9) | 2026-05-29 | `macos-sequoia-15.6-xcode-26.2` | 0.76.9 | FINISHED, no error |
  | 17 (v1.3.7) | 2026-05-19 | `macos-sequoia-15.6-xcode-26.2` | 0.76.9 | FINISHED, no error |
  | 15 (v1.3.5) | 2026-05-18 | `macos-sequoia-15.6-xcode-26.2` | 0.76.9 | FINISHED, no error |

  VERIFIED. **SDK 52 + Xcode 26.2 builds and uploads successfully.**
- **Known break on Xcode 26.4+:** Apple Clang in 26.4 enforces `consteval` more strictly, so `fmt` 11.0.2 (vendored by RN for RCT-Folly) fails with `consteval ... basic_format_string` errors. The fix only arrives in RN ≥ 0.83.9 / Expo SDK 56 (fmt 12.1.0). CITED: https://github.com/facebook/react-native/issues/55601, https://github.com/expo/expo/issues/44229, https://bleepingswift.com/blog/fmt-consteval-error-xcode-26-4-react-native
  - VERIFIED locally: `node_modules/react-native/third-party-podspecs/fmt.podspec` is `11.0.2` on RN 0.76.9, and RN 0.76 always compiles RN core from source on iOS.
  - UNVERIFIED that SDK 52 specifically fails on 26.4+. The only source naming SDK 52–55 as affected is a third-party plugin README (https://github.com/joaoalvess/expo-fmt-consteval-fix). It is the same fmt version, so the failure is highly likely. Local Xcode is 26.1.1, so it can't be reproduced here.
- **Is it a blocker?** **No, as long as the image is pinned.** `macos-sequoia-15.6-xcode-26.2` is still listed as an available image (it is SDK 55's default), and it satisfies Apple's Xcode 26 rule. If Expo ever retires that image, Xcode 26.4+ would require the fmt workaround (compile the `fmt` pod as C++17 or set `FMT_USE_CONSTEVAL 0` through a config plugin). That is a fallback, not needed now.
- **EAS still builds SDK 52:** yes. It was proven in May 2026, and the sdk-52 image is still listed. Expo says EAS keeps supporting older SDKs "much longer, but not forever." CITED: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/ (support-policy wording via search result, MEDIUM)

## 3. Expo SDK lifecycle

- **Current stable SDK:** **57**. The latest EAS image maps to SDK 57, and **SDK 58 beta** was released 2026-09-15 on RN 0.88 RC. VERIFIED: infrastructure doc + https://expo.dev/changelog/sdk-58-beta
- **SDK 52 status:** five major versions behind (52 → 57). Expo Go only supports the latest SDK, so it can't run SDK 52 at all. This doesn't matter here, because the project uses web preview and EAS builds. EAS Build still supports SDK 52 in practice. MEDIUM.
- **Upgrade cost signal:** SDK 54 is the last SDK that supports the Legacy Architecture. SDK 55+ is New-Architecture-only, and this app has `newArchEnabled: false`. Any upgrade to a current SDK therefore includes a New Architecture migration: 52 → 54 on New Arch first, then onward. CITED: https://expo.dev/changelog/sdk-55, https://docs.expo.dev/guides/new-architecture/ (MEDIUM, confirmed by several sources)

## 4. `expo-constants` + expo 52.0.48 → 52.0.49

- **expo 52.0.49** (published 2026-01-31): the expo package changelog says "does not introduce any user-facing changes." It only bumps two dependencies:
  - `@expo/cli` 0.22.27 → 0.22.28: restricts dev-server debugger/devtools sockets to local connections (a security fix for the dev server only), plus bumps to node-forge and code-signing-certificates.
  - `babel-preset-expo` 12.0.11 → 12.0.12: app-root resolution for bun monorepos.

  **No native code changes, so no iOS runtime risk.** VERIFIED: npm dependency diff + CHANGELOGs at expo commit `e8d7452` (github.com/expo/expo).
- **expo-constants:** `expo-constants@17.0.8` is already installed transitively (through expo, expo-router, expo-asset, expo-linking and expo-auth-session). `npx expo install expo-constants` just adds `~17.0.8` as a direct dependency, which is the same version already in the binary. **Safe, no native change.** VERIFIED: `npm ls expo-constants`
- A tracked `package-lock.json` exists. Note that the CLAUDE.md line "Lockfile: Not present" is stale. Run both changes with `npx expo install` so the lockfile updates.

## 5. app.json review for App Review

- **Unused purpose strings:** `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` are declared, but no camera, image-picker or media-library module is in `package.json` or `node_modules`, and grepping app/components/lib/contexts/hooks finds no usage. Apple's upload validator only flags *missing* strings for APIs the app uses (ITMS-90683), and builds 15–19 uploaded cleanly with these strings. Unused strings are therefore low risk. UNVERIFIED whether a reviewer would query them. `__tests__/platform/cross-platform-config.test.ts` (lines 77–84) **requires** these keys, so removing them means updating that test. **Recommendation: leave them as they are for now**, since they aren't a blocker and removing them is a separate decision for the user.
- Also fine: `usesAppleSignIn: true` with the `expo-apple-authentication` plugin; `ITSAppUsesNonExemptEncryption=false`; `supportsTablet: true`. Because of that last setting, iPad screenshots are required in ASC.
- **Local `ios/` folder:** it is stale (`newArchEnabled: "true"`, MARKETING_VERSION 1.0) but **gitignored** (`.gitignore:58 /ios`), so EAS runs prebuild from app.json and never uses it. It only affects local `expo run:ios`. If anyone builds locally, delete it or run `npx expo prebuild --clean`.
- iOS 26 note (UNVERIFIED for RN 0.76): apps built with the Xcode 26 SDK pick up Liquid Glass styling on native UIKit controls. Homecook's UI is almost entirely custom RN views, so the visual impact should be small. Builds 15–19 are already on the iOS 26 SDK.

---

## RECOMMENDATION

1. **Compliant today on SDK 52: yes.** The Xcode 26 SDK requirement is met (26.2), the iOS 13+ target is met (15.1), and the privacy manifest is present. v1.3.9 uploaded to ASC after the April cutoff.
2. **Must change (one line, before the next iOS build):** in `eas.json`, change `build.production.ios.image` from `"latest"` to `"macos-sequoia-15.6-xcode-26.2"`. `latest` has moved to Xcode 26.6, where RN 0.76.9's fmt 11.0.2 is expected to fail to compile. This pins the exact toolchain that has already worked. It is a config-only change with no user-visible diff, so it needs no version bump by itself. Leave Android's `image` to the concurrent Android task.
3. **Safe to apply:** `npx expo install expo-constants` and `npx expo install expo@~52.0.49`. There are no native changes; the patch only fixes dev-server security and babel behaviour.
4. **Manual checks for the user in App Store Connect:** the age-rating questionnaire is answered (required since Jan 31, 2026), EU trader status if distributing in the EU, and iPad screenshots because `supportsTablet: true`.
5. **Is an Expo SDK upgrade urgent? Not urgent this week, but it should be scheduled soon.** SDK 52 is five versions behind and only builds on Apple-acceptable toolchains because of the pinned Xcode 26.2 image. If Expo retires that image, or Apple later requires a newer Xcode or SDK (e.g. Xcode 27 around April 2027, [ASSUMED] from Apple's yearly pattern), SDK 52 will need the fmt workaround or will stop working. The upgrade also requires moving to the New Architecture (SDK 55+ is New-Arch-only). Plan it as its own phase: 52 → 54 with New Arch on → 56/57.

## Sources
- https://developer.apple.com/news/upcoming-requirements/ (fetched 2026-09-23)
- https://docs.expo.dev/build-reference/infrastructure/ (image list, `latest` alias, SDK 52 image)
- https://expo.dev/blog/app-store-connect-minimum-sdk-26 (2026-04-27; "We recommend upgrading to at least SDK 54")
- https://expo.dev/changelog/sdk-58-beta (2026-09-15; `latest` = Xcode 26.6)
- https://expo.dev/changelog/sdk-55, https://docs.expo.dev/guides/new-architecture/ (Legacy Arch removed in SDK 55)
- https://github.com/facebook/react-native/issues/55601, https://github.com/expo/expo/issues/44229, https://github.com/joaoalvess/expo-fmt-consteval-fix, https://bleepingswift.com/blog/fmt-consteval-error-xcode-26-4-react-native (Xcode 26.4 fmt break)
- expo/expo CHANGELOGs at commit e8d745201d9f (expo 52.0.49, @expo/cli 0.22.28, babel-preset-expo 12.0.12)
- EAS GraphQL `builds.byId { resolvedImage submissions }` for builds 15/17/19 (project af36abd1)
