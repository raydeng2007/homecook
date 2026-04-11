# Coding Conventions

**Analysis Date:** 2026-03-26

## Naming Patterns

**Files:**
- Components: PascalCase, one component per file (e.g., `components/MealPlanCard.tsx`, `components/RecipeForm.tsx`)
- Screens/routes: kebab-case following Expo Router convention (e.g., `app/(auth)/email-sign-in.tsx`)
- Library modules: kebab-case (e.g., `lib/meal-plans.ts`, `lib/ingredient-categories.ts`)
- Hooks: camelCase with `use` prefix (e.g., `hooks/useThemeColors.ts`)
- Types: kebab-case (e.g., `types/database.ts`)
- Contexts: PascalCase (e.g., `contexts/AuthContext.tsx`, `contexts/HomeContext.tsx`)

**Functions:**
- camelCase for all functions: `getRecipes`, `signInWithEmail`, `formatDateKey`
- Async data functions: verb-first naming (`getRecipes`, `createRecipe`, `removeMealPlan`)
- Event handlers in components: `handle` prefix (`handleSignIn`, `handleRemoveMeal`, `handleRecipePress`)
- Validators return `string | null` (error message or null): `validateEmail`, `validatePassword`

**Variables:**
- camelCase for all local variables and state
- UPPER_SNAKE_CASE for module-level constants: `MEAL_TYPE_LABELS`, `TAB_CONFIG`, `PAGE_SIZE`, `THEME_STORAGE_KEY`
- Boolean state uses `is` prefix: `isLoading`, `isDisabled`, `isDark`

**Types:**
- Use `interface` for database entities and component props: `interface Recipe`, `interface LoadingButtonProps`
- Use `type` for unions, context types, and input types: `type MealType`, `type AuthContextType`, `type CreateRecipeInput`
- Use `Partial<>`, `Pick<>`, `Omit<>`, `Record<>` utility types where appropriate
- Props types defined above the component, named `{ComponentName}Props` or inline `type` alias

## Code Style

**Formatting:**
- No Prettier or ESLint config detected. Formatting is manual/IDE-driven.
- 2-space indentation
- Single quotes for strings
- Trailing semicolons used consistently
- Template literals for string interpolation

**Linting:**
- No linter configured. TypeScript strict mode (`"strict": true` in `tsconfig.json`) serves as the primary code quality gate.
- Type checking command: `npx tsc --noEmit`

## Import Organization

**Order:**
1. React / React Native imports (`react`, `react-native`, `expo-*`)
2. Third-party libraries (`@supabase/supabase-js`, `expo-router`, `@expo/vector-icons`)
3. Internal aliases using `@/` prefix (`@/components/*`, `@/lib/*`, `@/contexts/*`, `@/hooks/*`, `@/types/*`)

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- Always use `@/` for internal imports. Never use relative `../` paths across directories.

**Import style:**
- Named imports preferred: `import { supabase } from '@/lib/supabase'`
- `import type` used for type-only imports: `import type { Recipe } from '@/types/database'`
- Default exports for screen components and major components
- Named exports for reusable utilities: `export function FormInput`, `export function LoadingButton`

## Component Patterns

**Functional components only.** One exception: `components/ErrorBoundary.tsx` uses a class component (required by React error boundary API).

**Screen components:**
```typescript
// Default export, named {Screen}Screen
export default function HomeScreen() {
  // 1. Hooks (context, router, theme)
  const { home } = useHome();
  const router = useRouter();
  const { statusBarStyle, primary } = useThemeColors();

  // 2. Local state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // 3. Callbacks (useCallback for data loading)
  const loadData = useCallback(async () => { ... }, [deps]);

  // 4. Effects
  useEffect(() => { loadData(); }, [loadData]);

  // 5. Event handlers
  const handlePress = () => { ... };

  // 6. Return JSX
  return ( ... );
}
```

**Reusable components:**
```typescript
// Props type defined above component
type MealPlanCardProps = {
  mealPlan: MealPlanWithRecipe;
  onDelete: (id: string) => void;
};

// Default export for standalone components
export default function MealPlanCard({ mealPlan, onDelete }: MealPlanCardProps) {
  const { textDisabled } = useThemeColors();
  return ( ... );
}

// Named export for small utility components
export function LoadingButton({ title, onPress, isLoading }: LoadingButtonProps) { ... }
```

**Props pattern:**
- Destructure props in function signature
- Use `Pick<>` to select specific fields from database types for props
- Optional props use `?` suffix with defaults via `= false`

## Styling Approach

**Primary:** NativeWind v4 `className` prop on all React Native components. Never use `StyleSheet.create`.

**Theme system:**
- CSS custom properties (vars) defined in `contexts/ThemeContext.tsx` for dark/light modes
- Tailwind config in `tailwind.config.js` references `var(--color-*)` for theme-aware colors
- `useThemeColors()` hook from `hooks/useThemeColors.ts` provides raw color strings for non-className props (icons, `placeholderTextColor`, `StatusBar`)

