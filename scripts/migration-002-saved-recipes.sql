-- Migration 002: Saved/Liked recipes
-- Run this in Supabase SQL Editor

-- Table for users to save/bookmark recipes to their personal collection
CREATE TABLE IF NOT EXISTS saved_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, recipe_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user ON saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_recipe ON saved_recipes(recipe_id);
