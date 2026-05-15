# Homecook
Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask.
2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

3. Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

4. Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.




A meal planning app for households built with Expo and React Native.

## Tech Stack

- **Framework**: Expo SDK 52, Expo Router v4
- **Language**: TypeScript (strict)
- **Styling**: NativeWind v4 (Tailwind for React Native)
- **Backend**: Supabase (auth, database)
- **State**: React Context (AuthContext, HomeContext, ThemeContext)
- **Node**: v22+ (use `nvm use` before running commands)

## Project Structure

```
homecook/
├── app/
│   ├── _layout.tsx           # Root layout (AuthProvider + routing)
│   ├── index.tsx             # Root redirect (auth-aware)
│   ├── (auth)/
│   │   ├── _layout.tsx       # Auth stack
│   │   ├── login.tsx         # Login screen (Google/Facebook/Apple/Email)
│   │   ├── email-sign-in.tsx # Email sign-in form
│   │   ├── email-sign-up.tsx # Email sign-up form
│   │   └── email-confirmation.tsx # Email verification screen
│   └── (app)/
│       ├── _layout.tsx       # Tabs layout (HomeProvider + CustomTabBar)
│       ├── index.tsx         # Home tab (Calendar + meal plans)
│       ├── recipes/
│       │   ├── _layout.tsx   # Stack for recipe navigation
│       │   ├── index.tsx     # Recipe list
│       │   ├── create.tsx    # Create recipe form
│       │   ├── [id].tsx      # Recipe detail
│       │   └── edit.tsx      # Edit recipe form
│       ├── planner.tsx       # Meal planner screen (hidden tab, week view)
│       ├── shopping.tsx      # Shopping list tab (auto-generated from meal plans)
│       └── household.tsx     # Household management + legal links
├── components/
│   ├── AddMealModal.tsx      # Modal to add meal to date
│   ├── CategoryChips.tsx     # Ingredient category filter chips
│   ├── CustomTabBar.tsx      # Bottom tab bar (4 tabs)
│   ├── ErrorBoundary.tsx     # Global error boundary
│   ├── FormInput.tsx         # Reusable text input
│   ├── HexagonShape.tsx      # Hexagon SVG for calendar date selector
│   ├── IngredientRow.tsx     # Dynamic ingredient input row
│   ├── LoadingButton.tsx     # Button with loading state
│   ├── MealPlanCard.tsx      # Meal plan display card
│   ├── MealTypeTabBar.tsx    # Breakfast/Lunch/Dinner/Snack tabs
│   ├── MonthCalendarGrid.tsx # Calendar month grid view
│   ├── NutritionBadges.tsx   # Calorie/protein/carb badges
│   ├── RecipeDiaryCard.tsx   # Compact recipe card for diary view
│   ├── RecipeForm.tsx        # Shared create/edit recipe form
│   ├── RecipeHeroCard.tsx    # Large recipe display card
│   ├── RecipeImage.tsx       # Recipe image with fallback
│   ├── RecipeThumbCard.tsx   # Thumbnail recipe card
│   ├── ServingStepper.tsx    # +/- serving size control
│   ├── SocialLoginButton.tsx # OAuth provider button (Google/Facebook/Apple)
│   └── WeekCalendarStrip.tsx # Horizontal week day strip
├── contexts/
│   ├── AuthContext.tsx        # Supabase session management
│   ├── HomeContext.tsx        # Household auto-setup + provider
│   └── ThemeContext.tsx       # Dark/light theme with AsyncStorage persistence
├── hooks/
│   └── useThemeColors.ts     # Raw color strings for non-className props
├── lib/
│   ├── supabase.ts           # Supabase client singleton
│   ├── auth.ts               # Auth functions (Google, Facebook, Apple, Email)
│   ├── validation.ts         # Form validators
│   ├── homes.ts              # Home/household CRUD
│   ├── recipes.ts            # Recipe CRUD
│   ├── saved-recipes.ts      # Bookmarked/saved recipes
│   ├── meal-plans.ts         # Meal plan queries
│   ├── date-utils.ts         # Shared date formatting (formatDateKey, getWeekRange)
│   ├── ingredient-normalize.ts # Ingredient normalization for shopping lists
│   ├── ingredient-categories.ts # Ingredient category detection
│   ├── portion-scaling.ts    # Recipe serving size scaling
│   └── recipe-visuals.ts     # Recipe image/color helpers
├── types/
│   └── database.ts           # TypeScript interfaces for DB entities
├── global.css                # Tailwind base + component classes
└── tailwind.config.js        # Theme configuration
```

