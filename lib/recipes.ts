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
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Recipes] getAllRecipes failed:', error.message);
    return [];
  }
  return (data ?? []) as Recipe[];
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
