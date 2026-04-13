/**
 * Ingredient data quality — shared validation, cleaning, and deduplication.
 *
 * Used by:
 *   - import-spoonacular.ts (at import time)
 *   - import-themealdb.ts   (at import time)
 *   - cleanup-recipes.ts    (retroactive fix)
 */
import { normalizeName, guessCategory } from './ingredient-normalizer.js';

// ── Types ──────────────────────────────────────────────────────────────

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

// ── Constants ──────────────────────────────────────────────────────────

/** Units that are meaningless for individual ingredients. */
const BOGUS_UNITS = new Set([
  'servings', 'serving', 'links', 'link',
  'small piece', 'large piece', 'piece',
]);

/** Ingredients to drop entirely — not useful for shopping lists. */
const DROP_PATTERNS: RegExp[] = [
  /^water$/i,
  /^ice( cube)?s?$/i,
  /^cooking spray$/i,
  /^non[- ]?stick spray$/i,
];

/** Compound ingredients to split into separate entries. */
const COMPOUND_SPLITS: Record<string, Ingredient[]> = {
  'salt and pepper': [
    { name: 'salt', quantity: '', unit: 'to taste' },
    { name: 'black pepper', quantity: '', unit: 'to taste' },
  ],
  'salt & pepper': [
    { name: 'salt', quantity: '', unit: 'to taste' },
    { name: 'black pepper', quantity: '', unit: 'to taste' },
  ],
};

/** Herbs where "X servings" should become "to taste". */
const HERB_NAMES = new Set([
  'parsley', 'cilantro', 'basil', 'mint', 'dill', 'chive', 'chives',
  'thyme', 'rosemary', 'oregano', 'sage', 'tarragon', 'bay leaf',
  'bay leaves', 'coriander',
]);

/** Unit abbreviation normalization. */
const UNIT_NORMALIZE: Record<string, string> = {
  'tbs': 'tbsp',
  'tbsps': 'tbsp',
  'tablespoon': 'tbsp',
  'tablespoons': 'tbsp',
  'teaspoon': 'tsp',
  'teaspoons': 'tsp',
  'tsps': 'tsp',
  'ounce': 'oz',
  'ounces': 'oz',
  'ozs': 'oz',
  'pound': 'lb',
  'pounds': 'lb',
  'lbs': 'lb',
  'kilogram': 'kg',
  'kilograms': 'kg',
  'gram': 'g',
  'grams': 'g',
  'milliliter': 'ml',
  'milliliters': 'ml',
  'millilitre': 'ml',
  'millilitres': 'ml',
  'liter': 'L',
  'liters': 'L',
  'litre': 'L',
  'litres': 'L',
  'cup': 'cup',
  'cups': 'cup',
  'clove': 'clove',
  'cloves': 'clove',
  'pinch': 'pinch',
  'pinches': 'pinch',
  'bunch': 'bunch',
  'bunches': 'bunch',
  'sprig': 'sprig',
  'sprigs': 'sprig',
  'handful': 'handful',
  'handfuls': 'handful',
  'dash': 'dash',
  'dashes': 'dash',
  'slice': 'slice',
  'slices': 'slice',
  'can': 'can',
  'cans': 'can',
};

// ── Fraction Formatting ────────────────────────────────────────────────

const FRACTION_MAP: [number, string][] = [
  [0.125, '⅛'],
  [0.25,  '¼'],
  [0.333, '⅓'],
  [0.375, '⅜'],
  [0.5,   '½'],
  [0.625, '⅝'],
  [0.667, '⅔'],
  [0.75,  '¾'],
  [0.875, '⅞'],
];

/** Format a number as a fraction-friendly string. Mirrors lib/portion-scaling.ts. */
function formatQuantity(value: number): string {
  if (value <= 0) return '';
  if (Number.isInteger(value)) return String(value);

  const whole = Math.floor(value);
  const frac = value - whole;

  const TOLERANCE = 0.05;
  for (const [threshold, symbol] of FRACTION_MAP) {
    if (Math.abs(frac - threshold) < TOLERANCE) {
      return whole > 0 ? `${whole} ${symbol}` : symbol;
    }
  }

  const rounded = Math.round(value * 10) / 10;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(1);
}

// ── Cleaning Functions ─────────────────────────────────────────────────

/**
 * Clean a raw quantity string — round floats, convert to fraction display.
 * "0.33333334" → "⅓", "1.5" → "1 ½", "to taste" → "to taste"
 */
export function cleanQuantity(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const parsed = parseFloat(trimmed);
  if (isNaN(parsed)) return trimmed; // "to taste", "pinch", etc.
  if (parsed <= 0) return '';

  return formatQuantity(parsed);
}

/**
 * Clean a unit string — reject bogus units, normalize abbreviations.
 */
export function cleanUnit(unit: string, ingredientName: string): string {
  const trimmed = unit.trim().toLowerCase();
  if (!trimmed) return '';

  // Reject bogus units
  if (BOGUS_UNITS.has(trimmed)) {
    const normalized = normalizeName(ingredientName);
    const category = guessCategory(ingredientName);

    // Herbs and spices → "to taste"
    if (HERB_NAMES.has(normalized) || category === 'spices') {
      return 'to taste';
    }
    // Everything else → drop the bogus unit
    return '';
  }

  // "to taste" should be kept as-is
  if (trimmed === 'to taste') return 'to taste';

  // Normalize abbreviations
  return UNIT_NORMALIZE[trimmed] ?? trimmed;
}

