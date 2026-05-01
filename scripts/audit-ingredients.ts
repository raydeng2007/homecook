#!/usr/bin/env npx tsx
/**
 * Audit ingredient quality across all recipes.
 *
 * Finds ingredients that normalize to different canonical names but
 * probably should be the same — e.g., "cremini mushrooms" and
 * "button mushrooms" both just mean "mushroom".
 *
 * Usage:
 *   npx tsx scripts/audit-ingredients.ts              # Full audit report
 *   npx tsx scripts/audit-ingredients.ts --add-synonyms  # Interactive: add missing synonyms
 *
 * After adding synonyms, the nightly pg_cron job (from migration-008)
 * re-normalizes all recipes automatically. Or force it immediately:
 *   UPDATE recipes SET ingredients = ingredients WHERE ingredients IS NOT NULL;
 */
import { supabase } from './supabase-admin.js';
import { normalizeName } from './ingredient-normalizer.js';
import { createInterface } from 'readline';

const ADD_SYNONYMS = process.argv.includes('--add-synonyms');

interface IngredientEntry {
  name: string;
  quantity: string;
  unit: string;
}

interface RecipeRow {
  id: string;
  title: string;
  ingredients: IngredientEntry[];
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Ingredient Audit');
  console.log('═'.repeat(50));

  // 1. Fetch all recipes
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, title, ingredients');

  if (error || !recipes) {
    console.error('❌ Failed to fetch recipes:', error?.message);
    process.exit(1);
  }

  // 2. Fetch existing synonyms
  const { data: synonymRows } = await supabase
    .from('ingredient_synonyms')
    .select('variant, canonical');

  const synonymMap = new Map<string, string>();
  for (const row of synonymRows ?? []) {
    synonymMap.set(row.variant, row.canonical);
  }
  console.log(`   ${synonymMap.size} existing synonyms loaded`);

  // 3. Build a map of all ingredient names → normalized names → recipe count
  const rawToNormalized = new Map<string, string>();
  const normalizedCounts = new Map<string, { count: number; rawVariants: Map<string, number> }>();

  for (const recipe of recipes as RecipeRow[]) {
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) continue;

