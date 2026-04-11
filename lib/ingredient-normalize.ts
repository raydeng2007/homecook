/**
 * Ingredient name normalization for shopping list aggregation.
 *
 * Normalizes raw ingredient names so that variants like "Diced Onions",
 * "onion", and "Yellow Onion" all resolve to the same canonical key.
 * Recipe data in Supabase is never modified — this runs at display time only.
 */

// ── Prep words to strip from the beginning ──
const PREP_PREFIXES = new Set([
  'fresh', 'dried', 'frozen', 'canned', 'chopped', 'diced',
  'sliced', 'minced', 'grated', 'shredded', 'ground', 'whole',
  'raw', 'cooked', 'large', 'small', 'medium', 'thin', 'thick',
  'finely', 'roughly', 'thinly', 'thickly', 'lightly', 'firmly',
  'softened', 'melted', 'toasted', 'roasted', 'crushed', 'crumbled',
  'packed', 'sifted', 'peeled', 'deveined', 'boneless', 'skinless',
  'bone-in', 'skin-on', 'unsalted', 'salted', 'sweetened',
  'unsweetened', 'low-fat', 'nonfat', 'fat-free', 'reduced-fat',
  'extra-virgin', 'virgin', 'light', 'dark', 'golden', 'ripe',
  'uncooked', 'dry', 'warm', 'cold', 'hot', 'room-temperature',
]);

// ── Prep words to strip from the end ──
const PREP_SUFFIXES = new Set([
  'chopped', 'diced', 'sliced', 'minced', 'grated', 'shredded',
  'crushed', 'crumbled', 'toasted', 'roasted', 'softened', 'melted',
  'divided', 'optional', 'garnish', 'reserve',
]);

// ── Compounds where the "prep word" is part of the identity ──
const PROTECTED_COMPOUNDS = new Set([
  // Proteins
  'ground beef', 'ground pork', 'ground turkey', 'ground chicken',
  'ground lamb', 'ground veal', 'ground meat',
  // Spices (ground = form factor)
  'ground cinnamon', 'ground cumin', 'ground ginger',
  'ground nutmeg', 'ground turmeric', 'ground coriander',
  'ground cardamom', 'ground clove', 'ground allspice',
  'ground pepper', 'ground mustard', 'ground paprika',
  // Dark/light variants
  'dark chocolate', 'dark rum', 'dark soy sauce',
  'light soy sauce', 'light cream', 'light coconut milk',
  // Dry/whole/frozen as identity
  'dry sherry', 'dry white wine', 'dry red wine',
  'whole milk', 'whole wheat flour', 'whole grain mustard',
  'frozen pea', 'frozen corn', 'frozen spinach',
  'frozen berry', 'frozen banana',
  // Canned as identity
  'canned tomato', 'canned bean', 'canned chickpea',
  'canned coconut milk', 'canned tuna',
  // Roasted/toasted as identity
  'roasted garlic', 'roasted pepper', 'roasted peanut',
  'toasted sesame oil', 'toasted sesame seed',
  'chopped tomato', 'crushed tomato', 'crushed red pepper',
  // Unsalted/salted as identity for butter
  'unsalted butter', 'salted butter',
]);

// ── Words that should NOT be depluralized ──
const KEEP_PLURAL = new Set([
  'hummus', 'couscous', 'asparagus', 'citrus', 'molasses',
  'quinoa', 'polenta', 'ricotta', 'pasta', 'salsa', 'feta',
  'sriracha', 'tahini', 'miso', 'tofu', 'tempeh',
  'lemongrass', 'swiss', 'brioche', 'jus', 'surplus',
]);

