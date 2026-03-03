# Homecook

A meal planning app for households built with Expo and React Native.

## Tech Stack

- **Framework**: Expo SDK 52, Expo Router v4
- **Language**: TypeScript (strict)
- **Styling**: NativeWind v4 (Tailwind for React Native)
- **Backend**: Supabase (auth, database)
- **State**: React Context (AuthContext, HomeContext)
- **Node**: v22+ (use `nvm use` before running commands)

## Project Structure

```
homecook/
├── app/
│   ├── _layout.tsx           # Root layout (AuthProvider + routing)
│   ├── index.tsx             # Root redirect (auth-aware)
│   ├── (auth)/
│   │   ├── _layout.tsx       # Auth stack
│   │   ├── login.tsx         # Login screen (Google/Facebook/Email)
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
│       ├── shopping.tsx      # Shopping list tab (placeholder)
│       └── household.tsx     # Household management tab
├── components/
│   ├── CustomTabBar.tsx      # Bottom tab bar with center "+" FAB
│   ├── MonthCalendar.tsx     # Calendar month view component
│   ├── RecipeForm.tsx        # Shared create/edit recipe form
│   ├── IngredientRow.tsx     # Dynamic ingredient input row
│   ├── MealPlanCard.tsx      # Meal plan display card
│   ├── AddMealModal.tsx      # Modal to add meal to date
│   ├── FormInput.tsx         # Reusable text input
│   ├── LoadingButton.tsx     # Button with loading state
│   └── SocialLoginButton.tsx # OAuth provider button
├── contexts/
│   ├── AuthContext.tsx        # Supabase session management
│   └── HomeContext.tsx        # Household auto-setup + provider
├── lib/
│   ├── supabase.ts           # Supabase client singleton
│   ├── auth.ts               # Auth functions (Google, Facebook, Email)
│   ├── validation.ts         # Form validators
│   ├── homes.ts              # Home/household CRUD
│   ├── recipes.ts            # Recipe CRUD
│   └── meal-plans.ts         # Meal plan queries
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
```

## Code Style

- **Styling**: Always use NativeWind `className`, never `StyleSheet.create`
- **Imports**: Use `@/` path alias (e.g., `@/components/Button`)
- **Components**: Small, focused, one component per file
- **Types**: Explicit types for props, avoid `any`

## Design System

Material Design dark theme (see `tailwind.config.js`):

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#BB86FC` | Buttons, accents, interactive |
| `secondary` | `#03DAC6` | Secondary actions, highlights |
| `background` | `#121212` | Screen backgrounds |
| `surface-1` to `surface-5` | Progressively lighter | Cards, elevation |
| `text-high` | 87% white | Primary text |
| `text-medium` | 60% white | Secondary text |
| `text-disabled` | 38% white | Disabled states |

Utility classes in `global.css`: `card`, `btn-primary`, `heading-1`, `heading-2`, `screen`

## Architecture

### Auth Flow
1. `AuthProvider` in root layout tracks Supabase session
2. `useAuth()` hook provides `session` and `isLoading`
3. Root layout redirects: no session → `/(auth)/login`, session → `/(app)`
4. Google/Facebook OAuth uses `expo-web-browser` + `makeRedirectUri()` from `expo-auth-session`

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
1. TypeScript check runs automatically via post-edit hook
2. Start web preview with `preview_start` (name: "web")
3. Take screenshots and click through the new feature to verify
4. Fix any issues found
5. Only report "done" after visual verification passes

## Current Focus

- [x] Google OAuth
- [x] Facebook OAuth
- [x] Email/password auth
- [x] Post Log-in screen: modern calendar (month view, auto-set to current date)
- [x] Bottom sticky navbar with 4 tabs + center "+" FAB button
- [x] Four tabs: Home (Calendar), Recipes (list/management), Shopping (placeholder), Household (user info + placeholder)
- [x] Recipe CRUD (Supabase tables) — create, read, update, delete with form validation
- [x] Meal planning calendar — assign recipes to dates, view daily plans, remove meals
- [x] IMPORTANT: Update to new design that looks like `design.png` in root folder, keep the functionality the same, but just reorganize the screen to make it look modern and sleek, NOTE: The design .png is in light mode, however, I want the default to be dark mode, and have an option later to switch to light mode if the user wants.
- [x] I want the dark mode to still re-use the same color pallets that's configurable and toggable
- [x] For the calander selector, I want the border or outlien of the date selector, right now it's a shaded circle, I want it to be a stlyistic, sleek and elegant and symtetrical hexagon shade instead of a circle, if you can.
- [x] Add stylistically interesting border colors, like the calander and other in "focus" elements, and don't just do black and whit eor sharp contrast, do something off-white or sometingn elegant and clena aned modern and sleek.
- [x] Shopping list: auto-generate ingredient list from week's meal plans
- [x] Household management: invite members, manage roles
- [x] Recipe search/filter
- [ ] Supabase Row Level Security (RLS) policies for multi-household support

## Bug List
- [x] Right now on the recipe / calandar view, when clicking on different dates, the "recipe" list still displays the current date's recipe, it should display the recipe planned for the day the user is clicking on the calandar for.


## Don'ts

- Don't use `StyleSheet.create` — use NativeWind
- Don't add files without checking existing patterns first
- Don't over-engineer — keep it simple
- Don't skip TypeScript types
