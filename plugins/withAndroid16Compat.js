const { withAndroidManifest } = require('expo/config-plugins');

const RESTRICTED_RESIZABILITY_PROPERTY = 'android.window.PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY';

/**
 * Pure transform: mutates and returns the AndroidManifest modResults.
 * - Opts out of predictive back (official temporary opt-out, matches SDK 54's
 *   `predictiveBackGestureEnabled: false` default). RN 0.76's ReactActivity
 *   only handles back through onBackPressed(), which Android 16 stops calling
 *   once predictive back is enabled.
 * - Opts out of restricted resizability so the portrait lock still applies on
 *   screens >= 600dp. This property is ignored once the app targets API 37,
 *   so revisit it during the SDK upgrade phase.
 */
function applyAndroid16Compat(androidManifest) {
  const app = androidManifest.manifest.application[0];
  app.$['android:enableOnBackInvokedCallback'] = 'false';

  app.property = app.property ?? [];
  const existing = app.property.find(
    (p) => p.$['android:name'] === RESTRICTED_RESIZABILITY_PROPERTY
  );
  if (existing) {
    existing.$['android:value'] = 'true';
  } else {
    app.property.push({
      $: { 'android:name': RESTRICTED_RESIZABILITY_PROPERTY, 'android:value': 'true' },
    });
  }

  return androidManifest;
}

function withAndroid16Compat(config) {
  return withAndroidManifest(config, (cfg) => {
    cfg.modResults = applyAndroid16Compat(cfg.modResults);
    return cfg;
  });
}

module.exports = withAndroid16Compat;
module.exports.applyAndroid16Compat = applyAndroid16Compat;
module.exports.RESTRICTED_RESIZABILITY_PROPERTY = RESTRICTED_RESIZABILITY_PROPERTY;