// ── Synonym map: variant → canonical name ──
const SYNONYM_MAP = new Map<string, string>([
  // Herbs & aromatics
  ['cilantro', 'coriander'],
  ['coriander leaf', 'coriander'],
  ['chinese parsley', 'coriander'],
  ['scallion', 'green onion'],
  ['spring onion', 'green onion'],
  ['green shallot', 'green onion'],
  ['capsicum', 'bell pepper'],
  ['sweet pepper', 'bell pepper'],
  ['red pepper', 'red bell pepper'],
  ['green pepper', 'green bell pepper'],
  ['chilli', 'chili'],
  ['chile', 'chili'],
  ['chili pepper', 'chili'],
  ['hot pepper', 'chili'],
  ['rocket', 'arugula'],
  ['roquette', 'arugula'],
  ['flat leaf parsley', 'parsley'],
  ['flat-leaf parsley', 'parsley'],
  ['italian parsley', 'parsley'],
  ['curly parsley', 'parsley'],

  // Alliums
  ['yellow onion', 'onion'],
  ['white onion', 'onion'],
  ['brown onion', 'onion'],
  ['red shallot', 'shallot'],
  ['garlic clove', 'garlic'],
  ['clove garlic', 'garlic'],

  // Dairy & eggs
  ['heavy cream', 'heavy whipping cream'],
  ['whipping cream', 'heavy whipping cream'],
  ['double cream', 'heavy whipping cream'],
  ['single cream', 'light cream'],
  ['creme fraiche', 'crème fraiche'],
  ['plain yogurt', 'yogurt'],
  ['natural yogurt', 'yogurt'],
  ['greek-style yogurt', 'greek yogurt'],
  ['parmigiano reggiano', 'parmesan'],
  ['parmigiano', 'parmesan'],
  ['parmesan cheese', 'parmesan'],
  ['cheddar cheese', 'cheddar'],
  ['mozzarella cheese', 'mozzarella'],
  ['feta cheese', 'feta'],
  ['large egg', 'egg'],
  ['medium egg', 'egg'],

  // Oils & fats
  ['evoo', 'olive oil'],
  ['extra virgin olive oil', 'olive oil'],
  ['rapeseed oil', 'canola oil'],
  ['toasted sesame oil', 'sesame oil'],
  ['unsalted butter', 'butter'],
  ['salted butter', 'butter'],
  ['stick butter', 'butter'],

  // Condiments & sauces
  ['tamari', 'soy sauce'],
  ['shoyu', 'soy sauce'],
  ['catsup', 'ketchup'],
  ['nam pla', 'fish sauce'],
  ['nuoc mam', 'fish sauce'],
  ['sriracha sauce', 'sriracha'],
  ['hot chili sauce', 'sriracha'],
  ['wholegrain mustard', 'whole grain mustard'],
  ['whole-grain mustard', 'whole grain mustard'],
  ['mayonnaise', 'mayo'],
  ['worcestershire', 'worcestershire sauce'],

  // Starches & grains
  ['all-purpose flour', 'all purpose flour'],
  ['ap flour', 'all purpose flour'],
  ['plain flour', 'all purpose flour'],
  ['wholemeal flour', 'whole wheat flour'],
  ['wholewheat flour', 'whole wheat flour'],
  ['jasmine rice', 'rice'],
  ['basmati rice', 'rice'],
  ['long grain rice', 'rice'],
  ['long-grain rice', 'rice'],
  ['white rice', 'rice'],
  ['cornstarch', 'corn starch'],
  ['corn flour', 'corn starch'],
  ['maize starch', 'corn starch'],
  ['penne pasta', 'penne'],
  ['spaghetti pasta', 'spaghetti'],

  // Proteins
  ['beef mince', 'ground beef'],
  ['minced beef', 'ground beef'],
  ['turkey mince', 'ground turkey'],
  ['minced pork', 'ground pork'],
  ['pork mince', 'ground pork'],
  ['prawn', 'shrimp'],
  ['king prawn', 'shrimp'],

  // Canned & stock
  ['chicken broth', 'chicken stock'],
  ['beef broth', 'beef stock'],
  ['vegetable broth', 'vegetable stock'],
  ['stock cube', 'bouillon cube'],
  ['bouillon', 'bouillon cube'],
  ['tinned tomato', 'canned tomato'],
  ['chopped tomato', 'canned tomato'],
  ['crushed tomato', 'canned tomato'],
  ['tomato passata', 'tomato puree'],

  // Sugars & sweeteners
  ['granulated sugar', 'sugar'],
  ['white sugar', 'sugar'],
  ['caster sugar', 'sugar'],
  ['castor sugar', 'sugar'],
  ['icing sugar', 'powdered sugar'],
  ['confectioner sugar', 'powdered sugar'],
  ['confectioners sugar', 'powdered sugar'],

  // Spices
  ['ground black pepper', 'black pepper'],
  ['cracked pepper', 'black pepper'],
  ['sea salt', 'salt'],
  ['kosher salt', 'salt'],
  ['table salt', 'salt'],
  ['flaky salt', 'salt'],
  ['chili flake', 'red pepper flake'],
  ['chilli flake', 'red pepper flake'],
  ['crushed red pepper', 'red pepper flake'],

  // Produce
  ['aubergine', 'eggplant'],
  ['courgette', 'zucchini'],
  ['mangetout', 'snow pea'],
  ['sugar snap', 'snap pea'],
  ['butternut', 'butternut squash'],
  ['cos lettuce', 'romaine lettuce'],
  ['romaine', 'romaine lettuce'],
  ['iceberg', 'iceberg lettuce'],
  ['baby spinach', 'spinach'],
]);

