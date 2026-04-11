# Technology Stack

**Analysis Date:** 2026-03-26

## Languages

**Primary:**
- TypeScript 5.3.3 - All application code (`tsconfig.json` extends `expo/tsconfig.base` with `strict: true`)
- TSX - React Native components in `app/` and `components/`

**Secondary:**
- JavaScript - Configuration files (`babel.config.js`, `metro.config.js`, `tailwind.config.js`)
- SQL - Database migrations in `scripts/migration-*.sql`

## Runtime

**Environment:**
- Node.js v22 (specified in `.nvmrc` as `22`, `package.json` engines `>=20.18.1`)
- React Native 0.76.9 (New Architecture enabled via `"newArchEnabled": true` in `app.json`)
- Expo SDK 52 (managed workflow)

**Package Manager:**
- npm (version `>=10.0.0` per `package.json` engines)
- Lockfile: Not present (no `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml` detected)

## Frameworks

**Core:**
- Expo ~52.0.11 - Managed React Native framework (`package.json`)
- Expo Router ~4.0.14 - File-based routing (`app/` directory, entry point `expo-router/entry`)
- React 18.3.1 - UI library
- React Native 0.76.9 - Native platform layer

**Styling:**
- NativeWind ^4.1.23 - Tailwind CSS for React Native (`package.json`)
- TailwindCSS ^3.4.17 - Utility-first CSS framework (dev dependency, config at `tailwind.config.js`)

**Build/Dev:**
- Babel (via `babel-preset-expo`) - Transpilation (`babel.config.js`)
- Metro bundler - React Native bundler (`metro.config.js`, configured with NativeWind via `withNativeWind`)
- EAS Build - Cloud build service (`eas.json` with development/preview/production profiles)
- EAS CLI >= 12.0.0 (`eas.json`)

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.93.1 - Backend client for auth, database, and RPC calls (`lib/supabase.ts`)
- `expo-router` ~4.0.14 - All navigation and routing (`app/` directory structure)
- `nativewind` ^4.1.23 - All component styling via `className` prop

**Animation & Gestures:**
- `react-native-reanimated` ~3.16.1 - Animations (Babel plugin in `babel.config.js`)
- `react-native-gesture-handler` ~2.20.2 - Touch gesture handling

**Navigation Infrastructure:**
- `react-native-screens` ~4.4.0 - Native screen containers
- `react-native-safe-area-context` 4.12.0 - Safe area insets

**Auth & Browser:**
- `expo-auth-session` ~6.0.3 - OAuth redirect URI generation (`lib/auth.ts`)
- `expo-web-browser` ~14.0.2 - In-app browser for OAuth flows (`lib/auth.ts`)
- `expo-crypto` ~14.0.2 - Cryptographic operations

**Storage:**
- `@react-native-async-storage/async-storage` 1.23.1 - Local key-value storage for auth session persistence (`lib/supabase.ts`) and theme preference (`contexts/ThemeContext.tsx`)

**Utilities:**
- `react-native-url-polyfill` 3.0.0 - URL API polyfill for Supabase compatibility (`lib/supabase.ts`)
- `expo-clipboard` ~7.0.1 - Clipboard access (likely for invite code copying)
- `expo-linking` ~7.0.5 - Deep linking support
- `expo-splash-screen` ~0.29.24 - Splash screen management

**Web Support:**
- `react-dom` 18.3.1 - Web rendering
- `react-native-web` ~0.19.13 - React Native web compatibility
- `@expo/metro-runtime` ~4.0.1 - Metro web runtime

## Configuration

**TypeScript:**
- Config: `tsconfig.json`
- Strict mode enabled
- Path alias: `@/*` maps to `./*` (project root)
- Module resolution: `bundler`
- JSX: `react-jsx`
- Scripts excluded from compilation (`scripts/` has its own `scripts/tsconfig.json`)

**Babel:**
- Config: `babel.config.js`
- Preset: `babel-preset-expo` with `jsxImportSource: 'nativewind'`
- Plugin: `react-native-reanimated/plugin` (must be last)

**Metro:**
- Config: `metro.config.js`
- Wrapped with `withNativeWind` for CSS-in-JS processing
- Input CSS: `./global.css`

**Tailwind:**
- Config: `tailwind.config.js`
- Preset: `nativewind/preset`
- Content paths: `App.{js,jsx,ts,tsx}`, `app/**/*`, `components/**/*`
- Custom design tokens: Bordeaux & Champagne palette with CSS variable-based theming
- Global styles: `global.css` (utility classes: `card`, `btn-primary`, `heading-1`, `heading-2`, `screen`)

**EAS Build:**
- Config: `eas.json`
- Profiles: `development` (simulator), `preview` (internal distribution), `production` (auto-increment)
- iOS bundle ID: `io.rayray.homecook`
- Android package: `io.rayray.homecook`

**Environment:**
- `.env` file present - contains Supabase configuration
- Environment variables accessed via `process.env.EXPO_PUBLIC_*` prefix
- Required vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Platform Requirements

**Development:**
- Node.js v22+ (use `nvm use` to switch)
- npm >= 10.0.0
- Expo CLI (via `npx expo`)
- iOS Simulator or Android emulator for native testing
- Web browser for `expo start --web`

**Production:**
- iOS: Requires Apple Developer account, built via EAS Build
- Android: Built via EAS Build (APK for preview, AAB for production)
- Web: Metro bundler output, deployable as static site
- Backend: Supabase hosted (no self-hosted infrastructure)

## Scripts

**Development:**
```bash
nvm use                       # Switch to Node 22
npx expo start --clear        # Start dev server (clear cache)
npx expo start --web          # Start web preview
npx tsc --noEmit              # Type check
```

**Build:**
```bash
eas build --profile development   # Dev client build
eas build --profile preview       # Internal distribution
eas build --profile production    # Production build
```

**Database Migrations:**
- Located in `scripts/migration-*.sql` (001 through 008)
- Run via `scripts/run-migration.ts` using Supabase admin client (`scripts/supabase-admin.ts`)
- Data import scripts: `scripts/import-spoonacular.ts`, `scripts/import-themealdb.ts`

---

*Stack analysis: 2026-03-26*
