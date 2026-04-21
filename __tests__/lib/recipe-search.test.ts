import { smartSearch, CUISINE_KEYWORDS } from '@/lib/recipe-search';
import type { Recipe } from '@/types/database';

// ── Test helpers ──────────────────────────────────────────────────────────

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: overrides.id ?? `r-${Math.random().toString(36).slice(2, 8)}`,
    home_id: 'h1',
    title: 'Default Recipe',
    description: '',
    ingredients: [],
    instructions: '',
    calories: 400,
    servings: 4,
    image_url: null,
    category: null,
    source: 'user',
    source_id: null,
    normalized_ingredients: null,
    created_by: 'u1',
    created_at: '2026-04-16',
    ...overrides,
  };
}

// ── smartSearch — baseline ────────────────────────────────────────────────

describe('smartSearch — baseline search behavior', () => {
  const recipes: Recipe[] = [
    makeRecipe({ id: 'r1', title: 'Chicken Curry', description: 'Spicy indian-style dish' }),
    makeRecipe({ id: 'r2', title: 'Beef Stew', description: 'Hearty winter meal', category: 'comfort food' }),
    makeRecipe({
      id: 'r3',
      title: 'Garlic Bread',
      description: 'Toasted bread with butter',
      ingredients: [{ name: 'Fresh Garlic', quantity: '2', unit: 'cloves' }],
    }),
    makeRecipe({ id: 'r4', title: 'Tomato Soup', description: 'Creamy and rich' }),
  ];

  it('returns the full input array when query is empty string', () => {
    expect(smartSearch(recipes, '')).toEqual(recipes);
  });

  it('returns the full input array when query is whitespace only', () => {
    expect(smartSearch(recipes, '   ')).toEqual(recipes);
  });

  it('matches by title (case-insensitive)', () => {
    const result = smartSearch(recipes, 'chicken');
    expect(result.map((r) => r.id)).toEqual(['r1']);
  });

  it('matches by title with uppercase query', () => {
    const result = smartSearch(recipes, 'CHICKEN');
    expect(result.map((r) => r.id)).toEqual(['r1']);
  });

  it('matches by description', () => {
    const result = smartSearch(recipes, 'hearty');
    expect(result.map((r) => r.id)).toEqual(['r2']);
  });

  it('matches by category', () => {
    const result = smartSearch(recipes, 'comfort');
    expect(result.map((r) => r.id)).toEqual(['r2']);
  });

  it('matches by ingredient name', () => {
    const result = smartSearch(recipes, 'garlic');
    expect(result.map((r) => r.id)).toEqual(['r3']);
  });

  it('multi-word query requires ALL tokens to appear somewhere', () => {
    const multiTokenRecipes: Recipe[] = [
      makeRecipe({ id: 'm1', title: 'Creamy Tomato Soup', description: 'Smooth and rich' }),
      makeRecipe({ id: 'm2', title: 'Tomato Salad', description: 'Fresh and light' }),
      makeRecipe({ id: 'm3', title: 'Creamy Potato', description: 'Rich mashed potato' }),
    ];
    const result = smartSearch(multiTokenRecipes, 'creamy tomato');
    // Only m1 has both tokens present
    expect(result.map((r) => r.id)).toEqual(['m1']);
  });
});

// ── smartSearch — cuisine keyword expansion ──────────────────────────────

describe('smartSearch — cuisine keyword expansion', () => {
  it('query "mexican" matches a recipe titled "Chicken Taco" via CUISINE_KEYWORDS', () => {
    const recipes: Recipe[] = [
      makeRecipe({ id: 'c1', title: 'Chicken Taco', description: 'Street style' }),
      makeRecipe({ id: 'c2', title: 'Beef Stew', description: 'Hearty' }),
    ];
    const result = smartSearch(recipes, 'mexican');
    expect(result.map((r) => r.id)).toEqual(['c1']);
  });

  it('query "italian" matches a recipe with ingredient "pasta"', () => {
    const recipes: Recipe[] = [
      makeRecipe({
        id: 'i1',
        title: 'Weeknight Dinner',
        description: 'Quick and easy',
        ingredients: [{ name: 'pasta', quantity: '200', unit: 'g' }],
      }),
      makeRecipe({ id: 'i2', title: 'Roast Chicken', description: 'Classic' }),
    ];
    const result = smartSearch(recipes, 'italian');
    expect(result.map((r) => r.id)).toEqual(['i1']);
  });

  it('query that is not a cuisine name does NOT trigger expansion and returns []', () => {
    const recipes: Recipe[] = [
      makeRecipe({ id: 'n1', title: 'Chicken Curry', description: 'Spicy' }),
      makeRecipe({ id: 'n2', title: 'Beef Stew', description: 'Hearty' }),
    ];
    expect(smartSearch(recipes, 'xyz')).toEqual([]);
  });

  it('CUISINE_KEYWORDS includes well-known cuisines', () => {
    expect(CUISINE_KEYWORDS.mexican).toContain('taco');
    expect(CUISINE_KEYWORDS.italian).toContain('pasta');
    expect(CUISINE_KEYWORDS.indian).toContain('tikka');
    expect(CUISINE_KEYWORDS.japanese).toContain('sushi');
  });
});

// ── smartSearch — regression guard for the focus bug ─────────────────────

describe('smartSearch — regression guard for the focus-effect cache wipe bug', () => {
  // Regression: if focus event wipes allRecipesCache while searchQuery is
  // non-empty, this is the scenario where results visibly disappear. These
  // tests document the contract the Recipes screen depends on — filtering
  // over the FULL cache vs. only a first-page slice yields different results,
  // so losing the cache mid-search = lost results for the user.

  const buildLargeCache = (): Recipe[] => {
    const page0Fillers: Recipe[] = Array.from({ length: 20 }, (_, i) =>
      makeRecipe({
        id: `p0-${i}`,
        title: `Random Dish ${i}`,
        description: 'Placeholder',
      })
    );
    const tailFillers: Recipe[] = Array.from({ length: 20 }, (_, i) =>
      makeRecipe({
        id: `tail-${i}`,
        title: `Other Dish ${i}`,
        description: 'Placeholder',
      })
    );
    const target = makeRecipe({
      id: 'target',
      title: 'Chicken Tikka Masala',
      description: 'Classic creamy curry',
    });
    // target sits at index 40 (beyond the first-page slice of 20)
    return [...page0Fillers, ...tailFillers, target];
  };

  it('over the full cache (~41 items), "chicken tikka" returns the target recipe', () => {
    const fullCache = buildLargeCache();
    const result = smartSearch(fullCache, 'chicken tikka');
    expect(result.map((r) => r.id)).toEqual(['target']);
  });

  it('over only the page-0 slice (first 20), "chicken tikka" returns [] — documents the bug scenario', () => {
    const fullCache = buildLargeCache();
    const pageSlice = fullCache.slice(0, 20);
    const result = smartSearch(pageSlice, 'chicken tikka');
    // This is precisely what the user sees when useFocusEffect wipes
    // allRecipesCache and falls back to publicRecipes (page 0).
    expect(result).toEqual([]);
  });

  it('full cache and page slice produce DIFFERENT results for the same query — the heart of the regression', () => {
    const fullCache = buildLargeCache();
    const pageSlice = fullCache.slice(0, 20);
    const fullResult = smartSearch(fullCache, 'chicken tikka');
    const sliceResult = smartSearch(pageSlice, 'chicken tikka');
    expect(fullResult.length).not.toBe(sliceResult.length);
    expect(fullResult.length).toBe(1);
    expect(sliceResult.length).toBe(0);
  });
});
