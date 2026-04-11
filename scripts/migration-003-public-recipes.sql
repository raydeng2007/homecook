-- Migration 003: Make recipes publicly readable
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
--
-- Problem: RLS is enabled on `recipes` but no SELECT policy exists,
-- so authenticated users can only see rows they own (or none at all).
-- The import scripts used the service role key (bypasses RLS), so the
-- 669 imported recipes are invisible to the app's anon/authenticated key.

-- 1. Add a permissive SELECT policy so ALL authenticated users can read ALL recipes
CREATE POLICY "Anyone can read recipes"
  ON recipes
  FOR SELECT
  USING (true);

-- 2. Also allow public (anon) reads so the cookbook works before login too
-- (This is safe because recipes are meant to be a shared public cookbook)
CREATE POLICY "Anon can read recipes"
  ON recipes
  FOR SELECT
  TO anon
  USING (true);

-- 3. Keep INSERT/UPDATE/DELETE restricted to authenticated users only
-- (These policies may already exist — safe to run, will skip if duplicate)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'recipes' AND policyname = 'Authenticated users can insert recipes'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can insert recipes" ON recipes FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'recipes' AND policyname = 'Users can update own recipes'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update own recipes" ON recipes FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'recipes' AND policyname = 'Users can delete own recipes'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete own recipes" ON recipes FOR DELETE TO authenticated USING (created_by = auth.uid())';
  END IF;
END $$;
