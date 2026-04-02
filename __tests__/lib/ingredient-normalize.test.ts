import { normalizeIngredient, pickDisplayName } from '@/lib/ingredient-normalize';

// ── normalizeIngredient ───────────────────────────────────────────────────

describe('normalizeIngredient — empty / whitespace', () => {
  it('returns "" for empty string', () => {
    expect(normalizeIngredient('')).toBe('');
  });
  it('returns "" for whitespace-only string', () => {
    expect(normalizeIngredient('   ')).toBe('');
  });
});

describe('normalizeIngredient — basic normalization', () => {
  it('lowercases input', () => {
    expect(normalizeIngredient('ONION')).toBe('onion');
  });
  it('depluralizses "onions" to "onion"', () => {
    expect(normalizeIngredient('onions')).toBe('onion');
  });
  it('handles capitalized plural "Tomatoes"', () => {
    expect(normalizeIngredient('Tomatoes')).toBe('tomato');
  });
  it('trims surrounding whitespace', () => {
    expect(normalizeIngredient('  garlic  ')).toBe('garlic');
  });
});

describe('normalizeIngredient — prep prefix stripping', () => {
  it('strips "diced" prefix', () => {
    expect(normalizeIngredient('diced onion')).toBe('onion');
  });
  it('strips "fresh" prefix', () => {
    expect(normalizeIngredient('fresh garlic')).toBe('garlic');
  });
  it('strips "chopped" prefix', () => {
    expect(normalizeIngredient('chopped celery')).toBe('celery');
  });
  it('strips chained prefixes ("finely chopped")', () => {
    expect(normalizeIngredient('finely chopped onion')).toBe('onion');
  });
});

describe('normalizeIngredient — prep suffix stripping', () => {
  it('strips "divided" suffix', () => {
    expect(normalizeIngredient('onion divided')).toBe('onion');
  });
  it('strips "optional" suffix', () => {
    expect(normalizeIngredient('chili optional')).toBe('chili');
  });
});

describe('normalizeIngredient — parenthetical stripping', () => {
  it('strips parenthetical "(about 2 cups)"', () => {
    expect(normalizeIngredient('onion (about 2 cups)')).toBe('onion');
  });
  it('strips parenthetical "(optional)"', () => {
    expect(normalizeIngredient('garlic (optional)')).toBe('garlic');
  });
});

describe('normalizeIngredient — protected compounds', () => {
  it('preserves "ground beef" (prep word is identity)', () => {
    expect(normalizeIngredient('ground beef')).toBe('ground beef');
  });
  it('preserves "ground cinnamon"', () => {
    expect(normalizeIngredient('ground cinnamon')).toBe('ground cinnamon');
  });
  it('preserves "dark chocolate"', () => {
    expect(normalizeIngredient('dark chocolate')).toBe('dark chocolate');
  });
  it('preserves "roasted garlic"', () => {
    expect(normalizeIngredient('roasted garlic')).toBe('roasted garlic');
  });
  it('"unsalted butter" resolves to "butter" via synonym map', () => {
    // unsalted butter is in PROTECTED_COMPOUNDS (prefix not stripped)
    // but SYNONYM_MAP maps 'unsalted butter' → 'butter'
    expect(normalizeIngredient('unsalted butter')).toBe('butter');
  });
});

describe('normalizeIngredient — synonym map', () => {
  it('"cilantro" → "coriander"', () => {
    expect(normalizeIngredient('cilantro')).toBe('coriander');
  });
  it('"evoo" → "olive oil"', () => {
    expect(normalizeIngredient('evoo')).toBe('olive oil');
  });
  it('"scallion" → "green onion"', () => {
    expect(normalizeIngredient('scallion')).toBe('green onion');
  });
  it('"capsicum" → "bell pepper"', () => {
    expect(normalizeIngredient('capsicum')).toBe('bell pepper');
  });
  it('"yellow onion" → "onion"', () => {
    expect(normalizeIngredient('yellow onion')).toBe('onion');
  });
  it('"aubergine" → "eggplant"', () => {
    expect(normalizeIngredient('aubergine')).toBe('eggplant');
  });
  it('"sea salt" → "salt"', () => {
    expect(normalizeIngredient('sea salt')).toBe('salt');
  });
  it('"tamari" → "soy sauce"', () => {
    expect(normalizeIngredient('tamari')).toBe('soy sauce');
  });
});

describe('normalizeIngredient — KEEP_PLURAL (not depluralized)', () => {
  it('does not depluralize "hummus"', () => {
    expect(normalizeIngredient('hummus')).toBe('hummus');
  });
  it('does not depluralize "pasta"', () => {
    expect(normalizeIngredient('pasta')).toBe('pasta');
  });
  it('does not depluralize "quinoa"', () => {
    expect(normalizeIngredient('quinoa')).toBe('quinoa');
  });
});

describe('normalizeIngredient — Unicode ingredients', () => {
  it('handles accented characters without returning empty string', () => {
    const result = normalizeIngredient('crème fraîche');
    expect(result.length).toBeGreaterThan(0);
  });
  it('lowercases accented characters', () => {
    const result = normalizeIngredient('Crème Fraîche');
    expect(result).toBe(normalizeIngredient('crème fraîche'));
  });
});

describe('normalizeIngredient — depluralize edge cases', () => {
  it('"berries" → "berry" (-ies)', () => {
    expect(normalizeIngredient('berries')).toBe('berry');
  });
  it('"tomatoes" → "tomato" (-oes)', () => {
    expect(normalizeIngredient('tomatoes')).toBe('tomato');
  });
  it('"leaves" → "leaf" (-eaves)', () => {
    expect(normalizeIngredient('leaves')).toBe('leaf');
  });
});

// ── pickDisplayName ───────────────────────────────────────────────────────

describe('pickDisplayName', () => {
  it('returns "" for empty array', () => {
    expect(pickDisplayName([])).toBe('');
  });
  it('returns title-cased single variant', () => {
    expect(pickDisplayName(['onion'])).toBe('Onion');
  });
  it('title-cases a multi-word single variant', () => {
    expect(pickDisplayName(['green onion'])).toBe('Green Onion');
  });
  it('picks the most frequent variant (mode)', () => {
    // 'onion' appears twice, 'onions' once
    expect(pickDisplayName(['onions', 'onion', 'onion'])).toBe('Onion');
  });
  it('is case-insensitive when counting frequency', () => {
    // 'onion' in different cases — all count as same
    expect(pickDisplayName(['Onions', 'ONION', 'onion'])).toBe('Onion');
  });
  it('breaks ties by shorter name', () => {
    // 'abc' and 'ab' each appear once — 'ab' wins (shorter)
    const result = pickDisplayName(['abc', 'ab']);
    expect(result).toBe('Ab');
  });
  it('title-cases the winning variant', () => {
    expect(pickDisplayName(['olive oil', 'olive oil'])).toBe('Olive Oil');
  });
});