/**
 * Check if an ingredient should be dropped entirely.
 */
function shouldDrop(name: string): boolean {
  return DROP_PATTERNS.some((pattern) => pattern.test(name.trim()));
}

/**
 * Check if an ingredient is a compound that should be split.
 */
function getSplit(name: string): Ingredient[] | null {
  const lower = name.trim().toLowerCase();
  return COMPOUND_SPLITS[lower] ?? null;
}

/**
 * Deduplicate ingredients by normalized name.
 * If same ingredient appears twice with same unit, sum quantities.
 * If different units, keep the more specific one.
 */
function deduplicateIngredients(ingredients: Ingredient[]): Ingredient[] {
  const map = new Map<string, Ingredient & { rawNames: string[] }>();

  for (const ing of ingredients) {
    const normalized = normalizeName(ing.name);
    const key = `${normalized}||${ing.unit.toLowerCase()}`;

    const existing = map.get(key);
    if (existing) {
      // Same normalized name + unit → sum quantities
      const existingQty = parseFloat(existing.quantity);
      const newQty = parseFloat(ing.quantity);

      if (!isNaN(existingQty) && !isNaN(newQty)) {
        existing.quantity = formatQuantity(existingQty + newQty);
      }
      existing.rawNames.push(ing.name);
    } else {
      map.set(key, { ...ing, rawNames: [ing.name] });
    }
  }

  // Also merge entries with same normalized name but different units
  // (e.g., "parsley" with "" and "parsley" with "to taste" → keep the one with data)
  const byName = new Map<string, (Ingredient & { rawNames: string[] })[]>();
  for (const entry of map.values()) {
    const normalized = normalizeName(entry.name);
    const group = byName.get(normalized) ?? [];
    group.push(entry);
    byName.set(normalized, group);
  }

  const result: Ingredient[] = [];
  for (const entries of byName.values()) {
    if (entries.length === 1) {
      const { rawNames: _rn, ...rest } = entries[0];
      result.push(rest);
    } else {
      // Keep the entry with the most specific measurement
      // (has both quantity and unit, or just quantity > empty)
      const best = entries.reduce((a, b) => {
        const aScore = (a.quantity ? 1 : 0) + (a.unit ? 1 : 0);
        const bScore = (b.quantity ? 1 : 0) + (b.unit ? 1 : 0);
        return bScore > aScore ? b : a;
      });
      const { rawNames: _rn, ...rest } = best;
      result.push(rest);
    }
  }

  return result;
}

// ── Main Entry Point ───────────────────────────────────────────────────

/**
 * Clean an ingredients array — split compounds, drop bogus,
 * clean quantities/units, and deduplicate.
 *
 * Returns the cleaned array and a list of issues found.
 */
export function cleanIngredients(ingredients: Ingredient[]): {
  cleaned: Ingredient[];
  issues: string[];
} {
  const issues: string[] = [];
  const expanded: Ingredient[] = [];

  for (const ing of ingredients) {
    const name = ing.name.trim();
    if (!name) continue;

    // Check for compound splits
    const split = getSplit(name);
    if (split) {
      issues.push(`Split compound: "${name}" → ${split.map((s) => s.name).join(' + ')}`);
      expanded.push(...split);
      continue;
    }

    // Check for drops
    if (shouldDrop(name)) {
      issues.push(`Dropped: "${name}" (not a shopping ingredient)`);
      continue;
    }

    // Clean quantity and unit
    const cleanedQty = cleanQuantity(ing.quantity);
    const cleanedUnit = cleanUnit(ing.unit, name);

    if (ing.unit && cleanedUnit !== ing.unit.trim().toLowerCase() &&
        cleanedUnit !== (UNIT_NORMALIZE[ing.unit.trim().toLowerCase()] ?? ing.unit.trim().toLowerCase())) {
      issues.push(`Fixed unit: "${name}" — "${ing.unit}" → "${cleanedUnit}"`);
    }

    if (cleanedQty !== ing.quantity.trim() && ing.quantity.trim()) {
      issues.push(`Fixed quantity: "${name}" — "${ing.quantity}" → "${cleanedQty}"`);
    }

    expanded.push({
      name,
      quantity: cleanedQty,
      unit: cleanedUnit,
    });
  }

  // Deduplicate
  const before = expanded.length;
  const cleaned = deduplicateIngredients(expanded);
  if (cleaned.length < before) {
    issues.push(`Deduplicated: ${before} → ${cleaned.length} ingredients`);
  }

  return { cleaned, issues };
}

/**
 * Score recipe quality: what fraction of ingredients are vague.
 * Returns 0.0 (all clear) to 1.0 (all vague).
 */
export function vagueScore(ingredients: Ingredient[]): number {
  if (ingredients.length === 0) return 1.0;

  let vagueCount = 0;
  for (const ing of ingredients) {
    const category = guessCategory(ing.name);
    const hasQty = !!ing.quantity && ing.quantity !== '0';
    const hasUnit = !!ing.unit && ing.unit !== 'to taste';

    if (category === 'other' && !hasQty && !hasUnit) {
      vagueCount++;
    }
  }

  return vagueCount / ingredients.length;
}
