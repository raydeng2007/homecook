#!/usr/bin/env npx tsx
/**
 * Import all recipes from TheMealDB (free API, ~300 recipes).
 *
 * Usage:
 *   npx tsx scripts/import-themealdb.ts
 *
 * Requires scripts/.env with SUPABASE_URL, SUPABASE_SERVICE_KEY, HOME_ID, CREATED_BY
 */
import { supabase, TARGET_HOME_ID, TARGET_CREATED_BY } from './supabase-admin.js';
import { normalizeName, guessCategory, parseMeasure } from './ingredient-normalizer.js';

const API_BASE = 'https://www.themealdb.com/api/json/v1/1';

// ── TheMealDB Types ────────────────────────────────────────────────────

interface MealDBCategory {
  strCategory: string;
}

interface MealDBListItem {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
}

interface MealDBDetail {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  [key: string]: string | null; // strIngredient1..20, strMeasure1..20
}

// ── Helpers ─────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

function extractIngredients(meal: MealDBDetail) {
  const ingredients: { name: string; quantity: string; unit: string }[] = [];

  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();

    if (!name) break;

    const { quantity, unit } = parseMeasure(measure ?? '');
    ingredients.push({ name, quantity, unit });
  }

  return ingredients;
}

function buildDescription(meal: MealDBDetail): string {
  const parts: string[] = [];
  if (meal.strArea && meal.strArea !== 'Unknown') {
    parts.push(meal.strArea);
  }
  if (meal.strCategory) {
    parts.push(meal.strCategory.toLowerCase());
  }
  if (meal.strTags) {
    parts.push(meal.strTags.split(',').slice(0, 2).join(', '));
  }
  return parts.length > 0
    ? `A ${parts.join(' ')} dish`
    : 'A delicious recipe from TheMealDB';
}

// ── Main Import ─────────────────────────────────────────────────────────

async function main() {
  console.log('🍽️  TheMealDB Import');
  console.log(`   Home ID: ${TARGET_HOME_ID}`);
  console.log(`   Created By: ${TARGET_CREATED_BY}`);
  console.log('');

  // 1. Fetch all categories
  const catResp = await fetchJSON<{ categories: MealDBCategory[] }>(
    `${API_BASE}/categories.php`
  );
  const categories = catResp.categories.map((c) => c.strCategory);
  console.log(`📂 Found ${categories.length} categories: ${categories.join(', ')}`);

  // 2. Collect all meal IDs
  const allMeals: MealDBListItem[] = [];

  for (const category of categories) {
    const listResp = await fetchJSON<{ meals: MealDBListItem[] | null }>(
      `${API_BASE}/filter.php?c=${encodeURIComponent(category)}`
    );
    const meals = listResp.meals ?? [];
    allMeals.push(...meals);
    console.log(`   ${category}: ${meals.length} meals`);
    await sleep(100); // be polite
  }

  console.log(`\n📋 Total meals to import: ${allMeals.length}`);

  // 3. Fetch details & import each meal
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const canonicalIngredients = new Map<string, string>(); // normalized name → category

  for (let i = 0; i < allMeals.length; i++) {
    const meal = allMeals[i];
    const progress = `[${i + 1}/${allMeals.length}]`;

    try {
      // Check if already imported
      const { data: existing } = await supabase
        .from('recipes')
        .select('id')
        .eq('source', 'themealdb')
        .eq('source_id', meal.idMeal)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      // Fetch full meal details
      const detailResp = await fetchJSON<{ meals: MealDBDetail[] | null }>(
        `${API_BASE}/lookup.php?i=${meal.idMeal}`
      );
      const detail = detailResp.meals?.[0];
      if (!detail) {
        console.log(`   ${progress} ⚠️  No details for ${meal.strMeal}`);
        failed++;
        continue;
      }

      // Extract ingredients
      const ingredients = extractIngredients(detail);

      // Track canonical ingredients
      for (const ing of ingredients) {
        const normalized = normalizeName(ing.name);
        if (normalized && !canonicalIngredients.has(normalized)) {
          canonicalIngredients.set(normalized, guessCategory(ing.name));
        }
      }

      // Insert recipe
      const { error } = await supabase.from('recipes').insert({
        home_id: TARGET_HOME_ID,
        title: detail.strMeal,
        description: buildDescription(detail),
        ingredients,
        instructions: detail.strInstructions?.trim() ?? '',
        calories: null, // TheMealDB doesn't provide calorie data
        servings: 4,    // Default estimate
        image_url: detail.strMealThumb
          ? `${detail.strMealThumb}/preview` // TheMealDB /preview gives smaller image
          : null,
        category: detail.strCategory ?? null,
        source: 'themealdb',
        source_id: detail.idMeal,
        created_by: TARGET_CREATED_BY,
      });

      if (error) {
        if (error.code === '23505') {
          // Duplicate key — already exists
          skipped++;
        } else {
          console.log(`   ${progress} ❌ ${detail.strMeal}: ${error.message}`);
          failed++;
        }
      } else {
        imported++;
        if (imported % 25 === 0) {
          console.log(`   ${progress} ✅ ${imported} imported so far...`);
        }
      }

      await sleep(150); // be polite to API
    } catch (err) {
      console.log(`   ${progress} ❌ ${meal.strMeal}: ${String(err)}`);
      failed++;
    }
  }

  // 4. Upsert canonical ingredients
  console.log(`\n🧅 Upserting ${canonicalIngredients.size} canonical ingredients...`);

  const ingredientRows = Array.from(canonicalIngredients.entries()).map(
    ([name, category]) => ({ name, category })
  );

  // Insert in batches of 100
  for (let i = 0; i < ingredientRows.length; i += 100) {
    const batch = ingredientRows.slice(i, i + 100);
    const { error } = await supabase
      .from('ingredients')
      .upsert(batch, { onConflict: 'name', ignoreDuplicates: true });

    if (error) {
      console.log(`   ⚠️  Batch ${i / 100 + 1} error: ${error.message}`);
    }
  }

  // 5. Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 Import Summary');
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped (already exists): ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   🧅 Ingredients cataloged: ${canonicalIngredients.size}`);
  console.log('═'.repeat(50));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
