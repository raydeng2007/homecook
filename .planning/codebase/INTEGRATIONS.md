# External Integrations

**Analysis Date:** 2026-03-26

## APIs & External Services

**Supabase (Primary Backend):**
- Purpose: Authentication, PostgreSQL database, Row Level Security, server-side RPC functions
- SDK: `@supabase/supabase-js` 2.93.1
- Client singleton: `lib/supabase.ts`
- Auth env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Admin client (scripts only): `scripts/supabase-admin.ts`

**TheMealDB (Recipe Import):**
- Purpose: Bulk recipe data import for public cookbook
- Script: `scripts/import-themealdb.ts`
- Integration type: One-time data import script (not runtime)
- Source tracking: Recipes tagged with `source: 'themealdb'` in `types/database.ts`

**Spoonacular (Recipe Import):**
- Purpose: Bulk recipe data import for public cookbook
- Script: `scripts/import-spoonacular.ts`
- Progress tracking: `scripts/.spoonacular-progress.json`
- Integration type: One-time data import script (not runtime)
- Source tracking: Recipes tagged with `source: 'spoonacular'` in `types/database.ts`

## Data Storage

**Database:**
- Provider: Supabase PostgreSQL (hosted)
- Client: `@supabase/supabase-js` (no ORM)
- Connection: via `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Tables (inferred from code):
  - `homes` - Households (`lib/homes.ts`)
  - `home_members` - Household membership with roles (`lib/homes.ts`)
  - `recipes` - Recipe data with ingredients as JSONB (`lib/recipes.ts`)
  - `meal_plans` - Date-based meal assignments (`lib/meal-plans.ts`)
  - `saved_recipes` - User bookmarks (`lib/saved-recipes.ts`)
- RPC Functions (server-side):
  - `get_or_create_home` - Atomic home creation (`lib/homes.ts`)
  - `join_home_by_code` - Invite code redemption (`lib/homes.ts`)
  - `regenerate_invite_code` - Invite code rotation (`lib/homes.ts`)
  - `leave_home` - Household departure (`lib/homes.ts`)
  - `delete_user_account` - Full account deletion (`lib/homes.ts`)
- Migrations: `scripts/migration-001-recipe-imports.sql` through `scripts/migration-008-ingredient-normalization.sql`

**Local Storage:**
- `@react-native-async-storage/async-storage`
- Used for:
  - Supabase session persistence (`lib/supabase.ts` - configured as auth storage adapter)
  - Theme preference (`contexts/ThemeContext.tsx` - key `@homecook_theme`)

**File Storage:**
- No Supabase Storage integration detected
- Recipe images use external URLs (`image_url` field on recipes, populated from TheMealDB/Spoonacular imports)

**Caching:**
- None (no Redis, no in-memory cache layer)
- All data fetched fresh from Supabase on each screen load

## Authentication & Identity

**Auth Provider: Supabase Auth**
- Implementation: `lib/auth.ts`, `contexts/AuthContext.tsx`
- Session management: `AuthProvider` wraps entire app (`app/_layout.tsx`)
- Session state: React Context via `useAuth()` hook

**OAuth Providers:**
- Google OAuth (`lib/auth.ts` - `signInWithGoogle()`)
  - Flow: `supabase.auth.signInWithOAuth({ provider: 'google' })` with `expo-web-browser`
  - Redirect: `makeRedirectUri()` from `expo-auth-session`
  - Token exchange: Extracts `access_token` + `refresh_token` from redirect URL (hash or query params)
- Facebook OAuth (`lib/auth.ts` - `signInWithFacebook()`)
  - Flow: Identical pattern to Google
  - Same redirect URI and token extraction logic

**Email/Password Auth:**
- Sign up: `signUpWithEmail()` in `lib/auth.ts` - uses `supabase.auth.signUp()`
- Sign in: `signInWithEmail()` in `lib/auth.ts` - uses `supabase.auth.signInWithPassword()`
- Email confirmation: `resendConfirmationEmail()` in `lib/auth.ts`
- Error mapping: `mapAuthError()` translates Supabase error messages to user-friendly strings

**Session Lifecycle:**
- Auto-refresh: enabled (`autoRefreshToken: true` in `lib/supabase.ts`)
- Persistence: AsyncStorage (`persistSession: true`)
- URL detection: disabled (`detectSessionInUrl: false` - manual token extraction instead)
- Auth state listener: `supabase.auth.onAuthStateChange()` in `contexts/AuthContext.tsx`

**Sign Out:**
- `signOut()` in `lib/auth.ts` - calls `supabase.auth.signOut()`

## API Patterns

**Data Access Pattern: Direct Supabase Client**
- All database operations use the Supabase JS client directly (no REST API wrapper, no GraphQL)
- Query builder pattern: `supabase.from('table').select().eq().order()`
- Joins via PostgREST syntax: `recipe:recipes!recipe_id (id, title, ...)`
- Server functions via RPC: `supabase.rpc('function_name', { params })`

**Error Handling:**
- Most lib functions throw on error: `if (error) throw error;`
- Some functions return empty arrays on failure: `getAllRecipes()` returns `[]` on error
- Auth functions return result objects: `{ success: boolean; error?: string }`
- Error codes checked for graceful fallback: `error?.code === '42703'` for missing columns (`lib/meal-plans.ts`)

**Data Flow:**
1. Screen mounts -> calls lib function (e.g., `getRecipes(homeId)`)
2. Lib function queries Supabase directly
3. Response cast to TypeScript types from `types/database.ts`
4. Data returned to component for rendering

**Pagination:**
- `getRecipesPage()` in `lib/recipes.ts` - offset-based pagination with `.range(from, to)`
- Page size: 20 recipes per page
- Returns `{ recipes, hasMore, total }` for infinite scroll

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Bugsnag, or similar)

**Logs:**
- No structured logging framework
- Console-based only (implicit)

**Analytics:**
- None detected

## CI/CD & Deployment

**Hosting:**
- Mobile: EAS Build (Expo Application Services) for iOS and Android
- Backend: Supabase hosted (managed PostgreSQL + Auth)
- Web: Expo web build (Metro bundler)

**CI Pipeline:**
- None detected (no `.github/workflows/`, no `Jenkinsfile`, no CI config files)

**E2E Testing:**
- Maestro test flows present in `.maestro/` directory (untracked)

**Build Profiles (`eas.json`):**
- `development` - Dev client with simulator support
- `preview` - Internal distribution (APK for Android, device build for iOS)
- `production` - Auto-incrementing version numbers

## Environment Configuration

**Required env vars:**
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL (`lib/supabase.ts`)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key (`lib/supabase.ts`)

**Script-only env vars (not needed at runtime):**
- Admin Supabase credentials used by `scripts/supabase-admin.ts` for migrations and data imports

**Secrets location:**
- `.env` file in project root (gitignored)
- OAuth provider configuration managed in Supabase Dashboard (Google, Facebook)

**Deep Linking:**
- Custom URL scheme: `homecook://` (configured in `app.json` as `"scheme": "homecook"`)
- Used for OAuth redirect callbacks