## Commands

```bash
nvm use                       # Switch to correct Node version
npx expo start --clear        # Start dev server (clear cache)
npx tsc --noEmit              # Type check
npm test                      # Run Jest unit tests (291 tests)
npx eas build --platform android --profile production  # Android AAB build
npx eas build --platform ios --profile production      # iOS IPA build
```

## App Store Release Checklist

**CRITICAL: Always bump version numbers and metadata before every production build.** Both stores reject uploads with duplicate version identifiers, and forgetting to bump them is the most common reason builds fail to reach users.

### Before any production build — update `app.json`:

| Field | When to bump | Example |
|-------|-------------|---------|
| `expo.version` | New user-facing release | `"1.1.0"` → `"1.1.1"` |
| `expo.ios.buildNumber` | **Every iOS build** (Apple rejects duplicates) | `"3"` → `"4"` |
| `expo.android.versionCode` | **Every Android build** (Google rejects duplicates) | `1` → `2` |

**Rules:**
- `version` is the user-visible semver string. Bump per release (patch for fixes, minor for features, major for breaking changes).
- `buildNumber` (iOS) and `versionCode` (Android) MUST increment on every single build that gets uploaded — even for the same `version`. They cannot be reused.
- When in doubt, bump all three.

### Pre-release checklist (run BEFORE `eas build`):

1. **Bump version numbers** in `app.json` (see table above)
2. **Run database migrations** in Supabase SQL Editor if any `scripts/migration-*.sql` are new — do this BEFORE the build reaches users, or queries against new tables will fail
3. **Update metadata** that's tied to a release:
   - Privacy manifests (`ios.privacyManifests`) if new iOS APIs are used
   - Permissions (`ios.infoPlist.NS*UsageDescription`, `android.permissions`) if added
   - Privacy policy + terms pages at homecook.live if data practices changed
4. **Type check + tests**: `npx tsc --noEmit && npm test`
5. **Visual verification** via web preview (per the Workflow section)

### Post-build (in App Store Connect / Play Console):

- **iOS App Store Connect**: Create a new version, fill "What's New in This Version" release notes, attach the new build, submit for review
- **Google Play Console**: Upload to the appropriate track (Closed Testing / Production), write release notes, roll out
- **Both stores**: Confirm screenshots, app description, age rating, and content rating still match the new build

### Build & submit commands:

```bash
nvm use
npx eas build --platform ios --profile production
npx eas submit --platform ios --latest
npx eas build --platform android --profile production
npx eas submit --platform android --latest
```

### Regression tests guarding this:

- `__tests__/config/app-config.test.ts` — fails if `versionCode` or `buildNumber` are missing/invalid
- `__tests__/assets/icon.test.ts` — fails if icon assets regress (e.g., missing safe zone)

Run `npm test` before every release. If a config test fails, the release is not ready to ship.

## Code Style

- **Styling**: Always use NativeWind `className`, never `StyleSheet.create`
- **Imports**: Use `@/` path alias (e.g., `@/components/Button`)
- **Components**: Small, focused, one component per file
- **Types**: Explicit types for props, avoid `any`

## Design System

