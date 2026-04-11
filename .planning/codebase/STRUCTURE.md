# Codebase Structure

**Analysis Date:** 2026-03-26

## Directory Layout

```
homecook/
├── app/                    # Expo Router file-based routes (screens + layouts)
│   ├── _layout.tsx         # Root layout (providers + auth redirect)
│   ├── index.tsx           # Root redirect (auth-aware)
│   ├── (auth)/             # Unauthenticated route group
│   │   ├── _layout.tsx     # Stack navigator for auth screens
│   │   ├── login.tsx       # Login screen (OAuth + email options)
│   │   ├── email-sign-in.tsx
│   │   ├── email-sign-up.tsx
│   │   └── email-confirmation.tsx
│   └── (app)/              # Authenticated route group
│       ├── _layout.tsx     # Tab navigator with HomeProvider
│       ├── index.tsx       # Home tab (calendar + meal plans)
│       ├── planner.tsx     # Planner screen (hidden from tabs)
│       ├── shopping.tsx    # Shopping list tab
│       ├── household.tsx   # Household management tab
│       └── recipes/        # Nested stack for recipe navigation
│           ├── _layout.tsx # Stack navigator
│           ├── index.tsx   # Recipe list (personal + public tabs)
│           ├── create.tsx  # Create recipe form
│           ├── [id].tsx    # Recipe detail view
│           └── edit.tsx    # Edit recipe form
├── components/             # Shared UI components
├── contexts/               # React Context providers
├── hooks/                  # Custom React hooks
├── lib/                    # Data layer + utilities
├── types/                  # TypeScript type definitions
├── assets/                 # Static assets (images, fonts)
├── scripts/                # One-off admin/migration scripts
├── legal/                  # Legal documents (privacy, terms)
├── website/                # Marketing/landing page site
├── .maestro/               # E2E test flows (Maestro)
├── global.css              # Tailwind base + custom utility classes
├── tailwind.config.js      # Theme configuration (colors, spacing)
├── app.json                # Expo app configuration
├── eas.json                # EAS Build configuration
├── tsconfig.json           # TypeScript configuration
├── babel.config.js         # Babel configuration (NativeWind preset)
└── package.json            # Dependencies + scripts
```

## Directory Purposes

**`app/`:**
- Purpose: All screens and navigation layouts (Expo Router file-based routing)
- Contains: Route layouts (`_layout.tsx`), screen components, route groups `(auth)` and `(app)`
- Key files: `app/_layout.tsx` (root providers), `app/(app)/_layout.tsx` (tab navigator), `app/(app)/index.tsx` (home screen)

**`components/`:**
- Purpose: Reusable UI components shared across screens
- Contains: 20 component files -- calendars, cards, modals, form inputs, navigation
- Key files:
  - `components/CustomTabBar.tsx` -- Bottom tab bar
  - `components/MonthCalendarGrid.tsx` -- Month calendar view
  - `components/WeekCalendarStrip.tsx` -- Week calendar strip
  - `components/AddMealModal.tsx` -- Modal for adding meals to dates
  - `components/RecipeForm.tsx` -- Shared create/edit recipe form
  - `components/RecipeHeroCard.tsx` -- Large recipe card with image
  - `components/RecipeThumbCard.tsx` -- Small recipe card thumbnail
  - `components/MealPlanCard.tsx` -- Meal plan display card
  - `components/ServingStepper.tsx` -- Serving count stepper
  - `components/NutritionBadges.tsx` -- Calorie/serving badges
  - `components/ErrorBoundary.tsx` -- Global error boundary
  - `components/FormInput.tsx` -- Reusable text input
  - `components/LoadingButton.tsx` -- Button with loading state
  - `components/SocialLoginButton.tsx` -- OAuth provider button
  - `components/HexagonShape.tsx` -- Hexagonal date selector shape
  - `components/CategoryChips.tsx` -- Category filter chips
  - `components/MealTypeTabBar.tsx` -- Meal type tab selector
  - `components/IngredientRow.tsx` -- Dynamic ingredient input row
  - `components/RecipeDiaryCard.tsx` -- Recipe diary entry card
  - `components/RecipeImage.tsx` -- Recipe image with fallback

