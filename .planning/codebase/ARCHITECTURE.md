# Architecture

**Analysis Date:** 2026-03-26

## Pattern Overview

**Overall:** Client-side React Native mobile app with BaaS (Backend-as-a-Service) via Supabase

**Key Characteristics:**
- Single-codebase mobile app using Expo (iOS, Android, Web)
- No custom backend server -- all server logic lives in Supabase (Postgres + Auth + RPC functions)
- File-based routing via Expo Router v4 with route groups for auth/app separation
- React Context for global state (auth session, household, theme)
- Data layer is a thin async function wrapper around the Supabase JS client
- Multi-tenant by household: all data queries are scoped to `home_id`

## Layers

**Routing / Screens (`app/`):**
- Purpose: Screen-level components that compose UI from shared components and call data functions
- Location: `app/`
- Contains: Route layouts, screen components, navigation configuration
- Depends on: `components/`, `contexts/`, `lib/`, `hooks/`, `types/`
- Used by: Expo Router (entry point: `expo-router/entry` via `package.json` `"main"`)

**Shared Components (`components/`):**
- Purpose: Reusable presentational and container components
- Location: `components/`
- Contains: UI widgets (calendars, cards, modals, form inputs, tab bars)
- Depends on: `contexts/`, `hooks/`, `lib/`, `types/`
- Used by: Screen components in `app/`

**State / Context (`contexts/`):**
- Purpose: Global state management via React Context + Provider pattern
- Location: `contexts/`
- Contains: Three providers -- `AuthContext`, `HomeContext`, `ThemeContext`
- Depends on: `lib/supabase.ts`, `lib/homes.ts`, `@react-native-async-storage/async-storage`
- Used by: All screens and components via `useAuth()`, `useHome()`, `useTheme()` hooks

**Data Layer (`lib/`):**
- Purpose: All Supabase interactions -- CRUD operations, auth flows, utility functions
- Location: `lib/`
- Contains: Async functions that wrap `supabase` client calls, plus pure utility modules
- Depends on: `lib/supabase.ts` (singleton client), `types/database.ts`
- Used by: Screen components and contexts

**Hooks (`hooks/`):**
- Purpose: Custom React hooks for cross-cutting concerns
- Location: `hooks/`
- Contains: `useThemeColors.ts` -- provides raw color strings for non-className props
- Depends on: `contexts/ThemeContext.tsx`
- Used by: Any component needing theme colors in JS (icons, status bar, etc.)

**Types (`types/`):**
- Purpose: TypeScript interfaces for all database entities and input types
- Location: `types/`
- Contains: `database.ts` -- all entity types, input types, display helper constants
- Depends on: Nothing
- Used by: All layers

## Data Flow

**Screen Data Loading (typical pattern):**

1. Screen component mounts and reads `home.id` from `useHome()` context
2. Screen calls async function from `lib/` (e.g., `getMealPlansForDate(home.id, date)`)
3. `lib/` function calls Supabase client with query parameters
4. Result stored in component-local `useState`
5. Re-fetches triggered by dependency changes in `useCallback` + `useEffect`

Example from `app/(app)/index.tsx`:
```
useHome() -> home.id -> getMealPlansForDate(home.id, dateKey) -> setMealPlans(data)
```

**Auth Flow:**

1. `AuthProvider` in `app/_layout.tsx` calls `supabase.auth.getSession()` on mount
2. Subscribes to `supabase.auth.onAuthStateChange()` for real-time session updates
3. `RootLayoutNav` reads `session` from `useAuth()` and redirects:
   - No session + not in auth group -> `/(auth)/login`
   - Has session + in auth group -> `/(app)`
4. OAuth flows (Google, Facebook) use `expo-web-browser` + `expo-auth-session`
5. Email auth uses `supabase.auth.signInWithPassword()` / `signUp()`
6. Session tokens persisted via `AsyncStorage`

**Household Initialization:**

1. `HomeProvider` wraps all authenticated tabs in `app/(app)/_layout.tsx`
2. On mount, calls `getOrCreateHome(session.user.id)` which invokes a Supabase RPC function
3. RPC function (`get_or_create_home`) is `SECURITY DEFINER` to bypass RLS
4. Returns the user's home (or creates a default one)
5. All subsequent data queries use `home.id` from `useHome()` context

**State Management:**
- **Global state:** Three React Contexts -- `AuthContext` (session), `HomeContext` (household), `ThemeContext` (dark/light mode)
- **Screen-local state:** `useState` + `useEffect` + `useCallback` for data fetching and UI state
- **No global data cache:** Each screen fetches its own data on mount/focus. No shared recipe cache or centralized store.
- **Theme persistence:** `ThemeContext` uses `AsyncStorage` to persist dark/light preference

## Key Abstractions

