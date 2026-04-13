-- Migration 009: Ingredient quality safety net
-- Adds "servings" unit rejection to the normalization trigger.
--
-- Run after cleanup-recipes.ts has fixed existing data.

-- ── Update the trigger function to also clean bogus units ────────────

CREATE OR REPLACE FUNCTION normalize_recipe_ingredients()
RETURNS trigger AS $$
DECLARE
  elem          jsonb;
  result        jsonb := '[]'::jsonb;
  elem_name     text;
  elem_raw_name text;
  elem_quantity text;
  elem_unit     text;
  elem_category text;
BEGIN
  IF NEW.ingredients IS NULL THEN
    NEW.normalized_ingredients := NULL;
    RETURN NEW;
  END IF;

  FOR elem IN SELECT * FROM jsonb_array_elements(NEW.ingredients)
  LOOP
    elem_raw_name := elem->>'name';
    elem_quantity := COALESCE(elem->>'quantity', '');
    elem_unit     := COALESCE(elem->>'unit', '');

    -- Skip empty ingredient names
    IF elem_raw_name IS NULL OR trim(elem_raw_name) = '' THEN
      CONTINUE;
    END IF;

    -- Normalize the ingredient name
    elem_name := normalize_ingredient_name(elem_raw_name);

    -- ── NEW: Reject bogus units ──
    IF lower(trim(elem_unit)) IN ('servings', 'serving', 'links', 'link') THEN
      elem_unit := '';
      elem_quantity := '';
    END IF;

    -- Guess category
    elem_category := guess_ingredient_category(elem_name);

    -- Build normalized entry
    result := result || jsonb_build_object(
      'name',      elem_name,
      'raw_name',  elem_raw_name,
      'quantity',  elem_quantity,
      'unit',      elem_unit,
      'category',  elem_category
    );
  END LOOP;

  NEW.normalized_ingredients := result;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Re-normalize all existing recipes to pick up the change ──────────

-- This runs the updated trigger logic on all recipes
UPDATE recipes
SET ingredients = ingredients
WHERE ingredients IS NOT NULL;

-- The trigger fires on UPDATE and re-populates normalized_ingredients
