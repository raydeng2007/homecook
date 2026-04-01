import { supabase } from './supabase';
import type {
  Recipe,
  CreateRecipeInput,
  UpdateRecipeInput,
} from '@/types/database';

/**
 * Get all recipes for a home, newest first.
 */
export async function getRecipes(homeId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('home_id', homeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Recipe[];
}

/**
 * Get ALL recipes across all homes (for Public cookbook tab).
 * Returns empty array on error instead of throwing.
 */
export async function getAllRecipes(): Promise<Recipe[]> {
  const { data, error, count } = await supabase
    .from('recipes')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 4999); // Override PostgREST default 1000-row limit

  if (error) {
    return [];
  }
  return (data ?? []) as Recipe[];
}

const PAGE_SIZE = 20;

/**
 * Get a page of recipes for infinite scroll (Public cookbook tab).
 * Returns recipes for the given page + whether more pages exist.
 */
export async function getRecipesPage(
  page: number,
  pageSize: number = PAGE_SIZE
): Promise<{ recipes: Recipe[]; hasMore: boolean; total: number }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('recipes')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return { recipes: [], hasMore: false, total: 0 };
  }

  const recipes = (data ?? []) as Recipe[];
  const total = count ?? 0;
  const hasMore = from + recipes.length < total;

  return { recipes, hasMore, total };
}

/**
 * Get the user's personal recipe collection:
 *   - Self-created recipes (source = 'user')
 *   - Bookmarked/saved recipes from the public cookbook
 * Used by the Personal tab and AddMealModal.
 */
export async function getPersonalRecipes(userId: string): Promise<Recipe[]> {
  // 1. Fetch user-created recipes
  const { data: ownData, error: ownError } = await supabase
    .from('recipes')
    .select('*')
    .eq('created_by', userId)
    .eq('source', 'user')
    .order('created_at', { ascending: false });

  if (ownError) {
    // silently ignore
  }

  // 2. Fetch bookmarked recipe IDs
  const { data: savedData, error: savedError } = await supabase
    .from('saved_recipes')
    .select('recipe_id')
    .eq('user_id', userId);

  if (savedError) {
    // silently ignore
  }

  const savedIds = (savedData ?? []).map((r) => r.recipe_id);

  // 3. Fetch bookmarked recipes (if any)
  let savedRecipes: Recipe[] = [];
  if (savedIds.length > 0) {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .in('id', savedIds)
      .order('created_at', { ascending: false });

    if (!error) {
      savedRecipes = (data ?? []) as Recipe[];
    }
  }

  // 4. Merge and deduplicate (own first, then saved)
  const seen = new Set<string>();
  const merged: Recipe[] = [];
  for (const r of [...(ownData ?? []), ...savedRecipes]) {
    if (!seen.has((r as Recipe).id)) {
      seen.add((r as Recipe).id);
      merged.push(r as Recipe);
    }
  }

  return merged;
}

/**
 * Get a single recipe by ID.
 */
export async function getRecipe(id: string): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Recipe;
}

/**
 * Create a new recipe.
 */
export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      home_id: input.home_id,
      title: input.title.trim(),
      description: input.description.trim(),
      ingredients: input.ingredients,
      instructions: input.instructions.trim(),
      calories: input.calories,
      servings: input.servings,
      created_by: input.created_by,
      image_url: input.image_url ?? null,
      category: input.category ?? null,
      source: input.source ?? 'user',
      source_id: input.source_id ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Recipe;
}

/**
 * Update an existing recipe.
 */
export async function updateRecipe(
  id: string,
  updates: UpdateRecipeInput
): Promise<Recipe> {
  const cleanUpdates: Record<string, unknown> = {};

  if (updates.title !== undefined) cleanUpdates.title = updates.title.trim();
  if (updates.description !== undefined)
    cleanUpdates.description = updates.description.trim();
  if (updates.instructions !== undefined)
    cleanUpdates.instructions = updates.instructions.trim();
  if (updates.ingredients !== undefined)
    cleanUpdates.ingredients = updates.ingredients;
  if (updates.calories !== undefined) cleanUpdates.calories = updates.calories;
  if (updates.servings !== undefined) cleanUpdates.servings = updates.servings;
  if (updates.image_url !== undefined) cleanUpdates.image_url = updates.image_url;
  if (updates.category !== undefined) cleanUpdates.category = updates.category;

  const { data, error } = await supabase
    .from('recipes')
    .update(cleanUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Recipe;
}

/**
 * Delete a recipe by ID.
 */
export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);

  if (error) throw error;
}
