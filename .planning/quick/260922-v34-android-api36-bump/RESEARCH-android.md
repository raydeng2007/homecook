# Quick Task 260922-v34: Android API 36 bump on Expo SDK 52 - Android Research

**Researched:** 2026-09-22
**Domain:** Google Play target-API policy, AGP/compileSdk compatibility, Android 16 behavior changes, Expo SDK 52 on EAS
**Confidence:** MEDIUM overall. Policy and behavior changes are HIGH. "AGP 8.6 builds compileSdk 36" is MEDIUM: I found no official statement, and it has to be confirmed by a real EAS build.

## Key Context Found in the Repo (VERIFIED by local inspection)

- Installed versions: `expo@52.0.48`, `react-native@0.76.9`, `expo-build-properties@0.13.3`, `@expo/config-plugins@9.0.17`.
- RN 0.76.9 pins **AGP 8.6.0** and Kotlin 1.9.25 (`node_modules/@react-native/gradle-plugin/gradle/libs.versions.toml`). I ran a scratch `expo prebuild` (in the session scratchpad, not the repo). It generates **Gradle 8.10.2**, `buildToolsVersion 35.0.0`, `ndkVersion 26.1.10909125`, and `classpath('com.android.tools.build:gradle')` with no version, so the AGP version comes from the RN gradle plugin.
- The generated `styles.xml` does not contain `windowOptOutEdgeToEdgeEnforcement`. The app already targets 35, so **it is already edge-to-edge on Android 15+ devices**.
- The generated manifest has `android:screenOrientation="portrait"` and `configChanges="...orientation|screenSize..."` on MainActivity.
- `ReactActivity` in RN 0.76.9 handles back through an **`onBackPressed()` override** (ReactActivity.java:98). It does not register an `OnBackPressedCallback`.
- `@expo/config-plugins@9.0.17` has **no** `predictiveBackGestureEnabled` support. A grep for it and for `enableOnBackInvokedCallback` returned nothing.
- `expo-build-properties@0.13.3` options include compileSdk/targetSdk/minSdk/buildTools/kotlin, but **no option to set the AGP or Gradle version**, and no way to add arbitrary `gradle.properties` entries.
- Native module androidx pins are fixed and old, for example `androidx.browser:browser:1.6.0`. No dependency pulls in `androidx.browser 1.9.x`, the version known to hard-require AGP 8.9.1.
- The last app.json/eas.json commit was 2026-05-28. The EAS `latest` image has changed since then (see Q3).

---

## Q1. Play target API policy

- **Starting Aug 31, 2026, new apps and app updates must target API 36.** Wear OS and Automotive apps need 35; TV and XR apps need 34. VERIFIED: https://support.google.com/googleplay/android-developer/answer/11926878
- **An extension to Nov 1, 2026 is available.** Play only offers the form to non-compliant apps, through the warning's details page under **Policy status** in Play Console. VERIFIED (same URL).
- **Today is Sept 22, 2026, so the deadline has already passed.** Without a granted extension, any update targeting 35 will be rejected now. If you haven't requested the extension yet, do it immediately. That gives a hard wall of Nov 1.
- **Existing apps** must target at least 35 to stay visible to new users on newer Android versions. The app already targets 35, so the live listing is safe. VERIFIED (same URL).
- **Testing tracks: UNVERIFIED.** The help page doesn't say whether closed or internal testing tracks, or the production-access application, are exempt. Assume the rule applies to every track you publish to, including closed testing. Plan for the next closed-testing upload to need API 36.

## Q2. Can SDK 52 / RN 0.76.9 build with compileSdk 36 and targetSdk 36?

