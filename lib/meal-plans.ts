import { supabase } from './supabase';
import type {
  MealPlan,
  MealPlanWithRecipe,
  MealPlanWithFullRecipe,
  CreateMealPlanInput,
} from '@/types/database';

/**
 * Get all meal plans for a given month (used for calendar dot indicators).
 */
export async function getMealPlansForMonth(
  homeId: string,
  year: number,
  month: number // 0-indexed
): Promise<MealPlanWithRecipe[]> {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('meal_plans')
    .select(
      `
      *,
      recipe:recipes!recipe_id (id, title, description, calories, servings, image_url)
    `
    )
    .eq('home_id', homeId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('meal_type', { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as MealPlanWithRecipe[];
}

/**
 * Get all meal plans for a specific date.
 */
export async function getMealPlansForDate(
  homeId: string,
  date: string // YYYY-MM-DD
): Promise<MealPlanWithRecipe[]> {
  const { data, error } = await supabase
    .from('meal_plans')
    .select(
      `
      *,
      recipe:recipes!recipe_id (id, title, description, calories, servings, image_url)
    `
    )
    .eq('home_id', homeId)
    .eq('date', date)
    .order('meal_type', { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as MealPlanWithRecipe[];
}

/**
 * Add a meal plan (assign recipe to a date + meal type).
 */
export async function addMealPlan(
  input: CreateMealPlanInput
): Promise<MealPlan> {
  const { data, error } = await supabase
    .from('meal_plans')
    .insert({
      home_id: input.home_id,
      recipe_id: input.recipe_id,
      date: input.date,
      meal_type: input.meal_type,
      servings: input.servings,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (error) throw error;
  return data as MealPlan;
}

/**
 * Get meal plans for a date range with full recipe data (including ingredients).
 * Used for shopping list generation.
 */
export async function getMealPlansForRange(
  homeId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
): Promise<MealPlanWithFullRecipe[]> {
  const { data, error } = await supabase
    .from('meal_plans')
    .select(
      `
      *,
      recipe:recipes!recipe_id (id, title, ingredients, servings)
    `
    )
    .eq('home_id', homeId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('meal_type', { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as MealPlanWithFullRecipe[];
}

/**
 * Remove a meal plan by ID.
 */
export async function removeMealPlan(id: string): Promise<void> {
  const { error } = await supabase.from('meal_plans').delete().eq('id', id);

  if (error) throw error;
}