**Home (Household):**
- Purpose: Multi-tenant boundary -- all recipes, meal plans, and members belong to a home
- Examples: `types/database.ts` (`Home`, `HomeMember`), `lib/homes.ts`, `contexts/HomeContext.tsx`
- Pattern: Every data query filters by `home_id`; users auto-join/create a home on first login

**Recipe:**
- Purpose: Core content entity with ingredients, instructions, nutrition, and source tracking
- Examples: `types/database.ts` (`Recipe`, `Ingredient`, `NormalizedIngredient`), `lib/recipes.ts`
- Pattern: Recipes can be user-created (`source: 'user'`) or imported from external APIs (`'themealdb'`, `'spoonacular'`). Personal collection = own recipes + bookmarked recipes.

**MealPlan:**
- Purpose: Associates a recipe with a date and meal type (breakfast/lunch/dinner/snack) for a household
- Examples: `types/database.ts` (`MealPlan`, `MealPlanWithRecipe`), `lib/meal-plans.ts`
- Pattern: Join table between recipes and calendar dates; supports serving count override

**Ingredient Normalization:**
- Purpose: Aggregates equivalent ingredients for shopping lists (e.g., "diced onion" + "yellow onion" -> "onion")
- Examples: `lib/ingredient-normalize.ts`, `lib/ingredient-categories.ts`
- Pattern: Client-side normalization at display time; also a DB-side trigger populating `normalized_ingredients` column

## Entry Points

**App Entry:**
- Location: `app/_layout.tsx`
- Triggers: Expo Router loads this as root layout
- Responsibilities: Wraps entire app in `ErrorBoundary` > `ThemeProvider` > `AuthProvider` > `ThemeRoot`, then renders auth-aware `RootLayoutNav` which redirects based on session state

**Root Index:**
- Location: `app/index.tsx`
- Triggers: Initial route resolution
- Responsibilities: Redirects to `/(app)` or `/(auth)/login` based on session; shows loading spinner during session check

**Authenticated App Shell:**
- Location: `app/(app)/_layout.tsx`
- Triggers: After successful authentication
- Responsibilities: Wraps tabs in `HomeProvider`, renders tab navigator with `CustomTabBar`, handles household loading/error states

**Supabase Client Singleton:**
- Location: `lib/supabase.ts`
- Triggers: Imported by all `lib/` modules and `contexts/AuthContext.tsx`
- Responsibilities: Creates single Supabase client with `AsyncStorage` for session persistence; reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from env

## Error Handling

**Strategy:** Mixed -- some functions throw, some return empty/default values

**Patterns:**
- **Data layer (`lib/`):** Most functions `throw error` on Supabase failures. Exceptions: `getAllRecipes()`, `getRecipesPage()`, `getSavedRecipeIds()` return empty arrays/sets on error for graceful degradation.
- **Auth layer (`lib/auth.ts`):** Email auth returns `{ success: boolean, error?: string }` result objects with user-friendly mapped error messages via `mapAuthError()`. OAuth functions throw directly.
- **Screen components:** Catch errors in `useCallback` data loaders, store in local `useState` error state, display retry UI (e.g., "Tap to retry" pressable).
- **Context providers:** `HomeContext` catches errors and exposes `error` string + `refresh()` function for retry. `AuthContext` does not surface errors.
- **Global:** `ErrorBoundary` component wraps the entire app in `app/_layout.tsx`.

## Cross-Cutting Concerns

**Logging:** No structured logging framework. Uses implicit error propagation (thrown errors from Supabase). Some errors are silently swallowed (e.g., `getPersonalRecipes` ignores `ownError` and `savedError`).

**Validation:** Form validation in `lib/validation.ts`. Recipe form validation happens in `components/RecipeForm.tsx`. Auth error messages mapped in `lib/auth.ts`.

**Authentication:** Supabase Auth with three strategies -- Google OAuth, Facebook OAuth, email/password. Session managed by `AuthContext` with auto-refresh. Route protection via segment-based redirect in root layout.

**Theming:** Three-layer system:
1. `ThemeContext` provides CSS variable objects via NativeWind `vars()` for dark/light mode
2. `tailwind.config.js` references CSS variables for theme-aware colors (`var(--color-bg)`, etc.)
3. `useThemeColors()` hook provides raw color strings for non-className props (icons, status bar)

To change the color palette, update values in three places: `contexts/ThemeContext.tsx`, `hooks/useThemeColors.ts`, and `tailwind.config.js`.

**Multi-tenancy:** All data is scoped to a household (`home_id`). The `HomeContext` provides the current household. RLS policies (in progress) enforce this at the database level. Some Supabase RPC functions use `SECURITY DEFINER` to bypass RLS for bootstrap operations.

---

*Architecture analysis: 2026-03-26*