- **Official AGP minimum for API 36 is AGP 8.9.1.** API 35 needs 8.6.0 and API 36.1 needs 8.13.0. VERIFIED: https://developer.android.com/build/releases/about-agp
- **RN 0.76.9 ships AGP 8.6.0 and Gradle 8.10.2** (VERIFIED locally), so compileSdk 36 is officially unsupported on this toolchain.
- **Expected behavior is a warning, not an error: MEDIUM confidence.** An AGP older than the compileSdk prints "We recommend using a newer Android Gradle plugin to use compileSdk = 36 ... add android.suppressUnsupportedCompileSdk=36". One documented project on **AGP 8.7.0 + compileSdk/targetSdk 36** built its APK and AAB successfully and called the warning "cosmetic". Source: https://github.com/subsurface/subsurface/pull/4964. I found no direct report for exactly AGP 8.6.0 + 36, so this needs a real EAS build to confirm.
- **Residual failure mode to watch: AAPT2 cannot parse the new platform's `android.jar`.** This happened with SDK 35 on old AGPs ("RES_TABLE_TYPE_TYPE entry offsets overlap"). If it appears, the known escape hatch is the `android.aapt2Version` gradle property. That is **UNVERIFIED** for API 36 and would need a custom config plugin.
- **A dependency that declares minimum AGP 8.9.1 is a hard error.** For example, `androidx.browser 1.9.0`: "requires Android Gradle plugin 8.9.1 or higher. This build currently uses 8.6.0". Source: https://github.com/alchemyplatform/aa-sdk/issues/1534. The current dependency tree pins browser 1.6.0, so this shouldn't happen (VERIFIED locally).
- **`suppressUnsupportedCompileSdk` is optional and only silences the log line.** expo-build-properties 0.13 can't set it; it would need a `withGradleProperties` plugin. Recommendation: don't add it.
- **targetSdk 36 with compileSdk 35:** Play only checks `targetSdkVersion`, so Play would likely accept it (ASSUMED). The platform convention is compileSdk ≥ targetSdk. Use this only as a fallback if compileSdk 36 fails to build.
- **Overriding AGP or Gradle** would need a custom config plugin that rewrites `android/build.gradle` and `gradle-wrapper.properties`. AGP 8.9 also needs Gradle ≥ 8.11.1 (ASSUMED). The RN 0.76 gradle plugin was compiled against AGP 8.6 and Kotlin 1.9, and SDK 52 is known to break when the Kotlin version is overridden (https://github.com/hyochan/expo-iap/issues/278). **Do not attempt this.** If AGP 8.6 fails, upgrade the Expo SDK instead.

## Q3. EAS build image

- `eas.json` production uses `"image": "latest"`. Today that resolves to **`ubuntu-26.04-jdk-17-ndk-r27b-sdk-57`** (Node 22.23.1, JDK 17, NDK 27.1). The image intended for SDK 52 is the **legacy `sdk-52`** image (Ubuntu 22.04, Node 20.18.3, NDK 26.1.10909125). VERIFIED: https://docs.expo.dev/build-reference/infrastructure/
- **The docs don't list which Android SDK platforms or build-tools are preinstalled (UNVERIFIED).** AGP downloads missing platforms, build-tools and the pinned NDK automatically when SDK licenses are accepted (ASSUMED). This probably already happens today, because `latest` doesn't contain NDK 26.1 and earlier builds apparently succeeded.
- **I found no specific EAS issues for SDK 52 + API 36.**
- **The `latest` image has changed since the last build.** The last build was around May 2026 and the sdk-57 image dates from June 2026. If the build fails for environment reasons rather than SDK-36 reasons, pin `"image": "sdk-52"` in the Android production profile.

## Q4. Native library breakages at compileSdk/targetSdk 36

- **I found no API-36-specific issues** for react-native-screens 4.4, reanimated 3.16, gesture-handler 2.20, safe-area-context 4.12, svg 15.8, async-storage 1.23, or the expo-* modules (search coverage: LOW-MEDIUM).
- All of these libraries read `compileSdkVersion` and `targetSdkVersion` from the root project (VERIFIED in their `build.gradle` files). None of them use API 36 APIs.
- **The known compileSdk ≥ 35 issue already applies today.** Kotlin's `reversed()` binding to `List.reversed()` crashes on devices older than Android 15. It was reported against screens and gesture-handler (LOW confidence). Moving to 36 doesn't introduce it, but regression-test on an older Android device anyway.
- **The real library-level breakage is predictive back**, covered in Q5.

## Q5. Android 16 behavior changes for apps targeting 36

All quotes below are VERIFIED from https://developer.android.com/about/versions/16/behavior-changes-16.

| Change | Impact on Homecook | Mitigation |
|---|---|---|
| **Predictive back on by default.** "`onBackPressed` is not called and `KeyEvent.KEYCODE_BACK` is not dispatched anymore." | **HIGH.** RN 0.76 routes back only through `ReactActivity.onBackPressed()` (VERIFIED locally). On Android 16 devices the system back gesture/button would **exit the app instead of popping the expo-router stack**. Community reports confirm this: https://github.com/react-native-community/discussions-and-proposals/discussions/921 and https://dev.to/dainyjose/android-system-back-button-closes-the-app-after-upgrading-to-target-sdk-36-react-native-fix-475g | Set `android:enableOnBackInvokedCallback="false"` on `<application>`. This is the official temporary opt-out. Expo SDK 54 does the same by default (`predictiveBackGestureEnabled` defaults to false: https://expo.dev/changelog/sdk-54). SDK 52 needs a small config plugin (below). |
| **Edge-to-edge opt-out removed.** "`windowOptOutEdgeToEdgeEnforcement` is deprecated and disabled." | **LOW.** The app never opted out and already targets 35, so Android 15+ devices already render edge-to-edge. | None required. Spot-check the status bar, tab bar and keyboard on an Android 16 device. |
| **Orientation, resizability and aspect-ratio restrictions ignored on screens with smallest width ≥ 600dp** (tablets, foldable inner screens). `screenOrientation="portrait"` is ignored there. | **MEDIUM.** On Android 16 tablets and foldables the app will rotate to landscape and fill the window. `configChanges` includes orientation and screenSize, so it won't crash, but the calendar grid, tab bar and forms have never been laid out in landscape. | Temporary opt-out: `<property android:name="android.window.PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY" android:value="true"/>` on `<application>`. The docs warn that this "won't apply when targeting API level 37". |
| **16 KB page size** is a separate Play requirement. Apps targeting 35+ need 16 KB-aligned `.so` files on 64-bit devices, and **from Feb 1, 2027, non-compliant updates can't be released**. VERIFIED: https://developer.android.com/guide/practices/page-sizes (page updated 2026-09-16) | **HIGH strategically.** RN supports 16 KB pages only from 0.77, which means Expo SDK 53 with `expo@53.0.14`+. VERIFIED: https://github.com/expo/fyi/blob/main/android-16kb-page-sizes.md. **SDK 52 / RN 0.76 is not compliant**, and targeting 36 doesn't change that. | You can't fix this on SDK 52. It requires upgrading to SDK 53.0.14 or later, and SDK 54 is recommended (see Q6). |
| Other changes: `elegantTextHeight` ignored, `scheduleAtFixedRate` catch-up, health permissions, Bluetooth, local-network permission, MediaStore version | None apply. The app has no health, Bluetooth or LAN features and only the INTERNET permission. | None. |

## Q6. Expo's recommended path and SDK 52 support status

- **The current SDK is 57** (RN 0.86). The versions page lists only **SDKs 54–57**, and all four have compileSdk and targetSdk 36. **SDK 52 is no longer listed, so it is out of support.** VERIFIED: https://docs.expo.dev/versions/latest/
- **Expo's own answer to Android 16 is SDK 54 or later**, which uses RN 0.81 and targets API 36. The SDK 54 changelog says edge-to-edge is always on and predictive back is opt-in. It also says **"SDK 54 is the final release to include Legacy Architecture support"**. VERIFIED: https://expo.dev/changelog/sdk-54
- The app runs `newArchEnabled: false`, so **SDK 54 is the furthest it can upgrade without also migrating to the New Architecture**.
- **I found no official Expo guidance for keeping SDK 52 on API 36.** The only related GitHub discussion, about SDK 53, points to upgrading to SDK 54, and no Expo team member replied. Source: https://github.com/expo/expo/discussions/38922

---

## RECOMMENDATION

### (a) Is "stay on SDK 52 + bump to 36" viable?

**Yes, as a short-term measure to meet the Aug 31 / Nov 1 target-API deadline. It is not a durable position,** because the 16 KB page-size rule will block SDK 52 updates from Feb 1, 2027.

Exact changes:

1. In `app.json`, update the expo-build-properties block:
   ```json
   ["expo-build-properties", { "android": { "compileSdkVersion": 36, "targetSdkVersion": 36 } }]
   ```
   Leave `buildToolsVersion` (35.0.0) and `kotlinVersion` at their defaults. Don't override AGP or Gradle.
2. Add the local config plugin `plugins/withAndroid16Compat.js` and append `"./plugins/withAndroid16Compat"` to `plugins`. I tested this via scratch prebuild: it produced `android:enableOnBackInvokedCallback="false"` and the `<property>` element in the generated manifest, and the generated `gradle.properties` contained `android.compileSdkVersion=36` and `android.targetSdkVersion=36`.
   ```js
   const { withAndroidManifest } = require('expo/config-plugins');
   const RESIZE_PROP = 'android.window.PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY';
   module.exports = function withAndroid16Compat(config) {
     return withAndroidManifest(config, (cfg) => {
       const app = cfg.modResults.manifest.application[0];
       app.$['android:enableOnBackInvokedCallback'] = 'false'; // keep RN onBackPressed() working on Android 16
       app.property = app.property ?? [];
       if (!app.property.some((p) => p.$['android:name'] === RESIZE_PROP)) {
         app.property.push({ $: { 'android:name': RESIZE_PROP, 'android:value': 'true' } }); // keep portrait lock on >=600dp
       }
       return cfg;
     });
   };
   ```
3. Bump `version`, `android.versionCode` and `ios.buildNumber` as CLAUDE.md requires. There is a user-visible native change.
4. Run an EAS `preview` (APK) build first and confirm it succeeds. Expect only the "tested up to compileSdk = 35" warning.
5. Install on an **Android 16** device or emulator (API 36 image). Check that system back pops the recipe stack instead of exiting, the app stays portrait on a tablet or large-screen emulator, the status and nav bars look right, and cold start works.
6. Then run the production AAB build and upload to closed testing.

Web preview can't verify any of this. It is all native-only, per CLAUDE.md Rule 2 and Rule 8.

### (b) Risks, ranked

1. **Predictive back exits the app on Android 16:** HIGH likelihood without the plugin, HIGH impact. Fully mitigated by `enableOnBackInvokedCallback="false"`. Must be verified on an API 36 device.
2. **16 KB page-size wall on Feb 1, 2027:** certain for SDK 52. Needs an SDK upgrade before then.
3. **AGP 8.6 + compileSdk 36 fails to build** (AAPT2 parse error or a dependency demanding AGP 8.9.1): LOW-MEDIUM likelihood. Detected by the preview build.
4. **Deadline already passed:** without a granted Nov 1 extension, any upload targeting 35 is rejected now. Request the extension in Play Console Policy status today.
5. **Large-screen landscape layout:** MEDIUM impact if you skip the resizability property. With the property it's LOW until the app targets 37.
6. **EAS `latest` image drift** (sdk-57 image running an SDK 52 project): LOW. Pin `"image": "sdk-52"` if you see environment errors.

### (c) Fallback if it fails

- **If compileSdk 36 fails to build on AGP 8.6:** keep `compileSdkVersion: 35` and set only `targetSdkVersion: 36`, still with the manifest plugin. Play checks only targetSdk (ASSUMED). This departs from the compileSdk ≥ targetSdk convention, so treat it as a stopgap.
- **If that also fails, or as the planned follow-up before Feb 1, 2027:** upgrade to **Expo SDK 54** (RN 0.81). It targets API 36 natively, is 16 KB compliant, disables predictive back by default, and is the last SDK that still supports `newArchEnabled: false`. SDK 55 or later additionally requires the New Architecture migration.
- **Do not** hand-patch AGP/Gradle/Kotlin versions on SDK 52.

## Assumptions Log

| # | Claim | Risk if wrong |
|---|---|---|
| A1 | The target-API rule applies to closed-testing uploads | If testing tracks are exempt, there's less urgency for the testing track only |
| A2 | AGP 8.6.0 treats compileSdk 36 as a warning, like AGP 8.7.0 does | The build fails, so use fallback (c) |
| A3 | EAS auto-downloads android-36 and NDK 26.1 on the `latest` image | The build fails on environment grounds, so pin `sdk-52` |
| A4 | Play accepts targetSdk 36 with compileSdk 35 | Fallback 1 fails, so upgrade the SDK |
| A5 | The Nov 1 extension form is still obtainable after Aug 31 | Updates are blocked until the bump ships |
| A6 | AGP 8.9 requires Gradle ≥ 8.11.1 | Moot, since overriding AGP is not recommended |

## Sources

- Play target API policy: https://support.google.com/googleplay/android-developer/answer/11926878
- AGP ↔ API level table: https://developer.android.com/build/releases/about-agp
- Android 16 behavior changes: https://developer.android.com/about/versions/16/behavior-changes-16
- 16 KB page sizes (Feb 1, 2027): https://developer.android.com/guide/practices/page-sizes
- Expo SDK versions table: https://docs.expo.dev/versions/latest/
- EAS build images: https://docs.expo.dev/build-reference/infrastructure/
- Expo SDK 54 changelog: https://expo.dev/changelog/sdk-54
- Expo 16 KB FYI: https://github.com/expo/fyi/blob/main/android-16kb-page-sizes.md
- Expo app config (predictiveBackGestureEnabled): https://docs.expo.dev/versions/latest/config/app/
- RN Android 16 discussion: https://github.com/react-native-community/discussions-and-proposals/discussions/921
- AGP 8.7 + compileSdk 36 build report: https://github.com/subsurface/subsurface/pull/4964
- AGP 8.9.1 hard requirement from androidx.browser 1.9: https://github.com/alchemyplatform/aa-sdk/issues/1534
- Expo SDK 53 API 36 discussion: https://github.com/expo/expo/discussions/38922
- Back-button-closes-app report: https://dev.to/dainyjose/android-system-back-button-closes-the-app-after-upgrading-to-target-sdk-36-react-native-fix-475g
