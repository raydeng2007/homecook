#!/usr/bin/env npx tsx
/**
 * Import recipes from Spoonacular API (incremental, respects free tier limits).
 *
 * Free tier: 50 points/day. Each complexSearch costs 1 point + 0.01/result.
 * Each getRecipeInformation costs 1 point.
 *
 * Strategy: Fetch 10 recipes per search (≈1.1 pts), then 10 details (10 pts)
 *           = ~11 points per batch of 10 recipes → ~4 batches/day = 40 recipes/day
 *
 * Usage:
 *   npx tsx scripts/import-spoonacular.ts
 *
 * Requires scripts/.env with SUPABASE_URL, SUPABASE_SERVICE_KEY, HOME_ID,
 *   CREATED_BY, SPOONACULAR_API_KEY
 */
import { supabase, TARGET_HOME_ID, TARGET_CREATED_BY } from './supabase-admin.js';
import { normalizeName, guessCategory, parseMeasure } from './ingredient-normalizer.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const API_KEY = process.env.SPOONACULAR_API_KEY;
if (!API_KEY) {
  throw new Error('Missing SPOONACULAR_API_KEY in scripts/.env');
}

const API_BASE = 'https://api.spoonacular.com';
const __dirname = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
const PROGRESS_FILE = resolve(__dirname, '.spoonacular-progress.json');
const RECIPES_PER_BATCH = 10;
const MAX_POINTS_PER_RUN = 45; // Stay under 50 limit with buffer

// ── Spoonacular Types ──────────────────────────────────────────────────

interface SpoonacularSearchResult {
  id: number;
  title: string;
  image: string;
}

interface SpoonacularSearchResponse {
  results: SpoonacularSearchResult[];
  offset: number;
  number: number;
  totalResults: number;
}

interface SpoonacularIngredient {
  name: string;
  amount: number;
  unit: string;
  original: string;
}

interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  summary: string;
  instructions: string;
  analyzedInstructions: {
    steps: { number: number; step: string }[];
  }[];
  extendedIngredients: SpoonacularIngredient[];
  servings: number;
  readyInMinutes: number;
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  nutrition?: {
    nutrients: { name: string; amount: number; unit: string }[];
  };
}

// ── Progress Tracking ──────────────────────────────────────────────────

interface Progress {
  lastOffset: number;
  totalImported: number;
  pointsUsedToday: number;
  lastRunDate: string; // YYYY-MM-DD
  cuisineIndex: number;
}

const CUISINES = [
  'Italian', 'Mexican', 'Chinese', 'Indian', 'Japanese',
  'Thai', 'French', 'Mediterranean', 'Korean', 'American',
  'Greek', 'Spanish', 'Vietnamese', 'Middle Eastern', 'African',
  'Caribbean', 'British', 'German', 'Latin American', 'Southern',
];

function loadProgress(): Progress {
  if (existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
    } catch {
      // Reset on parse error
    }
  }
  return {
    lastOffset: 0,
    totalImported: 0,
    pointsUsedToday: 0,
    lastRunDate: '',
    cuisineIndex: 0,
  };
}

