-- ============================================================================
-- Migration 012: Enable RLS on public.ingredients
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- Reason: Supabase's linter flagged public.ingredients as exposed via
-- PostgREST with RLS disabled. This is a canonical ingredient-name lookup
-- table populated only by admin import scripts (import-spoonacular.ts,
-- import-themealdb.ts) using the service role key. No client code queries
-- it — recipe ingredients live inline as JSON on the recipes row.
--
-- Enabling RLS with no policies blocks all anon + authenticated access,
-- while service-role writes (import scripts) continue to work because the
-- service role bypasses RLS.
-- ============================================================================

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

-- No policies intentionally. If a future feature (e.g. ingredient
-- autocomplete in the recipe form) needs authenticated clients to read
-- this table, add:
--
--   CREATE POLICY "authenticated can read ingredients"
--     ON public.ingredients
--     FOR SELECT
--     TO authenticated
--     USING (true);
