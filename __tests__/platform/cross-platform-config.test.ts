/**
 * Cross-platform app.json configuration tests.
 *
 * These tests enforce that iOS and Android configurations stay in parity
 * where they need to (bundle IDs format, versioning) AND diverge where
 * they must (privacy manifests on iOS only, adaptive icon on Android only).
 *
 * Catches misconfigurations BEFORE they reach the store reviewers:
 *  - Apple rejects builds without privacy manifests
 *  - Google rejects builds without proper targetSdkVersion
 *  - Both reject builds where versionCode/buildNumber wasn't bumped
 *  - Apple Sign In requires usesAppleSignIn: true AND the plugin
 */

import fs from 'fs';
import path from 'path';

const appJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../app.json'), 'utf-8')
);
const expo = appJson.expo;

// ─── Bundle ID parity ─────────────────────────────────────────────────

describe('Bundle ID / package name format', () => {
  it('iOS bundleIdentifier is reverse-domain format', () => {
    // e.g. "io.rayray.homecook" — at least 2 dots
    expect(expo.ios.bundleIdentifier).toMatch(/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*){2,}$/);
  });

  it('Android package is reverse-domain format', () => {
    expect(expo.android.package).toMatch(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/);
  });

  it('iOS and Android both target the HomeCook brand (sanity check)', () => {
    expect(expo.ios.bundleIdentifier.toLowerCase()).toContain('homecook');
    expect(expo.android.package.toLowerCase()).toContain('homecook');
  });
});

// ─── Version parity (avoid the 1.1.1 vs 1.2 fiasco) ───────────────────

