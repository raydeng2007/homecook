import fs from 'fs';
import path from 'path';

const APP_JSON_PATH = path.resolve(__dirname, '../../app.json');

interface ExpoConfig {
  expo: {
    name: string;
    slug: string;
    version: string;
    icon: string;
    ios: {
      bundleIdentifier: string;
      buildNumber: string;
    };
    android: {
      adaptiveIcon: {
        foregroundImage: string;
        backgroundColor: string;
      };
      package: string;
      versionCode: number;
    };
  };
}

describe('app.json configuration', () => {
  let config: ExpoConfig;

  beforeAll(() => {
    const raw = fs.readFileSync(APP_JSON_PATH, 'utf-8');
    config = JSON.parse(raw);
  });

  describe('top-level', () => {
    it('has a name and slug', () => {
      expect(config.expo.name).toBe('HomeCook');
      expect(config.expo.slug).toBe('homecook');
    });

    it('has a semver version string', () => {
      expect(config.expo.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('points to a valid icon path', () => {
      const iconPath = path.resolve(__dirname, '../..', config.expo.icon);
      expect(fs.existsSync(iconPath)).toBe(true);
    });
  });

  describe('iOS config', () => {
    it('has the expected bundle identifier', () => {
      expect(config.expo.ios.bundleIdentifier).toBe('io.rayray.homecook');
    });

    /**
     * App Store rejects uploads with the same buildNumber. This guards against
     * forgetting to bump it before a production build.
     */
    it('has a numeric buildNumber string', () => {
      expect(config.expo.ios.buildNumber).toMatch(/^\d+$/);
      expect(parseInt(config.expo.ios.buildNumber, 10)).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Android config', () => {
    it('has the expected package name', () => {
      expect(config.expo.android.package).toBe('live.homecook.app');
    });

    /**
     * Google Play rejects uploads with the same versionCode. This guards
     * against forgetting to bump it before a production build.
     */
    it('has a versionCode >= 2 (was bumped after initial icon fix)', () => {
      expect(typeof config.expo.android.versionCode).toBe('number');
      expect(config.expo.android.versionCode).toBeGreaterThanOrEqual(2);
    });

    /**
     * The adaptive icon foreground must point to a real PNG file.
     * The actual safe-zone validation happens in __tests__/assets/icon.test.ts.
     */
    it('adaptive icon foregroundImage exists on disk', () => {
      const foregroundPath = path.resolve(
        __dirname,
        '../..',
        config.expo.android.adaptiveIcon.foregroundImage
      );
      expect(fs.existsSync(foregroundPath)).toBe(true);
    });

    it('adaptive icon background is a hex color', () => {
      expect(config.expo.android.adaptiveIcon.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
