-- ============================================================================
-- Migration 001: Recipe Import & Ingredients System
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- 1a. Add new columns to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'user';
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_id TEXT;

-- 1b. Create ingredients lookup table (canonical names + categories)
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);

-- 1c. Dedup index: prevent re-importing the same recipe from the same source
CREATE UNIQUE INDEX IF NOT EXISTS idx_recipes_source
  ON recipes(source, source_id)
  WHERE source_id IS NOT NULL;

-- Done! Now run the import scripts.