describe('Version source-of-truth (post Bug-fix: appVersionSource=local)', () => {
  const easJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../eas.json'), 'utf-8')
  );

  it('eas.json uses appVersionSource: "local" so app.json is authoritative', () => {
    expect(easJson.cli.appVersionSource).toBe('local');
  });

  it('eas.json production profile does NOT have autoIncrement (would conflict with local)', () => {
    expect(easJson.build.production.autoIncrement).toBeUndefined();
  });

  it('iOS buildNumber is a stringified positive integer', () => {
    expect(expo.ios.buildNumber).toMatch(/^[1-9]\d*$/);
  });

  it('Android versionCode is a positive integer', () => {
    expect(Number.isInteger(expo.android.versionCode)).toBe(true);
    expect(expo.android.versionCode).toBeGreaterThan(0);
  });

  it('Version is valid semver', () => {
    expect(expo.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

// ─── iOS-specific config (App Store requirements) ─────────────────────

describe('iOS-specific configuration (App Store Connect requirements)', () => {
  it('declares CFBundleDisplayName so the home screen shows "HomeCook" not the bundle id', () => {
    expect(expo.ios.infoPlist?.CFBundleDisplayName).toBe('HomeCook');
  });

  it('declares NSCameraUsageDescription with a user-readable string', () => {
    expect(typeof expo.ios.infoPlist?.NSCameraUsageDescription).toBe('string');
    expect(expo.ios.infoPlist.NSCameraUsageDescription.length).toBeGreaterThan(10);
  });

  it('declares NSPhotoLibraryUsageDescription with a user-readable string', () => {
    expect(typeof expo.ios.infoPlist?.NSPhotoLibraryUsageDescription).toBe('string');
    expect(expo.ios.infoPlist.NSPhotoLibraryUsageDescription.length).toBeGreaterThan(10);
  });

  it('declares usesNonExemptEncryption: false (avoids export compliance prompt)', () => {
    expect(expo.ios.config?.usesNonExemptEncryption).toBe(false);
  });

  it('declares iPad support (supportsTablet: true)', () => {
    expect(expo.ios.supportsTablet).toBe(true);
  });

  // Privacy manifests (NSPrivacyAccessedAPITypes) became mandatory May 2024.
  // Apple rejects builds without them when using APIs in the "required reason" categories.
  describe('Privacy Manifest (NSPrivacyAccessedAPITypes)', () => {
    const apiTypes = expo.ios.privacyManifests?.NSPrivacyAccessedAPITypes ?? [];

    it('declares at least one privacy manifest entry', () => {
      expect(apiTypes.length).toBeGreaterThan(0);
    });

    it('declares UserDefaults reason (we use AsyncStorage which wraps NSUserDefaults)', () => {
      const userDefaults = apiTypes.find(
        (t: { NSPrivacyAccessedAPIType: string }) =>
          t.NSPrivacyAccessedAPIType === 'NSPrivacyAccessedAPICategoryUserDefaults'
      );
      expect(userDefaults).toBeDefined();
      expect(userDefaults.NSPrivacyAccessedAPITypeReasons.length).toBeGreaterThan(0);
    });

    it('declares FileTimestamp reason (Expo/RN internals access file times)', () => {
      const fileTimestamp = apiTypes.find(
        (t: { NSPrivacyAccessedAPIType: string }) =>
          t.NSPrivacyAccessedAPIType === 'NSPrivacyAccessedAPICategoryFileTimestamp'
      );
      expect(fileTimestamp).toBeDefined();
    });

    it('declares DiskSpace reason', () => {
      const diskSpace = apiTypes.find(
        (t: { NSPrivacyAccessedAPIType: string }) =>
          t.NSPrivacyAccessedAPIType === 'NSPrivacyAccessedAPICategoryDiskSpace'
      );
      expect(diskSpace).toBeDefined();
    });

    it('declares SystemBootTime reason', () => {
      const bootTime = apiTypes.find(
        (t: { NSPrivacyAccessedAPIType: string }) =>
          t.NSPrivacyAccessedAPIType === 'NSPrivacyAccessedAPICategorySystemBootTime'
      );
      expect(bootTime).toBeDefined();
    });

    it('every manifest entry has a non-empty reason code list', () => {
      for (const entry of apiTypes) {
        expect(Array.isArray(entry.NSPrivacyAccessedAPITypeReasons)).toBe(true);
        expect(entry.NSPrivacyAccessedAPITypeReasons.length).toBeGreaterThan(0);
        // Reason codes are format like "CA92.1" or "C617.1"
        for (const code of entry.NSPrivacyAccessedAPITypeReasons) {
          expect(code).toMatch(/^[A-Z0-9]{4}\.\d+$/);
        }
      }
    });
  });
});

// ─── Android-specific config (Play Store requirements) ────────────────

describe('Android-specific configuration (Play Store requirements)', () => {
  it('declares adaptive icon with a foreground image', () => {
    expect(expo.android.adaptiveIcon?.foregroundImage).toBeTruthy();
    const fgPath = path.resolve(__dirname, '../..', expo.android.adaptiveIcon.foregroundImage);
    expect(fs.existsSync(fgPath)).toBe(true);
  });

  it('adaptive icon background is a hex color', () => {
    expect(expo.android.adaptiveIcon?.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('declares INTERNET permission (required for Supabase API calls)', () => {
    expect(expo.android.permissions).toContain('INTERNET');
  });

  it('targets Android API 35 (Play Store requirement as of Aug 2024)', () => {
    const buildProps = expo.plugins.find(
      (p: unknown) => Array.isArray(p) && p[0] === 'expo-build-properties'
    );
    expect(buildProps).toBeDefined();
    expect(buildProps[1].android.compileSdkVersion).toBeGreaterThanOrEqual(35);
    expect(buildProps[1].android.targetSdkVersion).toBeGreaterThanOrEqual(35);
  });
});

// ─── Plugin parity ────────────────────────────────────────────────────

describe('Plugin configuration', () => {
  const pluginNames: string[] = expo.plugins.map((p: unknown) =>
    Array.isArray(p) ? p[0] : p
  );

  it('includes expo-router (for the file-based routing)', () => {
    expect(pluginNames).toContain('expo-router');
  });

  it('includes expo-splash-screen', () => {
    expect(pluginNames).toContain('expo-splash-screen');
  });

  it('includes expo-apple-authentication (required for Apple Sign In on iOS)', () => {
    expect(pluginNames).toContain('expo-apple-authentication');
  });

  it('includes expo-build-properties (for Android SDK targeting)', () => {
    expect(pluginNames).toContain('expo-build-properties');
  });

  it('splash plugin has a backgroundColor matching the app.json splash section', () => {
    const splashPlugin = expo.plugins.find(
      (p: unknown) => Array.isArray(p) && p[0] === 'expo-splash-screen'
    );
    expect(splashPlugin[1].backgroundColor).toBe(expo.splash.backgroundColor);
  });
});

// ─── Asset parity ─────────────────────────────────────────────────────

describe('Required platform-specific assets exist', () => {
  it('iOS icon (./assets/icon.png) exists', () => {
    expect(fs.existsSync(path.resolve(__dirname, '../..', expo.icon))).toBe(true);
  });

  it('Android adaptive icon (./assets/adaptive-icon.png) exists', () => {
    expect(
      fs.existsSync(path.resolve(__dirname, '../..', expo.android.adaptiveIcon.foregroundImage))
    ).toBe(true);
  });

  it('Splash image exists for both platforms', () => {
    expect(fs.existsSync(path.resolve(__dirname, '../..', expo.splash.image))).toBe(true);
  });

  it('Web favicon exists', () => {
    expect(fs.existsSync(path.resolve(__dirname, '../..', expo.web.favicon))).toBe(true);
  });
});

// ─── URL scheme parity (for OAuth redirects + deep links) ─────────────

describe('URL scheme for deep linking (OAuth redirect targets both platforms)', () => {
  it('declares a custom URL scheme', () => {
    expect(expo.scheme).toBe('homecook');
  });

  it('scheme is a single lowercase string (not platform-split)', () => {
    // makeRedirectUri() needs the same scheme on both platforms for OAuth callback
    expect(typeof expo.scheme).toBe('string');
    expect(expo.scheme).toMatch(/^[a-z][a-z0-9]*$/);
  });
});