function saveProgress(p: Progress) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Helpers ─────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${url}\n${body}`);
  }
  return res.json() as Promise<T>;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

function buildInstructions(recipe: SpoonacularRecipe): string {
  // Prefer analyzed instructions (structured steps)
  if (recipe.analyzedInstructions?.length > 0) {
    const steps = recipe.analyzedInstructions[0].steps;
    if (steps.length > 0) {
      return steps.map((s) => `${s.number}. ${s.step}`).join('\n');
    }
  }

  // Fallback to raw instructions
  if (recipe.instructions) {
    return stripHtml(recipe.instructions);
  }

  return 'No instructions available.';
}

function getCalories(recipe: SpoonacularRecipe): number | null {
  const cal = recipe.nutrition?.nutrients?.find(
    (n) => n.name.toLowerCase() === 'calories'
  );
  return cal ? Math.round(cal.amount) : null;
}

// ── Main Import ─────────────────────────────────────────────────────────

async function main() {
  const progress = loadProgress();
  const today = todayStr();

  // Reset daily counter if new day
  if (progress.lastRunDate !== today) {
    progress.pointsUsedToday = 0;
    progress.lastRunDate = today;
  }

  console.log('🥄 Spoonacular Import');
  console.log(`   Home ID: ${TARGET_HOME_ID}`);
  console.log(`   Points used today: ${progress.pointsUsedToday}/${MAX_POINTS_PER_RUN}`);
  console.log(`   Total imported so far: ${progress.totalImported}`);
  console.log(`   Current cuisine: ${CUISINES[progress.cuisineIndex % CUISINES.length]}`);
  console.log('');

  if (progress.pointsUsedToday >= MAX_POINTS_PER_RUN) {
    console.log('⚠️  Daily point limit reached. Try again tomorrow.');
    return;
  }

  let imported = 0;
  let skipped = 0;
  const canonicalIngredients = new Map<string, string>();

  while (progress.pointsUsedToday < MAX_POINTS_PER_RUN) {
    const cuisine = CUISINES[progress.cuisineIndex % CUISINES.length];

    // 1. Search for recipes
    console.log(`\n🔍 Searching: ${cuisine} (offset ${progress.lastOffset})...`);

    const searchUrl = `${API_BASE}/recipes/complexSearch?apiKey=${API_KEY}&cuisine=${encodeURIComponent(cuisine)}&number=${RECIPES_PER_BATCH}&offset=${progress.lastOffset}&sort=popularity&sortDirection=desc&addRecipeNutrition=true&addRecipeInstructions=true&fillIngredients=true&instructionsRequired=true`;

    let searchResp: SpoonacularSearchResponse;
    try {
      searchResp = await fetchJSON<SpoonacularSearchResponse>(searchUrl);
      progress.pointsUsedToday += 1.1; // 1 + 0.01 per result
    } catch (err) {
      console.log(`   ❌ Search failed: ${String(err)}`);
      break;
    }

    if (searchResp.results.length === 0) {
      // Move to next cuisine
      console.log(`   No more results for ${cuisine}. Moving to next cuisine.`);
      progress.cuisineIndex++;
      progress.lastOffset = 0;
      saveProgress(progress);
      continue;
    }

    // 2. Fetch full details for each recipe
    const ids = searchResp.results.map((r) => r.id).join(',');
    console.log(`   Fetching details for ${searchResp.results.length} recipes...`);

    let recipes: SpoonacularRecipe[];
    try {
      const detailUrl = `${API_BASE}/recipes/informationBulk?apiKey=${API_KEY}&ids=${ids}&includeNutrition=true`;
      recipes = await fetchJSON<SpoonacularRecipe[]>(detailUrl);
      progress.pointsUsedToday += 1; // bulk info costs 1 point
    } catch (err) {
      console.log(`   ❌ Detail fetch failed: ${String(err)}`);
      break;
    }

    // 3. Insert each recipe
    for (const recipe of recipes) {
      try {
        // Check if already imported
        const { data: existing } = await supabase
          .from('recipes')
          .select('id')
          .eq('source', 'spoonacular')
          .eq('source_id', String(recipe.id))
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // Map ingredients
        const ingredients = recipe.extendedIngredients.map((ing) => ({
          name: ing.name,
          quantity: String(ing.amount || ''),
          unit: ing.unit || '',
        }));

        // Track canonical ingredients
        for (const ing of ingredients) {
          const normalized = normalizeName(ing.name);
          if (normalized && !canonicalIngredients.has(normalized)) {
            canonicalIngredients.set(normalized, guessCategory(ing.name));
          }
        }

        // Determine category
        const category =
          recipe.cuisines?.[0] ??
          recipe.dishTypes?.[0] ??
          cuisine;

        // Build description from summary
        const description = stripHtml(recipe.summary || '').slice(0, 300) ||
          `A ${cuisine} ${recipe.dishTypes?.[0] ?? 'recipe'}`;

        // Insert
        const { error } = await supabase.from('recipes').insert({
          home_id: TARGET_HOME_ID,
          title: recipe.title,
          description,
          ingredients,
          instructions: buildInstructions(recipe),
          calories: getCalories(recipe),
          servings: recipe.servings || 4,
          image_url: recipe.image || null,
          category,
          source: 'spoonacular',
          source_id: String(recipe.id),
          created_by: TARGET_CREATED_BY,
        });

        if (error) {
          if (error.code === '23505') {
            skipped++;
          } else {
            console.log(`   ❌ ${recipe.title}: ${error.message}`);
          }
        } else {
          imported++;
          progress.totalImported++;
        }
      } catch (err) {
        console.log(`   ❌ ${recipe.title}: ${String(err)}`);
      }
    }

    console.log(`   ✅ Batch done: +${imported} imported, ${skipped} skipped`);

    // Advance offset
    progress.lastOffset += RECIPES_PER_BATCH;

    // If we've gone through enough of this cuisine, move on
    if (progress.lastOffset >= 100) {
      progress.cuisineIndex++;
      progress.lastOffset = 0;
    }

    saveProgress(progress);
    await sleep(500);
  }

  // 4. Upsert canonical ingredients
  if (canonicalIngredients.size > 0) {
    console.log(`\n🧅 Upserting ${canonicalIngredients.size} canonical ingredients...`);
    const ingredientRows = Array.from(canonicalIngredients.entries()).map(
      ([name, category]) => ({ name, category })
    );

    for (let i = 0; i < ingredientRows.length; i += 100) {
      const batch = ingredientRows.slice(i, i + 100);
      await supabase
        .from('ingredients')
        .upsert(batch, { onConflict: 'name', ignoreDuplicates: true });
    }
  }

  // 5. Summary
  saveProgress(progress);
  console.log('\n' + '═'.repeat(50));
  console.log('📊 Import Summary');
  console.log(`   ✅ Imported this run: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📊 Points used today: ~${Math.round(progress.pointsUsedToday)}`);
  console.log(`   📈 Total all-time: ${progress.totalImported}`);
  console.log(`   🧅 New ingredients: ${canonicalIngredients.size}`);
  console.log(`   🔄 Next run: cuisine=${CUISINES[progress.cuisineIndex % CUISINES.length]}, offset=${progress.lastOffset}`);
  console.log('═'.repeat(50));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
