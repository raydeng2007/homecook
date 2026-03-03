import { supabase } from './supabase';

/**
 * Get all saved recipe IDs for a user.
 */
export async function getSavedRecipeIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('saved_recipes')
    .select('recipe_id')
    .eq('user_id', userId);

  // Gracefully return empty set if table doesn't exist yet
  if (error) {
    console.warn('[SavedRecipes] Query failed (table may not exist yet):', error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.recipe_id));
}

/**
 * Save (bookmark) a recipe.
 */
export async function saveRecipe(userId: string, recipeId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_recipes')
    .upsert({ user_id: userId, recipe_id: recipeId }, { onConflict: 'user_id,recipe_id' });

  if (error) throw error;
}

/**
 * Unsave (remove bookmark) a recipe.
 */
export async function unsaveRecipe(userId: string, recipeId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_recipes')
    .delete()
    .eq('user_id', userId)
    .eq('recipe_id', recipeId);

  if (error) throw error;
}