Warm artisanal dark theme with bordeaux/champagne palette (see `tailwind.config.js` + `contexts/ThemeContext.tsx`):

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#D9B991` (champagne gold) | Buttons, accents, interactive |
| `secondary` | `#8B3A3A` (dusty bordeaux) | Secondary actions, highlights |
| `error` | `#E07A5F` (warm terracotta) | Error states |
| `background` | `#0D0C00` dark / `#FAF3EB` light | Screen backgrounds |
| `surface-1` to `surface-5` | Progressively lighter | Cards, elevation |
| `text-high` | 90% opacity | Primary text |
| `text-medium` | 62% opacity | Secondary text |
| `text-disabled` | 38% opacity | Disabled states |
| `border-subtle` / `border-card` / `border-focus` | Warm-toned borders | Element borders |

Theme is togglable (dark/light) via `ThemeContext` with `AsyncStorage` persistence. Never hardcode hex values — use Tailwind tokens or `useThemeColors()`.

Utility classes in `global.css`: `card`, `card-elevated`, `btn-primary`, `btn-secondary`, `btn-outline`, `btn-error`, `heading-1`, `heading-2`, `body-text`, `body-text-medium`, `muted-text`, `disabled-text`, `input`, `pill-chip`, `pill-chip-active`, `search-bar`, `screen`

## Architecture

### Auth Flow
1. `AuthProvider` in root layout tracks Supabase session
2. `useAuth()` hook provides `session` and `isLoading`
3. Root layout redirects: no session → `/(auth)/login`, session → `/(app)`
4. Google/Facebook OAuth uses `expo-web-browser` + `makeRedirectUri()` from `expo-auth-session`
5. Apple Sign In (iOS only) uses native `expo-apple-authentication` + Supabase `signInWithIdToken()`

### Home/Household Flow
1. `HomeProvider` wraps all authenticated tabs
2. On mount: `getOrCreateHome(userId)` finds or creates a default home
3. `useHome()` hook provides `home` and `isLoading`
4. All data queries (recipes, meal plans) use `home.id` from this context

### Navigation
- Auth screens go in `app/(auth)/` (Stack layout)
- Authenticated screens go in `app/(app)/` (Tabs layout with CustomTabBar)
- Recipe sub-screens use a nested Stack inside the Recipes tab
- Each route group has its own `_layout.tsx`

### Data Layer
- `lib/recipes.ts` — CRUD: `getRecipes`, `getRecipe`, `createRecipe`, `updateRecipe`, `deleteRecipe`
- `lib/meal-plans.ts` — `getMealPlansForMonth`, `getMealPlansForDate`, `addMealPlan`, `removeMealPlan`
- `lib/homes.ts` — `getOrCreateHome`, `getHomeMembers`
- `types/database.ts` — TypeScript interfaces for all DB entities

## Role Modes

When I say **"engineer mode"**: Focus on code quality, types, performance, edge cases, error handling.

When I say **"design mode"**: Focus on UI/UX — spacing, typography, color usage, touch targets (min 44pt), visual hierarchy, animations, accessibility.

When I say **"review mode"**: Critique the current implementation. Look for bugs, missing edge cases, accessibility issues, performance problems. Don't fix — just list issues.

## Workflow

After implementing any feature:
1. Run `npx tsc --noEmit` to type check
2. Start web preview with `preview_start` (name: "web")
3. Take screenshots and click through the new feature to verify
4. Fix any issues found
5. Only report "done" after visual verification passes

## Current Focus

- [x] Google OAuth
- [x] Facebook OAuth
- [x] Apple Sign In (iOS native)
- [x] Email/password auth
- [x] Calendar meal planning with hexagon date selector
- [x] Bottom sticky navbar with 4 tabs
- [x] Recipe CRUD with form validation + input length limits
- [x] Meal planning calendar — assign recipes to dates, view daily plans
- [x] Warm artisanal dark/light theme (bordeaux/champagne palette)
- [x] Shopping list: auto-generate ingredient list from week's meal plans
- [x] Household management: invite members, manage roles
- [x] Recipe search/filter
- [x] Unit tests (291 tests, 8 suites — validation, date-utils, ingredient-normalize, etc.)
- [x] iOS Privacy Manifest (PrivacyInfo.xcprivacy)
- [x] Android API 35 targeting
- [x] Legal pages (privacy, terms, delete account) at homecook.live
- [x] Error handling hardened (silent catches replaced with alerts/warnings)
- [x] Supabase RLS enabled on all tables
- [ ] App Store submission (pending Apple Developer enrollment)
- [ ] Google Play submission (closed testing in progress)


