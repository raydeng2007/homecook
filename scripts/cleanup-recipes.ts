#!/usr/bin/env npx tsx
/**
 * Retroactive recipe ingredient quality cleanup.
 *
 * Fixes existing recipes in the database:
 *   - Cleans "X servings" bogus units → "to taste" or empty
 *   - Rounds float precision artifacts → fraction display
 *   - Splits compound ingredients ("salt and pepper")
 *   - Deduplicates within-recipe ingredients
 *   - Reports/deletes dodgy recipes (>60% vague ingredients)
 *
 * Usage:
 *   npx tsx scripts/cleanup-recipes.ts              # Fix quantities & units
 *   npx tsx scripts/cleanup-recipes.ts --dry-run     # Preview changes only
 *   npx tsx scripts/cleanup-recipes.ts --delete-dodgy # Also delete bad recipes
 *
 * Requires scripts/.env with SUPABASE_URL, SUPABASE_SERVICE_KEY
 */
import { supabase } from './supabase-admin.js';
import { cleanIngredients, vagueScore } from './ingredient-quality.js';

// ── CLI Flags ──────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run');
const DELETE_DODGY = process.argv.includes('--delete-dodgy');

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface RecipeRow {
  id: string;
  title: string;
  source: string;
  ingredients: Ingredient[];
}

// ── Helpers ────────────────────────────────────────────────────────────

function ingredientsEqual(a: Ingredient[], b: Ingredient[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].name !== b[i].name ||
        a[i].quantity !== b[i].quantity ||
        a[i].unit !== b[i].unit) {
      return false;
    }
  }
  return true;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log('🧹 Recipe Ingredient Quality Cleanup');
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`   Delete dodgy: ${DELETE_DODGY ? 'YES' : 'NO (report only)'}`);
  console.log('');

  // Fetch all recipes
  console.log('📥 Fetching all recipes...');
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, title, source, ingredients')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Failed to fetch recipes:', error.message);
    process.exit(1);
  }

  if (!recipes || recipes.length === 0) {
    console.log('No recipes found.');
    return;
  }

  console.log(`   Found ${recipes.length} recipes\n`);

  // ── Phase A: Clean ingredients ────────────────────────────────────

  console.log('═'.repeat(50));
  console.log('Phase A: Clean Quantities, Units & Dedup');
  console.log('═'.repeat(50));

  let fixedCount = 0;
  let totalIssues = 0;
  const allIssues: { title: string; issues: string[] }[] = [];

  for (const recipe of recipes as RecipeRow[]) {
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) continue;

    const { cleaned, issues } = cleanIngredients(recipe.ingredients);

    if (issues.length > 0) {
      totalIssues += issues.length;
      allIssues.push({ title: recipe.title, issues });

      if (!ingredientsEqual(recipe.ingredients, cleaned)) {
        fixedCount++;

        if (DRY_RUN) {
          console.log(`   📝 Would fix: ${recipe.title}`);
          for (const issue of issues) {
            console.log(`      - ${issue}`);
          }
        } else {
          const { error: updateError } = await supabase
            .from('recipes')
            .update({ ingredients: cleaned as unknown as Record<string, unknown>[] })
            .eq('id', recipe.id);

          if (updateError) {
            console.log(`   ❌ ${recipe.title}: ${updateError.message}`);
          }
        }
      }
    }
  }

  console.log(`\n   📊 Phase A Results:`);
  console.log(`      Recipes scanned: ${recipes.length}`);
  console.log(`      Recipes fixed: ${fixedCount}`);
  console.log(`      Total issues found: ${totalIssues}`);

  // ── Phase B: Report/delete dodgy recipes ──────────────────────────

  console.log('\n' + '═'.repeat(50));
  console.log('Phase B: Dodgy Recipe Detection');
  console.log('═'.repeat(50));

  // Re-fetch if we made changes (to get cleaned ingredients)
  let currentRecipes = recipes as RecipeRow[];
  if (!DRY_RUN && fixedCount > 0) {
    const { data: refreshed } = await supabase
      .from('recipes')
      .select('id, title, source, ingredients')
      .order('created_at', { ascending: true });
    if (refreshed) currentRecipes = refreshed as RecipeRow[];
  }

  const dodgyRecipes: { id: string; title: string; source: string; score: number; count: number }[] = [];

  for (const recipe of currentRecipes) {
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) continue;

    const score = vagueScore(recipe.ingredients);
    if (score > 0.6) {
      dodgyRecipes.push({
        id: recipe.id,
        title: recipe.title,
        source: recipe.source,
        score,
        count: recipe.ingredients.length,
      });
    }
  }

  if (dodgyRecipes.length === 0) {
    console.log('   ✅ No dodgy recipes found (>60% vague ingredients)');
  } else {
    console.log(`   ⚠️  Found ${dodgyRecipes.length} dodgy recipes:\n`);

    for (const r of dodgyRecipes) {
      const pct = Math.round(r.score * 100);
      console.log(`   ${pct}% vague | ${r.count} ingredients | [${r.source}] ${r.title}`);
    }

    if (DELETE_DODGY && !DRY_RUN) {
      console.log(`\n   🗑️  Deleting ${dodgyRecipes.length} dodgy recipes...`);

      const ids = dodgyRecipes.map((r) => r.id);
      for (let i = 0; i < ids.length; i += 50) {
        const batch = ids.slice(i, i + 50);
        const { error: deleteError } = await supabase
          .from('recipes')
          .delete()
          .in('id', batch);

        if (deleteError) {
          console.log(`   ❌ Batch delete error: ${deleteError.message}`);
        }
      }

      console.log(`   ✅ Deleted ${dodgyRecipes.length} recipes`);
    } else if (DELETE_DODGY && DRY_RUN) {
      console.log(`\n   📝 Would delete ${dodgyRecipes.length} recipes (dry run)`);
    } else {
      console.log(`\n   ℹ️  Run with --delete-dodgy to remove these recipes`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────

  console.log('\n' + '═'.repeat(50));
  console.log('📊 Cleanup Summary');
  console.log('═'.repeat(50));
  console.log(`   Recipes scanned:   ${recipes.length}`);
  console.log(`   Ingredients fixed:  ${fixedCount} recipes`);
  console.log(`   Issues found:       ${totalIssues}`);
  console.log(`   Dodgy flagged:      ${dodgyRecipes.length}`);
  if (DELETE_DODGY && !DRY_RUN) {
    console.log(`   Dodgy deleted:      ${dodgyRecipes.length}`);
  }
  console.log(`   Mode:               ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('═'.repeat(50));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