**`contexts/`:**
- Purpose: Global state via React Context providers
- Contains: Three context files
- Key files:
  - `contexts/AuthContext.tsx` -- Supabase session tracking, exposes `useAuth()`
  - `contexts/HomeContext.tsx` -- Household auto-setup, exposes `useHome()`
  - `contexts/ThemeContext.tsx` -- Dark/light mode with persistence, exposes `useTheme()`

**`hooks/`:**
- Purpose: Custom React hooks
- Contains: One hook file
- Key files: `hooks/useThemeColors.ts` -- Raw color strings for non-className props (icons, status bar)

**`lib/`:**
- Purpose: Data access layer (Supabase CRUD) and pure utility functions
- Contains: 10 modules
- Key files:
  - `lib/supabase.ts` -- Supabase client singleton (reads env vars)
  - `lib/auth.ts` -- Auth functions (Google, Facebook, Email sign-in/sign-up/sign-out)
  - `lib/recipes.ts` -- Recipe CRUD (`getRecipes`, `getRecipe`, `createRecipe`, `updateRecipe`, `deleteRecipe`, `getAllRecipes`, `getRecipesPage`, `getPersonalRecipes`)
  - `lib/meal-plans.ts` -- Meal plan queries (`getMealPlansForMonth`, `getMealPlansForDate`, `getMealPlansForRange`, `addMealPlan`, `removeMealPlan`)
  - `lib/homes.ts` -- Household CRUD (`getOrCreateHome`, `getHomeMembers`, `updateHomeName`, `joinHomeByCode`, `leaveHome`, `deleteAccount`)
  - `lib/saved-recipes.ts` -- Bookmark operations (`getSavedRecipeIds`, `saveRecipe`, `unsaveRecipe`)
  - `lib/validation.ts` -- Form validators
  - `lib/ingredient-normalize.ts` -- Ingredient name normalization (synonym resolution, depluralization, prep word stripping)
  - `lib/ingredient-categories.ts` -- Category detection for shopping list grouping
  - `lib/portion-scaling.ts` -- Serving scaling with fraction formatting
  - `lib/recipe-visuals.ts` -- Deterministic gradient colors + emoji for recipes without images

**`types/`:**
- Purpose: TypeScript type definitions for all database entities
- Contains: One file
- Key files: `types/database.ts` -- Interfaces (`Home`, `HomeMember`, `Recipe`, `Ingredient`, `NormalizedIngredient`, `MealPlan`, `MealPlanWithRecipe`, `MealPlanWithFullRecipe`, `SavedRecipe`), input types (`CreateRecipeInput`, `UpdateRecipeInput`, `CreateMealPlanInput`), display helpers (`MEAL_TYPE_LABELS`, `MEAL_TYPE_COLORS`)

**`scripts/`:**
- Purpose: One-off admin scripts for data import and database migrations
- Contains: Migration SQL files, import scripts, admin utilities
- Key files:
  - `scripts/import-spoonacular.ts` -- Import recipes from Spoonacular API
  - `scripts/import-themealdb.ts` -- Import recipes from TheMealDB API
  - `scripts/ingredient-normalizer.ts` -- Batch normalize ingredient names
  - `scripts/run-migration.ts` -- Run SQL migrations against Supabase
  - `scripts/fix-rls.ts` -- RLS policy management
  - `scripts/supabase-admin.ts` -- Supabase admin client setup
  - `scripts/migration-003-public-recipes.sql` through `scripts/migration-008-ingredient-normalization.sql` -- SQL migration files

**`assets/`:**
- Purpose: Static assets (images, icons)
- Generated: No
- Committed: Yes

**`website/`:**
- Purpose: Marketing/landing page (separate from the mobile app)
- Contains: Static site deployed to Vercel
- Committed: Yes

