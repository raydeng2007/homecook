/**
 * Client-side ingredient category detection for shopping list grouping.
 * Mirrors the logic in scripts/ingredient-normalizer.ts.
 */

import type { IngredientCategory } from '@/types/database';

// ── Category Detection ─────────────────────────────────────────────────

const CATEGORY_PATTERNS: [RegExp, IngredientCategory][] = [
  // Meat
  [/chicken|turkey|duck|beef|steak|pork|lamb|bacon|sausage|ham|veal|venison|bison|mince|meatball/i, 'meat'],
  // Seafood
  [/salmon|shrimp|prawn|tuna|cod|tilapia|crab|lobster|mussel|clam|oyster|squid|anchov|sardine|fish|scallop|mackerel/i, 'seafood'],
  // Dairy & Eggs
  [/milk|cream|cheese|butter|yogurt|yoghurt|sour cream|crème|creme|whey|ricotta|mozzarella|parmesan|cheddar|feta|brie|mascarpone|ghee|\begg\b|\beggs\b/i, 'dairy'],
  // Produce
  [/onion|garlic|tomato|potato|carrot|celery|pepper|lettuce|spinach|kale|broccoli|cauliflower|zucchini|squash|cucumber|avocado|corn|bean|pea|mushroom|ginger|lemon|lime|orange|apple|banana|berry|grape|mango|pineapple|coconut|cabbage|eggplant|radish|beet|turnip|leek|shallot|chili|jalape|herb|basil|cilantro|parsley|mint|rosemary|thyme|dill|chive|scallion|asparagus|artichoke|fennel|arugula|watercress|endive/i, 'produce'],
  // Grains & Starches
  [/flour|rice|pasta|noodle|bread|oat|cereal|couscous|quinoa|barley|bulgur|corn meal|polenta|tortilla|pita|cracker|panko|breadcrumb|spaghetti|penne|macaroni|fettuccine|lasagna|gnocchi|ramen/i, 'grains'],
  // Spices & Seasonings
  [/salt|pepper|cumin|paprika|oregano|cinnamon|nutmeg|clove|turmeric|cayenne|chili powder|garlic powder|onion powder|bay leaf|cardamom|coriander|fennel seed|mustard seed|saffron|vanilla|allspice|anise|curry|garam|seasoning|za'atar|sumac|smoked/i, 'spices'],
  // Condiments & Sauces
  [/oil|vinegar|soy sauce|ketchup|mustard|mayo|hot sauce|worcestershire|teriyaki|sriracha|hoisin|fish sauce|oyster sauce|tahini|pesto|salsa|bbq|barbecue|honey|maple|molasses|jam|jelly|relish|chutney|dressing|marinade/i, 'condiments'],
  // Baking
  [/sugar|baking soda|baking powder|yeast|cocoa|chocolate|extract|food color|sprinkle|frosting|icing|powdered sugar|brown sugar|confectioner|cornstarch|gelatin|cream of tartar/i, 'baking'],
  // Canned goods
  [/canned|can of|tin of|broth|stock|bouillon|tomato paste|tomato sauce|coconut milk|condensed/i, 'canned'],
];

/**
 * Guess the shopping category for an ingredient name.
 */
export function guessCategory(name: string): IngredientCategory {
  const lower = name.toLowerCase();
  for (const [pattern, category] of CATEGORY_PATTERNS) {
    if (pattern.test(lower)) {
      return category;
    }
  }
  return 'other';
}

// ── Display Helpers ────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  produce: 'Produce',
  dairy: 'Dairy & Eggs',
  meat: 'Meat & Poultry',
  seafood: 'Seafood',
  grains: 'Grains & Starches',
  spices: 'Spices & Seasonings',
  condiments: 'Condiments & Sauces',
  baking: 'Baking',
  canned: 'Canned & Pantry',
  frozen: 'Frozen',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<IngredientCategory, string> = {
  produce: 'leaf-outline',
  dairy: 'water-outline',
  meat: 'restaurant-outline',
  seafood: 'fish-outline',
  grains: 'nutrition-outline',
  spices: 'flask-outline',
  condiments: 'beaker-outline',
  baking: 'cafe-outline',
  canned: 'cube-outline',
  frozen: 'snow-outline',
  other: 'ellipsis-horizontal-outline',
};

export const CATEGORY_COLORS: Record<IngredientCategory, string> = {
  produce: '#66BB6A',   // green
  dairy: '#42A5F5',     // blue
  meat: '#EF5350',      // red
  seafood: '#26C6DA',   // cyan
  grains: '#FFCA28',    // amber
  spices: '#AB47BC',    // purple
  condiments: '#FF7043', // deep orange
  baking: '#8D6E63',    // brown
  canned: '#78909C',    // blue grey
  frozen: '#80DEEA',    // light cyan
  other: '#BDBDBD',     // grey
};

/** Category display order for shopping list sections */
export const CATEGORY_ORDER: IngredientCategory[] = [
  'produce',
  'meat',
  'seafood',
  'dairy',
  'grains',
  'condiments',
  'spices',
  'baking',
  'canned',
  'frozen',
  'other',
];