    for (const ing of recipe.ingredients) {
      const raw = ing.name.trim().toLowerCase();
      if (!raw) continue;

      // Apply synonym if exists
      const afterNormalize = normalizeName(raw);
      const canonical = synonymMap.get(afterNormalize) ?? afterNormalize;

      rawToNormalized.set(raw, canonical);

      const entry = normalizedCounts.get(canonical) ?? { count: 0, rawVariants: new Map() };
      entry.count++;
      entry.rawVariants.set(raw, (entry.rawVariants.get(raw) ?? 0) + 1);
      normalizedCounts.set(canonical, entry);
    }
  }

  // 4. Find potential duplicates — ingredients with similar normalized names
  const sortedNames = [...normalizedCounts.keys()].sort();

  console.log(`\n📊 ${sortedNames.length} unique normalized ingredients across ${recipes.length} recipes\n`);

  // 4a. Find mushroom-type clusters (same base word, different modifiers)
  console.log('═'.repeat(50));
  console.log('Potential Merge Candidates (same base word)');
  console.log('═'.repeat(50));

  const baseWordGroups = new Map<string, string[]>();
  for (const name of sortedNames) {
    const words = name.split(' ');
    const baseWord = words[words.length - 1]; // last word is usually the noun
    if (baseWord.length < 3) continue;

    const group = baseWordGroups.get(baseWord) ?? [];
    group.push(name);
    baseWordGroups.set(baseWord, group);
  }

  const mergeCandidates: { base: string; variants: string[] }[] = [];
  for (const [base, group] of baseWordGroups) {
    if (group.length > 1) {
      mergeCandidates.push({ base, variants: group });
    }
  }

  // Sort by number of variants (most first)
  mergeCandidates.sort((a, b) => b.variants.length - a.variants.length);

  for (const { base, variants } of mergeCandidates.slice(0, 30)) {
    console.log(`\n  🟡 "${base}" (${variants.length} variants):`);
    for (const v of variants) {
      const entry = normalizedCounts.get(v)!;
      const rawList = [...entry.rawVariants.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([r, c]) => `${r} (${c})`)
        .slice(0, 3)
        .join(', ');
      console.log(`     ${v} — ${entry.count} recipes — raw: ${rawList}`);
    }
  }

  // 4b. Show top ingredients without synonyms
  console.log('\n' + '═'.repeat(50));
  console.log('Top Ingredients (no synonym mapping yet)');
  console.log('═'.repeat(50));

  const unmapped = [...normalizedCounts.entries()]
    .filter(([name]) => !synonymMap.has(name))
    .sort((a, b) => b[1].count - a[1].count);

  for (const [name, entry] of unmapped.slice(0, 30)) {
    const rawList = [...entry.rawVariants.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([r, c]) => `${r} (${c})`)
      .slice(0, 3)
      .join(', ');
    console.log(`  ${String(entry.count).padStart(4)} recipes | ${name} — raw: ${rawList}`);
  }

  // 5. Interactive synonym adding
  if (ADD_SYNONYMS) {
    console.log('\n' + '═'.repeat(50));
    console.log('Add Missing Synonyms');
    console.log('═'.repeat(50));
    console.log('For each merge candidate, enter the canonical name to merge to.');
    console.log('Press Enter to skip, "q" to quit.\n');

    const rl = createInterface({ input: process.stdin, output: process.stdout });

    const ask = (q: string): Promise<string> =>
      new Promise((resolve) => rl.question(q, resolve));

    const newSynonyms: { variant: string; canonical: string }[] = [];

    for (const { base, variants } of mergeCandidates.slice(0, 50)) {
      if (variants.length < 2) continue;

      console.log(`\n  "${base}" variants: ${variants.join(', ')}`);
      const answer = await ask(`  Merge all to which canonical name? (or Enter to skip, q to quit): `);

      if (answer.toLowerCase() === 'q') break;
      if (!answer.trim()) continue;

      const canonical = answer.trim().toLowerCase();
      for (const v of variants) {
        if (v !== canonical) {
          newSynonyms.push({ variant: v, canonical });
        }
      }
      console.log(`  ✅ Will merge ${variants.filter(v => v !== canonical).join(', ')} → "${canonical}"`);
    }

    rl.close();

    if (newSynonyms.length > 0) {
      console.log(`\n📝 Adding ${newSynonyms.length} new synonyms to database...`);

      // Add to DB synonym table
      const { error: upsertError } = await supabase
        .from('ingredient_synonyms')
        .upsert(newSynonyms, { onConflict: 'variant' });

      if (upsertError) {
        console.error('❌ Failed to add synonyms:', upsertError.message);
      } else {
        console.log('✅ Synonyms added to ingredient_synonyms table');

        // Also add to client-side synonym map (lib/ingredient-normalize.ts)
        console.log('\n⚠️  Remember to also add these to lib/ingredient-normalize.ts SYNONYM_MAP:');
        for (const s of newSynonyms) {
          console.log(`  ['${s.variant}', '${s.canonical}'],`);
        }

        // Re-trigger normalization on all recipes
        console.log('\n🔄 Re-normalizing all recipes...');
        const { error: renormError } = await supabase.rpc('normalize_all_recipes_batch');
        if (renormError) {
          // Fallback: trigger via update
          console.log('   (RPC not available, triggering via UPDATE...)');
          await supabase
            .from('recipes')
            .update({ updated_at: new Date().toISOString() })
            .not('ingredients', 'is', null);
          console.log('   ✅ Triggered re-normalization via update');
        } else {
          console.log('   ✅ Re-normalization complete');
        }
      }
    } else {
      console.log('\nNo new synonyms to add.');
    }
  } else {
    console.log('\n\n💡 Run with --add-synonyms to interactively merge ingredients');
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 Audit Summary');
  console.log('═'.repeat(50));
  console.log(`   Recipes:              ${recipes.length}`);
  console.log(`   Unique normalized:    ${sortedNames.length}`);
  console.log(`   Existing synonyms:    ${synonymMap.size}`);
  console.log(`   Merge candidates:     ${mergeCandidates.length} groups`);
  console.log('═'.repeat(50));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
