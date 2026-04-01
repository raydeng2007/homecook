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
  ['#D9B991', '#B89870'], // champagne
  ['#C17F4E', '#8B5E3C'], // copper
  ['#E8C088', '#D4A054'], // light gold
  ['#8FB88E', '#5C8A5C'], // sage
  ['#E07A5F', '#C24D35'], // terracotta
  ['#A67C52', '#6B4E30'], // brown
  ['#8B3A3A', '#5C1E1E'], // dusty bordeaux
  ['#C9A882', '#8B7355'], // tan
  ['#E8B87D', '#C17F4E'], // light copper
  ['#B8A08E', '#7D6B5D'], // warm gray
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
    '#D9B991', // champagne
    '#C17F4E', // copper
    '#E8C088', // light gold
    '#8FB88E', // sage
    '#E07A5F', // terracotta
    '#A67C52', // brown
    '#C9A882', // tan
    '#B8A08E', // warm gray
  ];
  return warmColors[index % warmColors.length];
}
