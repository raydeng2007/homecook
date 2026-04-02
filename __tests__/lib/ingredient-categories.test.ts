import { guessCategory } from '@/lib/ingredient-categories';

describe('guessCategory', () => {
  it('categorizes chicken as "meat"', () => {
    expect(guessCategory('chicken breast')).toBe('meat');
  });
  it('categorizes beef as "meat"', () => {
    expect(guessCategory('ground beef')).toBe('meat');
  });
  it('categorizes turkey as "meat"', () => {
    expect(guessCategory('ground turkey')).toBe('meat');
  });
  it('categorizes salmon as "seafood"', () => {
    expect(guessCategory('salmon fillet')).toBe('seafood');
  });
  it('categorizes shrimp as "seafood"', () => {
    expect(guessCategory('shrimp')).toBe('seafood');
  });
  it('categorizes tuna as "seafood"', () => {
    expect(guessCategory('tuna')).toBe('seafood');
  });
  it('categorizes cheddar cheese as "dairy"', () => {
    expect(guessCategory('cheddar cheese')).toBe('dairy');
  });
  it('categorizes milk as "dairy"', () => {
    expect(guessCategory('whole milk')).toBe('dairy');
  });
  it('categorizes butter as "dairy"', () => {
    expect(guessCategory('unsalted butter')).toBe('dairy');
  });
  it('categorizes onion as "produce"', () => {
    expect(guessCategory('onion')).toBe('produce');
  });
  it('categorizes spinach as "produce"', () => {
    expect(guessCategory('spinach')).toBe('produce');
  });
  it('categorizes garlic as "produce"', () => {
    expect(guessCategory('garlic clove')).toBe('produce');
  });
  it('categorizes flour as "grains"', () => {
    expect(guessCategory('all purpose flour')).toBe('grains');
  });
  it('categorizes pasta as "grains"', () => {
    expect(guessCategory('penne pasta')).toBe('grains');
  });
  it('categorizes rice as "grains"', () => {
    expect(guessCategory('jasmine rice')).toBe('grains');
  });
  it('categorizes cumin as "spices"', () => {
    expect(guessCategory('cumin')).toBe('spices');
  });
  it('categorizes salt as "spices"', () => {
    expect(guessCategory('salt')).toBe('spices');
  });
  it('categorizes paprika as "spices"', () => {
    expect(guessCategory('smoked paprika')).toBe('spices');
  });
  it('categorizes olive oil as "condiments"', () => {
    expect(guessCategory('olive oil')).toBe('condiments');
  });
  it('categorizes soy sauce as "condiments"', () => {
    expect(guessCategory('soy sauce')).toBe('condiments');
  });
  it('categorizes honey as "condiments"', () => {
    expect(guessCategory('honey')).toBe('condiments');
  });
  it('categorizes baking soda as "baking"', () => {
    expect(guessCategory('baking soda')).toBe('baking');
  });
  it('categorizes sugar as "baking"', () => {
    expect(guessCategory('sugar')).toBe('baking');
  });
  it('categorizes cocoa as "baking"', () => {
    expect(guessCategory('cocoa powder')).toBe('baking');
  });
  it('categorizes vegetable broth as "canned"', () => {
    // 'broth' matches canned pattern; 'vegetable' does not match any earlier pattern
    expect(guessCategory('vegetable broth')).toBe('canned');
  });
  it('categorizes bouillon cube as "canned"', () => {
    expect(guessCategory('bouillon cube')).toBe('canned');
  });
  it('categorizes stock as "canned"', () => {
    expect(guessCategory('vegetable stock')).toBe('canned');
  });
  it('returns "other" for unrecognized ingredient', () => {
    expect(guessCategory('xanthan gum')).toBe('other');
  });
  it('is case-insensitive', () => {
    expect(guessCategory('CHICKEN')).toBe('meat');
    expect(guessCategory('Salmon')).toBe('seafood');
  });
});