**Global utility classes** in `global.css`:
- Layout: `screen` (flex-1 + bg-background)
- Cards: `card`, `card-elevated`
- Buttons: `btn-primary`, `btn-secondary`, `btn-outline`, `btn-error`
- Typography: `heading-1`, `heading-2`, `body-text`, `body-text-medium`, `muted-text`, `disabled-text`
- Input: `input`
- Chips: `pill-chip`, `pill-chip-active`
- Search: `search-bar`
- Decorative: `section-heading`, `section-divider`

**Color palette ("Bordeaux & Champagne"):**
- Primary: `#D9B991` (champagne gold) - use `bg-primary`, `text-primary`
- Secondary: `#8B3A3A` (dusty bordeaux) - use `bg-secondary`, `text-secondary`
- Error: `#E07A5F` (warm terracotta) - use `bg-error`, `text-error`
- Surfaces: `bg-surface-1` through `bg-surface-5` (progressively lighter)
- Text: `text-text-high` (90% opacity), `text-text-medium` (62%), `text-text-disabled` (38%)
- Borders: `border-border-subtle`, `border-border-card`, `border-border-focus`
- Never hardcode hex values in components. Use Tailwind tokens or `useThemeColors()`.

**Conditional styling pattern:**
```typescript
className={`base-classes ${condition ? 'active-classes' : 'inactive-classes'}`}
```

**Inline `style` prop:** Only used when NativeWind cannot handle the value (e.g., dynamic colors from JS variables like `style={{ color: mealColor }}`).

## Error Handling

**Data layer (`lib/*.ts`):**
- Most functions throw on error: `if (error) throw error;`
- Some return empty arrays on error for non-critical queries (e.g., `getAllRecipes` returns `[]`)
- Auth functions return result objects: `{ success: boolean; error?: string }` instead of throwing
- Auth errors mapped to user-friendly messages via `mapAuthError()` in `lib/auth.ts`

**Screen/component level:**
- try/catch around async operations
- Error state stored in component: `const [error, setError] = useState<string | null>(null)`
- User feedback via `Alert.alert()` for destructive action failures
- Inline error text for form validation
- Loading states tracked with `isLoading` boolean

**Global error boundary:**
- `components/ErrorBoundary.tsx` wraps the root layout
- Catches unexpected React crashes and shows a recovery screen
- Uses inline styles (not NativeWind) since it must render without theme context

**Validation:**
- `lib/validation.ts` provides pure validator functions
- Pattern: `validateX(value): string | null` - returns error string or null
- Form-level validation calls all field validators, sets per-field error state

## State Management

**React Context only.** No Redux, Zustand, or other state libraries.

**Three contexts:**
1. `contexts/AuthContext.tsx` - Supabase session, provides `useAuth()` hook
2. `contexts/HomeContext.tsx` - Current household, provides `useHome()` hook
3. `contexts/ThemeContext.tsx` - Dark/light mode, provides `useTheme()` hook

**Context pattern:**
```typescript
// 1. Define type
type FooContextType = { ... };

// 2. Create with defaults
const FooContext = createContext<FooContextType>({ ... });

// 3. Provider component with state
export function FooProvider({ children }: { children: React.ReactNode }) {
  // state + effects
  return <FooContext.Provider value={...}>{children}</FooContext.Provider>;
}

// 4. Hook accessor (one-liner)
export const useFoo = () => useContext(FooContext);
```

**Local state:**
- `useState` for UI state (forms, loading, selected items)
- `useCallback` for async data-loading functions passed to `useEffect`
- No `useReducer` usage detected

## Logging

**Framework:** `console` only (no structured logging library)

**Patterns:**
- Minimal logging. Most errors are either thrown or shown to user via UI.
- `componentDidCatch` in `ErrorBoundary.tsx` has a comment placeholder for Sentry integration.
- No debug logging in data layer functions.

## Comments

**When to comment:**
- JSDoc on exported data-layer functions: `/** Get all recipes for a home, newest first. */`
- Section dividers with `// ===...===` banner comments to separate logical sections within a file
- Inline comments for non-obvious logic or workarounds
- `// TODO` / `// FIXME` for known issues

**JSDoc/TSDoc:**
- Used on `lib/*.ts` exported functions consistently
- Not used on component props (types are self-documenting)
- Format: `/** Single-line description. */` for most functions

## Function Design

**Size:** Functions are small and focused. Screen components are the largest files.

**Parameters:**
- Input objects for create/update operations: `CreateRecipeInput`, `CreateMealPlanInput`
- Primitive params for simple queries: `getRecipe(id: string)`
- Destructured props for components

**Return Values:**
- Data layer: Promise of typed entity (`Promise<Recipe>`, `Promise<MealPlan[]>`)
- Void for delete operations: `Promise<void>`
- Auth: Result objects `{ success, error?, needsEmailConfirmation? }`
- Validators: `string | null`

## Module Design

**Exports:**
- Default exports for screen components and major UI components
- Named exports for utility components (`FormInput`, `LoadingButton`, `SocialLoginButton`)
- Named exports for all `lib/*.ts` functions
- Named exports for types in `types/database.ts`

**Barrel Files:** Not used. Import directly from the source file.

**Data layer modules (`lib/*.ts`):**
- One module per domain: `recipes.ts`, `meal-plans.ts`, `homes.ts`, `auth.ts`
- Each module imports supabase client and relevant types
- Pure async functions, no internal state

---

*Convention analysis: 2026-03-26*
