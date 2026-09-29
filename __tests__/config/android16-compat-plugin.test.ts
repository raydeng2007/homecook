/** @jest-environment node */

// Android 16 (API 36) skips ReactActivity.onBackPressed() once predictive back
// is enabled, and RN 0.76 only handles back through that override, so the
// system back gesture/button would exit the app instead of popping the
// expo-router stack. Android 16 also ignores the portrait lock on screens
// 600dp or wider. This plugin opts out of both behaviors until the app
// upgrades past RN 0.76 / API 37.

const withAndroid16Compat = require('@/plugins/withAndroid16Compat');
const { applyAndroid16Compat, RESTRICTED_RESIZABILITY_PROPERTY } = withAndroid16Compat;

function makeManifest(): any {
  return {
    manifest: {
      $: {},
      application: [
        {
          $: { 'android:name': '.MainApplication' },
        },
      ],
    },
  };
}

describe('applyAndroid16Compat', () => {
  it('Test 1: sets android:enableOnBackInvokedCallback to "false" on <application>', () => {
    const manifest = makeManifest();
    const result = applyAndroid16Compat(manifest);
    expect(result.manifest.application[0].$['android:enableOnBackInvokedCallback']).toBe('false');
  });

  it('Test 2: adds exactly one restricted-resizability property set to "true"', () => {
    const manifest = makeManifest();
    const result = applyAndroid16Compat(manifest);
    const props = result.manifest.application[0].property;
    expect(props).toHaveLength(1);
    expect(props[0].$['android:name']).toBe(RESTRICTED_RESIZABILITY_PROPERTY);
    expect(props[0].$['android:value']).toBe('true');
  });

  it('Test 3: idempotent — calling twice still yields exactly one property and "false" attribute', () => {
    const manifest = makeManifest();
    applyAndroid16Compat(manifest);
    applyAndroid16Compat(manifest);
    const app = manifest.manifest.application[0];
    expect(app.$['android:enableOnBackInvokedCallback']).toBe('false');
    const matching = app.property.filter(
      (p: any) => p.$['android:name'] === RESTRICTED_RESIZABILITY_PROPERTY
    );
    expect(matching).toHaveLength(1);
  });

  it('Test 4: preserves pre-existing application attributes and unrelated property entries', () => {
    const manifest = makeManifest();
    manifest.manifest.application[0].$['android:allowBackup'] = 'true';
    manifest.manifest.application[0].property = [
      { $: { 'android:name': 'com.example.other', 'android:value': 'x' } },
    ];

    const result = applyAndroid16Compat(manifest);
    const app = result.manifest.application[0];

    expect(app.$['android:name']).toBe('.MainApplication');
    expect(app.$['android:allowBackup']).toBe('true');
    expect(app.property).toHaveLength(2);
    expect(
      app.property.some((p: any) => p.$['android:name'] === 'com.example.other' && p.$['android:value'] === 'x')
    ).toBe(true);
  });

  it('Test 5: updates an existing resizability property value instead of duplicating it', () => {
    const manifest = makeManifest();
    manifest.manifest.application[0].property = [
      { $: { 'android:name': RESTRICTED_RESIZABILITY_PROPERTY, 'android:value': 'false' } },
    ];

    const result = applyAndroid16Compat(manifest);
    const app = result.manifest.application[0];

    expect(app.property).toHaveLength(1);
    expect(app.property[0].$['android:value']).toBe('true');
  });

  it('Test 6 (wiring): the registered manifest mod applies the transform', async () => {
    const config = withAndroid16Compat({ name: 'homecook', slug: 'homecook' });
    const result = await config.mods.android.manifest({
      ...config,
      modResults: makeManifest(),
      modRequest: {
        platform: 'android',
        modName: 'manifest',
        projectRoot: '/tmp',
        platformProjectRoot: '/tmp',
        introspect: true,
      },
      modRawConfig: config,
    });
    const app = result.modResults.manifest.application[0];
    expect(app.$['android:enableOnBackInvokedCallback']).toBe('false');
    expect(app.property).toHaveLength(1);
  });

  it('Test 7: exports RESTRICTED_RESIZABILITY_PROPERTY constant', () => {
    expect(RESTRICTED_RESIZABILITY_PROPERTY).toBe(
      'android.window.PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY'
    );
  });
});
