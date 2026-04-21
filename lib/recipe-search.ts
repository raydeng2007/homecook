import type { Recipe } from '@/types/database';

// ── Smart search: keyword matching across title, description, category, ingredients ──

export const CUISINE_KEYWORDS: Record<string, string[]> = {
  mexican: ['taco', 'burrito', 'enchilada', 'quesadilla', 'salsa', 'guacamole', 'tortilla', 'nacho', 'fajita', 'churro', 'tamale'],
  italian: ['pasta', 'pizza', 'risotto', 'lasagna', 'lasagne', 'gnocchi', 'pesto', 'bruschetta', 'tiramisu', 'carbonara', 'bolognese', 'ravioli', 'fettuccine', 'penne', 'spaghetti', 'crostini', 'panzanella', 'caprese'],
  chinese: ['stir fry', 'wok', 'dumpling', 'dim sum', 'fried rice', 'lo mein', 'chow mein', 'kung pao', 'sweet and sour', 'spring roll', 'szechuan', 'mapo'],
  japanese: ['sushi', 'ramen', 'teriyaki', 'tempura', 'miso', 'udon', 'sashimi', 'katsu', 'gyoza', 'onigiri', 'matcha'],
  indian: ['curry', 'tikka', 'masala', 'naan', 'biryani', 'tandoori', 'samosa', 'dal', 'paneer', 'vindaloo', 'korma', 'chutney'],
  thai: ['pad thai', 'curry', 'satay', 'tom yum', 'green curry', 'red curry', 'massaman', 'basil chicken'],
  french: ['croissant', 'ratatouille', 'quiche', 'crepe', 'souffle', 'bouillabaisse', 'coq au vin', 'crème brûlée', 'baguette', 'brioche'],
  mediterranean: ['hummus', 'falafel', 'tabbouleh', 'shawarma', 'pita', 'tzatziki', 'dolma', 'baklava', 'fattoush'],
  american: ['burger', 'bbq', 'barbecue', 'mac and cheese', 'fried chicken', 'cornbread', 'coleslaw', 'hot dog', 'biscuit'],
  korean: ['bibimbap', 'kimchi', 'bulgogi', 'japchae', 'tteokbokki', 'galbi', 'banchan'],
};

/** Keyword search across recipe title, description, category, and ingredient names. Expands cuisine names to their dishes (e.g. "mexican" -> ["taco", "burrito", ...]). */
export function smartSearch(recipes: Recipe[], query: string): Recipe[] {
  const q = query.toLowerCase().trim();
  if (!q) return recipes;

  const expandedTerms = [q];
  for (const [cuisine, keywords] of Object.entries(CUISINE_KEYWORDS)) {
    if (q.includes(cuisine)) {
      expandedTerms.push(...keywords);
    }
  }

  const queryTerms = q.split(/\s+/).filter(Boolean);

  return recipes.filter((r) => {
    const title = r.title.toLowerCase();
    const desc = r.description.toLowerCase();
    const cat = (r.category ?? '').toLowerCase();
    const ingNames = r.ingredients.map((i) => i.name.toLowerCase()).join(' ');
    const searchable = `${title} ${desc} ${cat} ${ingNames}`;

    for (const term of expandedTerms) {
      if (searchable.includes(term)) return true;
    }

    if (queryTerms.length > 1) {
      return queryTerms.every((term) => searchable.includes(term));
    }

    return false;
  });
}