## Don'ts

- Don't use `StyleSheet.create` — use NativeWind
- Don't add files without checking existing patterns first
- Don't over-engineer — keep it simple
- Don't skip TypeScript types

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Homecook**

A meal planning app for households built with Expo and React Native, targeting iOS and Android app stores. Users can manage recipes, plan meals on a calendar, auto-generate shopping lists, and collaborate with household members. The app uses a warm, artisanal dark theme with a bordeaux/champagne color palette.

**Core Value:** Households can plan meals together and generate accurate shopping lists — the daily-use loop of pick recipes, assign to days, shop from the list must work flawlessly.

### Constraints

- **Tech stack**: Expo SDK 52, React Native 0.76, NativeWind v4, Supabase — established, no changes
- **Styling**: NativeWind `className` only, no `StyleSheet.create` — project convention
- **Colors**: Centralized warm palette (bordeaux/champagne), must be easily swappable — user requirement
- **Node**: v22+ required
- **Testing**: Jest + React Native Testing Library for units, Maestro for E2E — matches Expo ecosystem
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.3.3 - All application code (`tsconfig.json` extends `expo/tsconfig.base` with `strict: true`)
- TSX - React Native components in `app/` and `components/`
- JavaScript - Configuration files (`babel.config.js`, `metro.config.js`, `tailwind.config.js`)
- SQL - Database migrations in `scripts/migration-*.sql`
## Runtime
- Node.js v22 (specified in `.nvmrc` as `22`, `package.json` engines `>=20.18.1`)
- React Native 0.76.9 (New Architecture enabled via `"newArchEnabled": true` in `app.json`)
- Expo SDK 52 (managed workflow)
- npm (version `>=10.0.0` per `package.json` engines)
- Lockfile: Not present (no `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml` detected)
## Frameworks
- Expo ~52.0.11 - Managed React Native framework (`package.json`)
- Expo Router ~4.0.14 - File-based routing (`app/` directory, entry point `expo-router/entry`)
- React 18.3.1 - UI library
- React Native 0.76.9 - Native platform layer
- NativeWind ^4.1.23 - Tailwind CSS for React Native (`package.json`)
- TailwindCSS ^3.4.17 - Utility-first CSS framework (dev dependency, config at `tailwind.config.js`)
- Babel (via `babel-preset-expo`) - Transpilation (`babel.config.js`)
- Metro bundler - React Native bundler (`metro.config.js`, configured with NativeWind via `withNativeWind`)
- EAS Build - Cloud build service (`eas.json` with development/preview/production profiles)
- EAS CLI >= 12.0.0 (`eas.json`)
## Key Dependencies
- `@supabase/supabase-js` 2.93.1 - Backend client for auth, database, and RPC calls (`lib/supabase.ts`)
- `expo-router` ~4.0.14 - All navigation and routing (`app/` directory structure)
- `nativewind` ^4.1.23 - All component styling via `className` prop
- `react-native-reanimated` ~3.16.1 - Animations (Babel plugin in `babel.config.js`)
- `react-native-gesture-handler` ~2.20.2 - Touch gesture handling
- `react-native-screens` ~4.4.0 - Native screen containers
- `react-native-safe-area-context` 4.12.0 - Safe area insets
- `expo-auth-session` ~6.0.3 - OAuth redirect URI generation (`lib/auth.ts`)
- `expo-web-browser` ~14.0.2 - In-app browser for OAuth flows (`lib/auth.ts`)
- `expo-crypto` ~14.0.2 - Cryptographic operations
- `@react-native-async-storage/async-storage` 1.23.1 - Local key-value storage for auth session persistence (`lib/supabase.ts`) and theme preference (`contexts/ThemeContext.tsx`)
- `react-native-url-polyfill` 3.0.0 - URL API polyfill for Supabase compatibility (`lib/supabase.ts`)
- `expo-clipboard` ~7.0.1 - Clipboard access (likely for invite code copying)
- `expo-linking` ~7.0.5 - Deep linking support
- `expo-splash-screen` ~0.29.24 - Splash screen management
- `react-dom` 18.3.1 - Web rendering
- `react-native-web` ~0.19.13 - React Native web compatibility
- `@expo/metro-runtime` ~4.0.1 - Metro web runtime
## Configuration
- Config: `tsconfig.json`
- Strict mode enabled
- Path alias: `@/*` maps to `./*` (project root)
- Module resolution: `bundler`
- JSX: `react-jsx`
- Scripts excluded from compilation (`scripts/` has its own `scripts/tsconfig.json`)
- Config: `babel.config.js`
- Preset: `babel-preset-expo` with `jsxImportSource: 'nativewind'`
- Plugin: `react-native-reanimated/plugin` (must be last)
- Config: `metro.config.js`
- Wrapped with `withNativeWind` for CSS-in-JS processing
- Input CSS: `./global.css`
- Config: `tailwind.config.js`
- Preset: `nativewind/preset`
- Content paths: `App.{js,jsx,ts,tsx}`, `app/**/*`, `components/**/*`
- Custom design tokens: Bordeaux & Champagne palette with CSS variable-based theming
- Global styles: `global.css` (utility classes: `card`, `btn-primary`, `heading-1`, `heading-2`, `screen`)
- Config: `eas.json`
- Profiles: `development` (simulator), `preview` (internal distribution), `production` (auto-increment)
- iOS bundle ID: `io.rayray.homecook`
- Android package: `live.homecook.app`
- `.env` file present - contains Supabase configuration
- Environment variables accessed via `process.env.EXPO_PUBLIC_*` prefix
- Required vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
## Platform Requirements
- Node.js v22+ (use `nvm use` to switch)
- npm >= 10.0.0
- Expo CLI (via `npx expo`)
- iOS Simulator or Android emulator for native testing
- Web browser for `expo start --web`
- iOS: Requires Apple Developer account, built via EAS Build
- Android: Built via EAS Build (APK for preview, AAB for production)
- Web: Metro bundler output, deployable as static site
- Backend: Supabase hosted (no self-hosted infrastructure)
## Scripts
- Located in `scripts/migration-*.sql` (001 through 008)
- Run via `scripts/run-migration.ts` using Supabase admin client (`scripts/supabase-admin.ts`)
- Data import scripts: `scripts/import-spoonacular.ts`, `scripts/import-themealdb.ts`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Components: PascalCase, one component per file (e.g., `components/MealPlanCard.tsx`, `components/RecipeForm.tsx`)
- Screens/routes: kebab-case following Expo Router convention (e.g., `app/(auth)/email-sign-in.tsx`)
- Library modules: kebab-case (e.g., `lib/meal-plans.ts`, `lib/ingredient-categories.ts`)
- Hooks: camelCase with `use` prefix (e.g., `hooks/useThemeColors.ts`)
- Types: kebab-case (e.g., `types/database.ts`)
- Contexts: PascalCase (e.g., `contexts/AuthContext.tsx`, `contexts/HomeContext.tsx`)
- camelCase for all functions: `getRecipes`, `signInWithEmail`, `formatDateKey`
- Async data functions: verb-first naming (`getRecipes`, `createRecipe`, `removeMealPlan`)
- Event handlers in components: `handle` prefix (`handleSignIn`, `handleRemoveMeal`, `handleRecipePress`)
- Validators return `string | null` (error message or null): `validateEmail`, `validatePassword`
- camelCase for all local variables and state
- UPPER_SNAKE_CASE for module-level constants: `MEAL_TYPE_LABELS`, `TAB_CONFIG`, `PAGE_SIZE`, `THEME_STORAGE_KEY`
- Boolean state uses `is` prefix: `isLoading`, `isDisabled`, `isDark`
- Use `interface` for database entities and component props: `interface Recipe`, `interface LoadingButtonProps`
- Use `type` for unions, context types, and input types: `type MealType`, `type AuthContextType`, `type CreateRecipeInput`
- Use `Partial<>`, `Pick<>`, `Omit<>`, `Record<>` utility types where appropriate
- Props types defined above the component, named `{ComponentName}Props` or inline `type` alias
## Code Style
- No Prettier or ESLint config detected. Formatting is manual/IDE-driven.
- 2-space indentation
- Single quotes for strings
- Trailing semicolons used consistently
- Template literals for string interpolation
- No linter configured. TypeScript strict mode (`"strict": true` in `tsconfig.json`) serves as the primary code quality gate.
- Type checking command: `npx tsc --noEmit`
## Import Organization
- `@/*` maps to project root (configured in `tsconfig.json`)
- Always use `@/` for internal imports. Never use relative `../` paths across directories.
- Named imports preferred: `import { supabase } from '@/lib/supabase'`
- `import type` used for type-only imports: `import type { Recipe } from '@/types/database'`
- Default exports for screen components and major components
- Named exports for reusable utilities: `export function FormInput`, `export function LoadingButton`
## Component Patterns
- Destructure props in function signature
- Use `Pick<>` to select specific fields from database types for props
- Optional props use `?` suffix with defaults via `= false`
## Styling Approach
- CSS custom properties (vars) defined in `contexts/ThemeContext.tsx` for dark/light modes
- Tailwind config in `tailwind.config.js` references `var(--color-*)` for theme-aware colors
- `useThemeColors()` hook from `hooks/useThemeColors.ts` provides raw color strings for non-className props (icons, `placeholderTextColor`, `StatusBar`)
- Layout: `screen` (flex-1 + bg-background)
- Cards: `card`, `card-elevated`
- Buttons: `btn-primary`, `btn-secondary`, `btn-outline`, `btn-error`
- Typography: `heading-1`, `heading-2`, `body-text`, `body-text-medium`, `muted-text`, `disabled-text`
- Input: `input`
- Chips: `pill-chip`, `pill-chip-active`
- Search: `search-bar`
- Decorative: `section-heading`, `section-divider`
- Primary: `#D9B991` (champagne gold) - use `bg-primary`, `text-primary`
- Secondary: `#8B3A3A` (dusty bordeaux) - use `bg-secondary`, `text-secondary`
- Error: `#E07A5F` (warm terracotta) - use `bg-error`, `text-error`
- Surfaces: `bg-surface-1` through `bg-surface-5` (progressively lighter)
- Text: `text-text-high` (90% opacity), `text-text-medium` (62%), `text-text-disabled` (38%)
- Borders: `border-border-subtle`, `border-border-card`, `border-border-focus`
- Never hardcode hex values in components. Use Tailwind tokens or `useThemeColors()`.
## Error Handling
- Most functions throw on error: `if (error) throw error;`
- Some return empty arrays on error for non-critical queries (e.g., `getAllRecipes` returns `[]`)
- Auth functions return result objects: `{ success: boolean; error?: string }` instead of throwing
- Auth errors mapped to user-friendly messages via `mapAuthError()` in `lib/auth.ts`
- try/catch around async operations
- Error state stored in component: `const [error, setError] = useState<string | null>(null)`
- User feedback via `Alert.alert()` for destructive action failures
- Inline error text for form validation
- Loading states tracked with `isLoading` boolean
- `components/ErrorBoundary.tsx` wraps the root layout
- Catches unexpected React crashes and shows a recovery screen
- Uses inline styles (not NativeWind) since it must render without theme context
- `lib/validation.ts` provides pure validator functions
- Pattern: `validateX(value): string | null` - returns error string or null
- Form-level validation calls all field validators, sets per-field error state
## State Management
- `useState` for UI state (forms, loading, selected items)
- `useCallback` for async data-loading functions passed to `useEffect`
- No `useReducer` usage detected
## Logging
- Minimal logging. Most errors are either thrown or shown to user via UI.
- `componentDidCatch` in `ErrorBoundary.tsx` has a comment placeholder for Sentry integration.
- No debug logging in data layer functions.
## Comments
- JSDoc on exported data-layer functions: `/** Get all recipes for a home, newest first. */`
- Section dividers with `// ===...===` banner comments to separate logical sections within a file
- Inline comments for non-obvious logic or workarounds
- `// TODO` / `// FIXME` for known issues
- Used on `lib/*.ts` exported functions consistently
- Not used on component props (types are self-documenting)
- Format: `/** Single-line description. */` for most functions
## Function Design
- Input objects for create/update operations: `CreateRecipeInput`, `CreateMealPlanInput`
- Primitive params for simple queries: `getRecipe(id: string)`
- Destructured props for components
- Data layer: Promise of typed entity (`Promise<Recipe>`, `Promise<MealPlan[]>`)
- Void for delete operations: `Promise<void>`
- Auth: Result objects `{ success, error?, needsEmailConfirmation? }`
- Validators: `string | null`
## Module Design
- Default exports for screen components and major UI components
- Named exports for utility components (`FormInput`, `LoadingButton`, `SocialLoginButton`)
- Named exports for all `lib/*.ts` functions
- Named exports for types in `types/database.ts`
- One module per domain: `recipes.ts`, `meal-plans.ts`, `homes.ts`, `auth.ts`
- Each module imports supabase client and relevant types
- Pure async functions, no internal state
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Single-codebase mobile app using Expo (iOS, Android, Web)
- No custom backend server -- all server logic lives in Supabase (Postgres + Auth + RPC functions)
- File-based routing via Expo Router v4 with route groups for auth/app separation
- React Context for global state (auth session, household, theme)
- Data layer is a thin async function wrapper around the Supabase JS client
- Multi-tenant by household: all data queries are scoped to `home_id`
## Layers
- Purpose: Screen-level components that compose UI from shared components and call data functions
- Location: `app/`
- Contains: Route layouts, screen components, navigation configuration
- Depends on: `components/`, `contexts/`, `lib/`, `hooks/`, `types/`
- Used by: Expo Router (entry point: `expo-router/entry` via `package.json` `"main"`)
- Purpose: Reusable presentational and container components
- Location: `components/`
- Contains: UI widgets (calendars, cards, modals, form inputs, tab bars)
- Depends on: `contexts/`, `hooks/`, `lib/`, `types/`
- Used by: Screen components in `app/`
- Purpose: Global state management via React Context + Provider pattern
- Location: `contexts/`
- Contains: Three providers -- `AuthContext`, `HomeContext`, `ThemeContext`
- Depends on: `lib/supabase.ts`, `lib/homes.ts`, `@react-native-async-storage/async-storage`
- Used by: All screens and components via `useAuth()`, `useHome()`, `useTheme()` hooks
- Purpose: All Supabase interactions -- CRUD operations, auth flows, utility functions
- Location: `lib/`
- Contains: Async functions that wrap `supabase` client calls, plus pure utility modules
- Depends on: `lib/supabase.ts` (singleton client), `types/database.ts`
- Used by: Screen components and contexts
- Purpose: Custom React hooks for cross-cutting concerns
- Location: `hooks/`
- Contains: `useThemeColors.ts` -- provides raw color strings for non-className props
- Depends on: `contexts/ThemeContext.tsx`
- Used by: Any component needing theme colors in JS (icons, status bar, etc.)
- Purpose: TypeScript interfaces for all database entities and input types
- Location: `types/`
- Contains: `database.ts` -- all entity types, input types, display helper constants
- Depends on: Nothing
- Used by: All layers
## Data Flow
```
```
- **Global state:** Three React Contexts -- `AuthContext` (session), `HomeContext` (household), `ThemeContext` (dark/light mode)
- **Screen-local state:** `useState` + `useEffect` + `useCallback` for data fetching and UI state
- **No global data cache:** Each screen fetches its own data on mount/focus. No shared recipe cache or centralized store.
- **Theme persistence:** `ThemeContext` uses `AsyncStorage` to persist dark/light preference
## Key Abstractions
- Purpose: Multi-tenant boundary -- all recipes, meal plans, and members belong to a home
- Examples: `types/database.ts` (`Home`, `HomeMember`), `lib/homes.ts`, `contexts/HomeContext.tsx`
- Pattern: Every data query filters by `home_id`; users auto-join/create a home on first login
- Purpose: Core content entity with ingredients, instructions, nutrition, and source tracking
- Examples: `types/database.ts` (`Recipe`, `Ingredient`, `NormalizedIngredient`), `lib/recipes.ts`
- Pattern: Recipes can be user-created (`source: 'user'`) or imported from external APIs (`'themealdb'`, `'spoonacular'`). Personal collection = own recipes + bookmarked recipes.
- Purpose: Associates a recipe with a date and meal type (breakfast/lunch/dinner/snack) for a household
- Examples: `types/database.ts` (`MealPlan`, `MealPlanWithRecipe`), `lib/meal-plans.ts`
- Pattern: Join table between recipes and calendar dates; supports serving count override
- Purpose: Aggregates equivalent ingredients for shopping lists (e.g., "diced onion" + "yellow onion" -> "onion")
- Examples: `lib/ingredient-normalize.ts`, `lib/ingredient-categories.ts`
- Pattern: Client-side normalization at display time; also a DB-side trigger populating `normalized_ingredients` column
## Entry Points
- Location: `app/_layout.tsx`
- Triggers: Expo Router loads this as root layout
- Responsibilities: Wraps entire app in `ErrorBoundary` > `ThemeProvider` > `AuthProvider` > `ThemeRoot`, then renders auth-aware `RootLayoutNav` which redirects based on session state
- Location: `app/index.tsx`
- Triggers: Initial route resolution
- Responsibilities: Redirects to `/(app)` or `/(auth)/login` based on session; shows loading spinner during session check
- Location: `app/(app)/_layout.tsx`
- Triggers: After successful authentication
- Responsibilities: Wraps tabs in `HomeProvider`, renders tab navigator with `CustomTabBar`, handles household loading/error states
- Location: `lib/supabase.ts`
- Triggers: Imported by all `lib/` modules and `contexts/AuthContext.tsx`
- Responsibilities: Creates single Supabase client with `AsyncStorage` for session persistence; reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from env
## Error Handling
- **Data layer (`lib/`):** Most functions `throw error` on Supabase failures. Exceptions: `getAllRecipes()`, `getRecipesPage()`, `getSavedRecipeIds()` return empty arrays/sets on error for graceful degradation.
- **Auth layer (`lib/auth.ts`):** Email auth returns `{ success: boolean, error?: string }` result objects with user-friendly mapped error messages via `mapAuthError()`. OAuth functions throw directly.
- **Screen components:** Catch errors in `useCallback` data loaders, store in local `useState` error state, display retry UI (e.g., "Tap to retry" pressable).
- **Context providers:** `HomeContext` catches errors and exposes `error` string + `refresh()` function for retry. `AuthContext` does not surface errors.
- **Global:** `ErrorBoundary` component wraps the entire app in `app/_layout.tsx`.
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
