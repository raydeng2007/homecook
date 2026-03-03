/**
 * Ingredient normalization & auto-categorization.
 * Shared by all import scripts.
 */

export type IngredientCategory =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'seafood'
  | 'grains'
  | 'spices'
  | 'condiments'
  | 'baking'
  | 'canned'
  | 'frozen'
  | 'other';

// ── Name Normalization ─────────────────────────────────────────────────

/**
 * Normalize an ingredient name to a canonical form.
 * - Lowercase
 * - Trim whitespace
 * - Remove parenthetical notes, e.g. "(optional)"
 * - Remove leading "fresh ", "dried ", etc.
 * - Basic singular form
 */
export function normalizeName(raw: string): string {
  let name = raw
    .toLowerCase()
    .trim()
    .replace(/\s*\(.*?\)\s*/g, '') // remove (optional), (diced), etc.
    .replace(/\s+/g, ' ')          // collapse whitespace
    .trim();

  // Remove common prefixes that don't change the ingredient identity
  const prefixes = [
    'fresh ', 'dried ', 'frozen ', 'canned ', 'chopped ',
    'diced ', 'sliced ', 'minced ', 'grated ', 'shredded ',
    'ground ', 'whole ', 'raw ', 'cooked ', 'large ', 'small ',
    'medium ', 'thin ', 'thick ', 'finely ', 'roughly ',
  ];

  for (const prefix of prefixes) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length);
    }
  }

  // Basic depluralization (very simple, handles common cases)
  if (name.endsWith('ies') && name.length > 4) {
    // e.g. "berries" → "berry"
    name = name.slice(0, -3) + 'y';
  } else if (name.endsWith('ves')) {
    // e.g. "halves" → "half" (not perfect, but fine for search)
    name = name.slice(0, -3) + 'f';
  } else if (name.endsWith('es') && !name.endsWith('ches') && !name.endsWith('shes')) {
    // e.g. "tomatoes" → "tomato"
    name = name.slice(0, -2);
  } else if (name.endsWith('s') && !name.endsWith('ss') && !name.endsWith('us')) {
    name = name.slice(0, -1);
  }

  return name.trim();
}

// ── Category Detection ─────────────────────────────────────────────────

const CATEGORY_PATTERNS: [RegExp, IngredientCategory][] = [
  // Meat
  [/chicken|turkey|duck|beef|steak|pork|lamb|bacon|sausage|ham|veal|venison|bison|mince|meatball/i, 'meat'],
  // Seafood
  [/salmon|shrimp|prawn|tuna|cod|tilapia|crab|lobster|mussel|clam|oyster|squid|anchov|sardine|fish|scallop|mackerel/i, 'seafood'],
  // Dairy
  [/milk|cream|cheese|butter|yogurt|yoghurt|sour cream|crème|creme|whey|ricotta|mozzarella|parmesan|cheddar|feta|brie|mascarpone|ghee/i, 'dairy'],
  // Produce
  [/onion|garlic|tomato|potato|carrot|celery|pepper|lettuce|spinach|kale|broccoli|cauliflower|zucchini|squash|cucumber|avocado|corn|bean|pea|mushroom|ginger|lemon|lime|orange|apple|banana|berry|grape|mango|pineapple|coconut|cabbage|eggplant|radish|beet|turnip|leek|shallot|chili|jalape|herb|basil|cilantro|parsley|mint|rosemary|thyme|dill|chive|scallion|asparagus|artichoke|fennel|arugula|watercress|endive/i, 'produce'],
  // Grains & Starches
  [/flour|rice|pasta|noodle|bread|oat|cereal|couscous|quinoa|barley|bulgur|corn meal|polenta|tortilla|pita|cracker|panko|breadcrumb|spaghetti|penne|macaroni|fettuccine|lasagna|gnocchi|ramen/i, 'grains'],
  // Spices & Seasonings
  [/salt|pepper|cumin|paprika|oregano|basil|thyme|rosemary|cinnamon|nutmeg|clove|ginger|turmeric|cayenne|chili powder|garlic powder|onion powder|bay leaf|cardamom|coriander|fennel seed|mustard seed|saffron|vanilla|allspice|anise|curry|garam|seasoning|za'atar|sumac|smoked/i, 'spices'],
  // Condiments & Sauces
  [/oil|vinegar|soy sauce|ketchup|mustard|mayo|hot sauce|worcestershire|teriyaki|sriracha|hoisin|fish sauce|oyster sauce|tahini|pesto|salsa|bbq|barbecue|honey|maple|molasses|jam|jelly|relish|chutney|dressing|marinade/i, 'condiments'],
  // Baking
  [/sugar|baking soda|baking powder|yeast|cocoa|chocolate|extract|food color|sprinkle|frosting|icing|powdered sugar|brown sugar|confectioner|cornstarch|gelatin|cream of tartar/i, 'baking'],
  // Canned goods
  [/canned|can of|tin of|broth|stock|bouillon|tomato paste|tomato sauce|coconut milk|condensed/i, 'canned'],
  // Eggs (dairy-adjacent)
  [/\begg\b|\beggs\b/i, 'dairy'],
];

/**
 * Guess the category for an ingredient based on keyword matching.
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

// ── Quantity Parsing ────────────────────────────────────────────────────

/**
 * Parse a measurement string into { quantity, unit }.
 * Handles cases like "2 cups", "1/2 tsp", "1 1/2 tablespoons", "pinch"
 */
export function parseMeasure(measure: string): { quantity: string; unit: string } {
  const cleaned = measure.trim();
  if (!cleaned) return { quantity: '', unit: '' };

  // Match number (integer, decimal, fraction, mixed) followed by optional unit
  const match = cleaned.match(
    /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+\.?\d*)\s*(.*)/
  );

  if (match) {
    let qty = match[1].trim();
    const unit = match[2].trim();

    // Convert fractions to decimal for easier aggregation
    if (qty.includes('/')) {
      const parts = qty.split(/\s+/);
      let total = 0;
      for (const part of parts) {
        if (part.includes('/')) {
          const [num, den] = part.split('/');
          total += parseInt(num) / parseInt(den);
        } else {
          total += parseFloat(part);
        }
      }
      qty = total.toString();
    }

    return { quantity: qty, unit };
  }

  // No number found — treat entire string as unit (e.g., "pinch", "to taste")
  return { quantity: '', unit: cleaned };
}