**`.maestro/`:**
- Purpose: E2E test flows using Maestro testing framework
- Generated: No
- Committed: Yes (untracked currently)

## Key File Locations

**Entry Points:**
- `app/_layout.tsx`: Root layout -- provider tree + auth-aware routing
- `app/index.tsx`: Root redirect based on auth state
- `lib/supabase.ts`: Supabase client initialization

**Configuration:**
- `tailwind.config.js`: Theme colors, spacing, typography
- `app.json`: Expo app config (name, slug, SDK version)
- `eas.json`: EAS Build profiles
- `tsconfig.json`: TypeScript compiler options
- `babel.config.js`: Babel + NativeWind preset
- `global.css`: Tailwind directives + custom utility classes (`card`, `btn-primary`, `heading-1`, `screen`)

**Core Logic:**
- `lib/recipes.ts`: All recipe data operations
- `lib/meal-plans.ts`: All meal plan data operations
- `lib/homes.ts`: Household management + RPC calls
- `lib/auth.ts`: All authentication flows

**Testing:**
- `.maestro/`: E2E test flows (Maestro framework)
- No unit test files detected in the codebase

## Naming Conventions

**Files:**
- Components: PascalCase (`RecipeForm.tsx`, `AddMealModal.tsx`, `CustomTabBar.tsx`)
- Lib modules: kebab-case (`meal-plans.ts`, `ingredient-normalize.ts`, `recipe-visuals.ts`)
- Route files: kebab-case (`email-sign-in.tsx`, `email-sign-up.tsx`) or index/layout convention
- Contexts: PascalCase (`AuthContext.tsx`, `HomeContext.tsx`, `ThemeContext.tsx`)
- Hooks: camelCase with `use` prefix (`useThemeColors.ts`)
- Types: camelCase (`database.ts`)
- Config: Standard names (`tailwind.config.js`, `tsconfig.json`)

**Directories:**
- Lowercase, sometimes kebab-case
- Route groups use Expo Router parenthetical syntax: `(auth)`, `(app)`

## Where to Add New Code

**New Screen:**
- Auth screen: `app/(auth)/new-screen.tsx`
- Authenticated tab screen: `app/(app)/new-screen.tsx` (add to tab config in `app/(app)/_layout.tsx` and `components/CustomTabBar.tsx`)
- Recipe sub-screen: `app/(app)/recipes/new-screen.tsx` (auto-included in recipes stack)

**New Component:**
- All components: `components/NewComponent.tsx` (PascalCase, one component per file)
- Use NativeWind `className` for styling, never `StyleSheet.create`

**New Data Function:**
- Supabase CRUD: Add to existing `lib/` module or create `lib/new-entity.ts` (kebab-case)
- Pure utility: Create `lib/utility-name.ts`
- Always import types from `@/types/database.ts`

**New Type:**
- Database entity: Add interface to `types/database.ts`
- Component props: Define inline or in the component file

**New Context:**
- Create `contexts/NewContext.tsx` with Provider + `useNew()` hook
- Add Provider to the provider tree in `app/_layout.tsx` (global) or `app/(app)/_layout.tsx` (authenticated only)

**New Hook:**
- Create `hooks/useNewHook.ts` (camelCase with `use` prefix)

**New Migration:**
- SQL file: `scripts/migration-NNN-description.sql`
- Run script: Use `scripts/run-migration.ts`

## Special Directories

**`dist/`:**
- Purpose: Build output
- Generated: Yes (by Expo/Metro bundler)
- Committed: No (should be gitignored)

**`node_modules/`:**
- Purpose: Package dependencies
- Generated: Yes (by npm install)
- Committed: No

**`.expo/`:**
- Purpose: Expo development cache
- Generated: Yes
- Committed: No

**`website/.vercel/`:**
- Purpose: Vercel deployment config
- Generated: Yes
- Committed: Unclear (exists in tree)

---

*Structure analysis: 2026-03-26*
