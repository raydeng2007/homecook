import type { Ingredient } from '@/types/database';

/**
 * Smart portion scaling engine.
 *
 * Handles:
 *  - Proportional ingredient scaling based on serving ratio
 *  - Human-friendly quantity formatting (fractions, rounding)
 *  - Calorie scaling per serving
 *  - Edge cases: zero quantities, missing data, non-numeric strings
 */

// ── Common fraction display ────────────────────────────────────────────

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

/**
 * Format a number as a human-friendly string with fractions.
 * e.g., 1.5 → "1 ½", 0.25 → "¼", 3.33 → "3 ⅓", 2.0 → "2"
 */
export function formatQuantity(value: number): string {
  if (value <= 0) return '';
  if (Number.isInteger(value)) return String(value);

  const whole = Math.floor(value);
  const frac = value - whole;

  // Find closest fraction match (within tolerance)
  const TOLERANCE = 0.05;
  for (const [threshold, symbol] of FRACTION_MAP) {
    if (Math.abs(frac - threshold) < TOLERANCE) {
      return whole > 0 ? `${whole} ${symbol}` : symbol;
    }
  }

  // No clean fraction — round to 1 decimal
  const rounded = Math.round(value * 10) / 10;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(1);
}

// ── Scaling logic ──────────────────────────────────────────────────────

/**
 * Compute the scale factor from base servings to desired servings.
 */
export function getScaleFactor(baseServings: number, desiredServings: number): number {
  if (baseServings <= 0) return 1;
  return desiredServings / baseServings;
}

/**
 * Scale a single ingredient quantity by a factor.
 * Parses string quantities like "1.5", "2", handles non-numeric gracefully.
 *
 * BUG FIX: previously this returned `rawQuantity` directly when parsing failed,
 * which leaked `undefined` through when ingredients came back from the DB
 * without a quantity field. Now we coerce to an empty string for the "no
 * quantity" case, so `quantity` is always a string per the Ingredient type.
 */
export function scaleQuantity(rawQuantity: string | null | undefined, factor: number): string {
  if (rawQuantity == null) return '';
  const parsed = parseFloat(rawQuantity);
  if (isNaN(parsed) || parsed <= 0) return rawQuantity; // "to taste", "pinch", etc.
  return formatQuantity(parsed * factor);
}

/**
 * Scale an entire ingredients list for a desired serving count.
 * Returns new array — does NOT mutate the original.
 */
export function scaleIngredients(
  ingredients: Ingredient[],
  baseServings: number,
  desiredServings: number
): Ingredient[] {
  const factor = getScaleFactor(baseServings, desiredServings);
  if (factor === 1) return ingredients;

  return ingredients.map((ing) => ({
    ...ing,
    quantity: scaleQuantity(ing.quantity, factor),
  }));
}

/**
 * Scale calories proportionally.
 * Returns total calories for the desired serving count.
 */
export function scaleCalories(
  totalCalories: number | null,
  baseServings: number,
  desiredServings: number
): number | null {
  if (totalCalories == null || baseServings <= 0) return totalCalories;
  const perServing = totalCalories / baseServings;
  return Math.round(perServing * desiredServings);
}

/**
 * Get calories per single serving.
 */
export function caloriesPerServing(totalCalories: number | null, servings: number): number | null {
  if (totalCalories == null || servings <= 0) return null;
  return Math.round(totalCalories / servings);
}
