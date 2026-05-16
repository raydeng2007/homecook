// ============================================================================
// Database entity types matching Supabase schema
// ============================================================================

export interface Home {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface HomeMember {
  id: string;
  home_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  /** Joined from auth.users via get_home_members_with_profiles RPC (migration 011). */
  email?: string;
  /** Joined from auth.users.raw_user_meta_data via migration 011 RPC. */
  full_name?: string;
}

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

/** Server-normalized ingredient (populated by DB trigger) */
export interface NormalizedIngredient {
  name: string;       // normalized canonical name
  raw_name: string;   // original ingredient name
  quantity: string;
  unit: string;
  category: IngredientCategory;
}

export type RecipeSource = 'user' | 'themealdb' | 'spoonacular';

export interface Recipe {
  id: string;
  home_id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string;
  calories: number | null;
  servings: number;
  image_url: string | null;
  category: string | null;
  source: RecipeSource;
  source_id: string | null;
  normalized_ingredients: NormalizedIngredient[] | null;
  created_by: string;
  created_at: string;
}

/** Canonical ingredient for the normalized ingredients lookup table */
export interface CanonicalIngredient {
  id: string;
  name: string;
  category: IngredientCategory;
  created_at: string;
}

export type IngredientCategory =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'seafood'
  | 'grains'
  | 'spices'
  | 'condiments'
  | 'baking'
  | 'canned'
  | 'frozen'
  | 'other';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlan {
  id: string;
  home_id: string;
  recipe_id: string;
  date: string; // YYYY-MM-DD
  meal_type: MealType;
  servings: number;
  created_by: string;
  created_at: string;
}

/** MealPlan with the related recipe joined */
export interface MealPlanWithRecipe extends MealPlan {
  recipe: Pick<Recipe, 'id' | 'title' | 'description' | 'calories' | 'servings' | 'image_url'>;
}

/** MealPlan with full recipe data (including ingredients) */
export interface MealPlanWithFullRecipe extends MealPlan {
  recipe: Pick<Recipe, 'id' | 'title' | 'ingredients' | 'normalized_ingredients' | 'servings'>;
}

/** A recipe the user has saved/bookmarked to their personal collection */
export interface SavedRecipe {
  id: string;
  user_id: string;
  recipe_id: string;
  saved_at: string;
}

// ============================================================================
// Input types for create/update operations
// ============================================================================

export type CreateRecipeInput = {
  home_id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string;
  calories: number | null;
  servings: number;
  created_by: string;
  image_url?: string | null;
  category?: string | null;
  source?: RecipeSource;
  source_id?: string | null;
};

export type UpdateRecipeInput = Partial<
  Omit<CreateRecipeInput, 'home_id' | 'created_by'>
>;

export type CreateMealPlanInput = {
  home_id: string;
  recipe_id: string;
  date: string;
  meal_type: MealType;
  servings: number;
  created_by: string;
};

// ============================================================================
// Meal type display helpers
// ============================================================================

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const MEAL_TYPE_COLORS: Record<MealType, string> = {
  breakfast: '#E8C088', // warm light gold
  lunch: '#8B5E3C',     // warm brown
  dinner: '#8B3A3A',    // dusty bordeaux
  snack: '#8FB88E',     // sage green
};
