import {
  formatQuantity,
  getScaleFactor,
  scaleQuantity,
  scaleIngredients,
  scaleCalories,
  caloriesPerServing,
} from '@/lib/portion-scaling';
import type { Ingredient } from '@/types/database';

// ── formatQuantity ────────────────────────────────────────────────────────

describe('formatQuantity', () => {
  describe('zero and negative values', () => {
    it('returns "" for 0', () => expect(formatQuantity(0)).toBe(''));
    it('returns "" for negative value', () => expect(formatQuantity(-1)).toBe(''));
    it('returns "" for -0.5', () => expect(formatQuantity(-0.5)).toBe(''));
  });

  describe('integer values', () => {
    it('returns "1" for 1', () => expect(formatQuantity(1)).toBe('1'));
    it('returns "3" for 3', () => expect(formatQuantity(3)).toBe('3'));
    it('returns "10" for 10', () => expect(formatQuantity(10)).toBe('10'));
  });

  describe('simple fractions (whole part = 0)', () => {
    it('returns "\u00bd" for 0.5', () => expect(formatQuantity(0.5)).toBe('\u00bd'));
    it('returns "\u00bc" for 0.25', () => expect(formatQuantity(0.25)).toBe('\u00bc'));
    it('returns "\u2153" for 0.333', () => expect(formatQuantity(0.333)).toBe('\u2153'));
    it('returns "\u215b" for 0.125', () => expect(formatQuantity(0.125)).toBe('\u215b'));
    it('returns "\u00be" for 0.75', () => expect(formatQuantity(0.75)).toBe('\u00be'));
    // 0.667 is within TOLERANCE of 0.625 (⅝) which comes first in FRACTION_MAP
    it('returns "\u215d" for 0.667 (closest match is \u215d due to map order)', () => expect(formatQuantity(0.667)).toBe('\u215d'));
  });

  describe('mixed number fractions (whole + fraction)', () => {
    it('returns "1 \u00bd" for 1.5', () => expect(formatQuantity(1.5)).toBe('1 \u00bd'));
    it('returns "2 \u00bc" for 2.25', () => expect(formatQuantity(2.25)).toBe('2 \u00bc'));
    it('returns "3 \u2153" for 3.333', () => expect(formatQuantity(3.333)).toBe('3 \u2153'));
    it('returns "1 \u00be" for 1.75', () => expect(formatQuantity(1.75)).toBe('1 \u00be'));
  });

  describe('values with no clean fraction (decimal fallback)', () => {
    // 1.2 and 1.8 are outside all fraction tolerances — fall back to decimal
    it('returns "1.2" for 1.2 (no fraction match)', () => expect(formatQuantity(1.2)).toBe('1.2'));
    it('returns "1.8" for 1.8 (no fraction match)', () => expect(formatQuantity(1.8)).toBe('1.8'));
    // Note: 1.6 maps to "1 ⅝" (within TOLERANCE of 0.625), 2.3 maps to "2 ¼" (floating point)
    it('returns "1 \u215d" for 1.6 (within tolerance of \u215d)', () => expect(formatQuantity(1.6)).toBe('1 \u215d'));
    it('returns "2 \u00bc" for 2.3 (floating point makes it within tolerance of \u00bc)', () => expect(formatQuantity(2.3)).toBe('2 \u00bc'));
  });
});

// ── getScaleFactor ────────────────────────────────────────────────────────

describe('getScaleFactor', () => {
  it('returns 0.5 for (4, 2) — halving', () => {
    expect(getScaleFactor(4, 2)).toBe(0.5);
  });
  it('returns 2 for (2, 4) — doubling', () => {
    expect(getScaleFactor(2, 4)).toBe(2);
  });
  it('returns 1 for (4, 4) — same servings', () => {
    expect(getScaleFactor(4, 4)).toBe(1);
  });
  it('returns 1 when baseServings is 0 (safe default)', () => {
    expect(getScaleFactor(0, 4)).toBe(1);
  });
  it('returns 1 when baseServings is negative (safe default)', () => {
    expect(getScaleFactor(-1, 4)).toBe(1);
  });
  it('returns 0 when desiredServings is 0', () => {
    expect(getScaleFactor(4, 0)).toBe(0);
  });
});

// ── scaleQuantity ─────────────────────────────────────────────────────────