## Webhooks & Callbacks

**Incoming:**
- OAuth redirect callback via deep link (`homecook://` scheme)
- Handled by `createSessionFromUrl()` in `lib/auth.ts`

**Outgoing:**
- None detected

## Database Schema (Supabase Tables)

**Core Tables:**
| Table | Primary Key | Key Columns | Used In |
|-------|------------|-------------|---------|
| `homes` | `id` (uuid) | `name`, `invite_code`, `created_by` | `lib/homes.ts` |
| `home_members` | `id` (uuid) | `home_id`, `user_id`, `role` | `lib/homes.ts` |
| `recipes` | `id` (uuid) | `home_id`, `title`, `ingredients` (jsonb), `source`, `normalized_ingredients` | `lib/recipes.ts` |
| `meal_plans` | `id` (uuid) | `home_id`, `recipe_id`, `date`, `meal_type`, `servings` | `lib/meal-plans.ts` |
| `saved_recipes` | `id` (uuid) | `user_id`, `recipe_id` | `lib/saved-recipes.ts` |

**RPC Functions:**
| Function | Purpose | Called From |
|----------|---------|-------------|
| `get_or_create_home` | Atomic home creation (SECURITY DEFINER) | `lib/homes.ts` |
| `join_home_by_code` | Invite code join with old home cleanup | `lib/homes.ts` |
| `regenerate_invite_code` | Owner action to rotate invite code | `lib/homes.ts` |
| `leave_home` | Leave household, create new personal home | `lib/homes.ts` |
| `delete_user_account` | Full account and data deletion | `lib/homes.ts` |

---

*Integration audit: 2026-03-26*