// ── Depluralization ──

function depluralize(word: string): string {
  if (KEEP_PLURAL.has(word)) return word;

  // -ies → -y (berries → berry, anchovies → anchovy)
  if (word.endsWith('ies') && word.length > 4) {
    return word.slice(0, -3) + 'y';
  }
  // -lves → -lf (halves → half, calves → calf)
  // -eaves → -eaf (leaves → leaf, loaves → loaf)
  if (word.endsWith('lves') || word.endsWith('eaves') || word === 'loaves') {
    return word.slice(0, -3) + 'f';
  }
  // -ches, -shes, -sses, -xes, -zes → drop -es
  if (/(?:ch|sh|ss|x|z)es$/.test(word)) {
    return word.slice(0, -2);
  }
  // -oes → -o (tomatoes → tomato, potatoes → potato)
  if (word.endsWith('oes') && word.length > 4) {
    return word.slice(0, -2);
  }
  // -s (general, but not -ss, -us, -is)
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us') && !word.endsWith('is')) {
    return word.slice(0, -1);
  }

  return word;
}

function depluralizeLastWord(name: string): string {
  const words = name.split(' ');
  if (words.length > 0) {
    words[words.length - 1] = depluralize(words[words.length - 1]);
  }
  return words.join(' ');
}

// ── Main normalizer ──

export function normalizeIngredient(raw: string): string {
  if (!raw) return '';

  // Step 1: lowercase + trim
  let name = raw.toLowerCase().trim();

  // Step 2: strip parentheticals — (optional), (about 2 cups), (diced)
  name = name.replace(/\s*\(.*?\)\s*/g, ' ');

  // Step 3: strip stray punctuation left from removal
  name = name.replace(/^[\s,:-]+|[\s,:-]+$/g, '');

  // Step 4: collapse whitespace
  name = name.replace(/\s+/g, ' ').trim();

  if (!name) return '';

  // Step 5: check if this is a protected compound BEFORE stripping prefixes
  const depluraled = depluralizeLastWord(name);
  const isProtected = PROTECTED_COMPOUNDS.has(name) || PROTECTED_COMPOUNDS.has(depluraled);

  if (!isProtected) {
    // Step 6: strip prep prefixes (loop — handles chained prefixes)
    let words = name.split(' ');
    while (words.length > 1 && PREP_PREFIXES.has(words[0])) {
      words.shift();
    }
    name = words.join(' ');

    // Step 7: strip prep suffixes
    words = name.split(' ');
    while (words.length > 1 && PREP_SUFFIXES.has(words[words.length - 1])) {
      words.pop();
    }
    name = words.join(' ');
  }

  // Step 8: depluralize last word
  name = depluralizeLastWord(name);

  // Step 9: synonym lookup (exact match on full name)
  const canonical = SYNONYM_MAP.get(name);
  if (canonical) {
    name = canonical;
  }

  // Step 10: final trim
  return name.trim();
}

// ── Display name picker ──

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Pick the best display name from a set of raw ingredient name variants
 * that all normalized to the same key.
 * Logic: pick the most common variant (mode), break ties with shortest.
 */
export function pickDisplayName(variants: string[]): string {
  if (variants.length === 0) return '';
  if (variants.length === 1) return titleCase(variants[0]);

  // Count frequency of each lowercased variant
  const freq = new Map<string, number>();
  for (const v of variants) {
    const lower = v.toLowerCase().trim();
    freq.set(lower, (freq.get(lower) ?? 0) + 1);
  }

  // Find the most common one; break ties with shortest
  let best = variants[0].toLowerCase().trim();
  let bestCount = 0;
  for (const [name, count] of freq) {
    if (count > bestCount || (count === bestCount && name.length < best.length)) {
      best = name;
      bestCount = count;
    }
  }

  return titleCase(best);
}