describe('scaleQuantity', () => {
  it('passes through non-numeric "to taste"', () => {
    expect(scaleQuantity('to taste', 2)).toBe('to taste');
  });
  it('passes through non-numeric "pinch"', () => {
    expect(scaleQuantity('pinch', 3)).toBe('pinch');
  });
  it('passes through non-numeric "a handful"', () => {
    expect(scaleQuantity('a handful', 2)).toBe('a handful');
  });
  it('passes through empty string', () => {
    expect(scaleQuantity('', 2)).toBe('');
  });
  it('returns empty string for undefined input (BUG H regression)', () => {
    expect(scaleQuantity(undefined as unknown as string, 2)).toBe('');
  });
  it('returns empty string for null input (BUG H regression)', () => {
    expect(scaleQuantity(null as unknown as string, 2)).toBe('');
  });
  it('scales "2" \u00d7 1.5 \u2192 "3"', () => {
    expect(scaleQuantity('2', 1.5)).toBe('3');
  });
  it('scales "1" \u00d7 2 \u2192 "2"', () => {
    expect(scaleQuantity('1', 2)).toBe('2');
  });
  it('scales "1" \u00d7 0.5 \u2192 "\u00bd"', () => {
    expect(scaleQuantity('1', 0.5)).toBe('\u00bd');
  });
  it('scales "0.5" \u00d7 2 \u2192 "1"', () => {
    expect(scaleQuantity('0.5', 2)).toBe('1');
  });
});

// ── scaleIngredients ──────────────────────────────────────────────────────

describe('scaleIngredients', () => {
  const ingredients: Ingredient[] = [
    { name: 'flour', quantity: '2', unit: 'cups' },
    { name: 'sugar', quantity: '1', unit: 'cup' },
    { name: 'salt', quantity: 'to taste', unit: '' },
  ];

  it('returns same array reference when factor is 1', () => {
    const result = scaleIngredients(ingredients, 4, 4);
    expect(result).toBe(ingredients);
  });

  it('scales quantities when factor !== 1', () => {
    const result = scaleIngredients(ingredients, 4, 8);
    expect(result[0].quantity).toBe('4'); // 2 × 2
    expect(result[1].quantity).toBe('2'); // 1 × 2
  });

  it('preserves non-numeric quantities unchanged', () => {
    const result = scaleIngredients(ingredients, 4, 8);
    expect(result[2].quantity).toBe('to taste');
  });

  it('preserves name and unit', () => {
    const result = scaleIngredients(ingredients, 4, 8);
    expect(result[0].name).toBe('flour');
    expect(result[0].unit).toBe('cups');
  });

  it('does not mutate the original array', () => {
    scaleIngredients(ingredients, 4, 8);
    expect(ingredients[0].quantity).toBe('2');
  });

  it('returns a new array (not same reference) when scaling', () => {
    const result = scaleIngredients(ingredients, 4, 8);
    expect(result).not.toBe(ingredients);
  });
});

// ── scaleCalories ─────────────────────────────────────────────────────────

describe('scaleCalories', () => {
  it('returns null when totalCalories is null', () => {
    expect(scaleCalories(null, 4, 2)).toBeNull();
  });
  it('returns totalCalories unchanged when baseServings is 0', () => {
    expect(scaleCalories(500, 0, 2)).toBe(500);
  });
  it('scales 500 cal / 4 serv \u00d7 2 = 250', () => {
    expect(scaleCalories(500, 4, 2)).toBe(250);
  });
  it('returns same value when servings unchanged', () => {
    expect(scaleCalories(500, 4, 4)).toBe(500);
  });
  it('scales up: 300 cal / 4 serv \u00d7 8 = 600', () => {
    expect(scaleCalories(300, 4, 8)).toBe(600);
  });
  it('rounds fractional results', () => {
    // 100 / 3 × 4 = 133.33... → 133
    expect(scaleCalories(100, 3, 4)).toBe(133);
  });
});

// ── caloriesPerServing ────────────────────────────────────────────────────

describe('caloriesPerServing', () => {
  it('returns null when totalCalories is null', () => {
    expect(caloriesPerServing(null, 4)).toBeNull();
  });
  it('returns null when servings is 0', () => {
    expect(caloriesPerServing(500, 0)).toBeNull();
  });
  it('returns null when servings is negative', () => {
    expect(caloriesPerServing(500, -1)).toBeNull();
  });
  it('calculates 500 / 4 = 125', () => {
    expect(caloriesPerServing(500, 4)).toBe(125);
  });
  it('rounds: 100 / 3 = 33', () => {
    expect(caloriesPerServing(100, 3)).toBe(33);
  });
  it('rounds up: 200 / 3 = 67', () => {
    expect(caloriesPerServing(200, 3)).toBe(67);
  });
});
