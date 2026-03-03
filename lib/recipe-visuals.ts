/**
 * Deterministic visual styles for recipes.
 * Maps recipe IDs to gradient colors + food emojis for consistent visuals
 * without needing image_url in the database.
 */

export type RecipeVisual = {
  gradientColors: [string, string];
  emoji: string;
  backgroundColor: string;
};

const GRADIENT_PALETTES: [string, string][] = [
  ['#FF8A65', '#E64A19'], // warm orange
  ['#CE93D8', '#7B1FA2'], // deep purple
  ['#80CBC4', '#00695C'], // teal
  ['#FFD54F', '#F9A825'], // amber
  ['#A5D6A7', '#2E7D32'], // green
  ['#EF9A9A', '#C62828'], // coral red
  ['#90CAF9', '#1565C0'], // blue
  ['#FFAB91', '#BF360C'], // deep orange
  ['#B39DDB', '#4527A0'], // indigo
  ['#FFF176', '#F57F17'], // yellow
];

const FOOD_EMOJIS = [
  '🍝', '🥗', '🍲', '🥘', '🍛',
  '🍕', '🥩', '🍣', '🥑', '🍜',
  '🌮', '🥪', '🍱', '🧆', '🥐',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export function getRecipeVisual(recipeId: string): RecipeVisual {
  const hash = hashString(recipeId);
  const palette = GRADIENT_PALETTES[hash % GRADIENT_PALETTES.length];
  const emoji = FOOD_EMOJIS[hash % FOOD_EMOJIS.length];

  return {
    gradientColors: palette,
    emoji,
    backgroundColor: palette[0],
  };
}

/**
 * Get a warm background color for a card at a specific index.
 * Useful for list items where each card should have a different warm color.
 */
export function getWarmColor(index: number): string {
  const warmColors = [
    '#FF8A65', // orange
    '#FFB74D', // light orange
    '#FFD54F', // amber
    '#A5D6A7', // green
    '#80CBC4', // teal
    '#CE93D8', // purple
    '#EF9A9A', // pink
    '#90CAF9', // blue
  ];
  return warmColors[index % warmColors.length];
}
