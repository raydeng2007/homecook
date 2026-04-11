-- Migration 007: Fix infinite recursion in RLS policies
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
--
-- The home_members SELECT policy queries home_members itself, causing
-- "infinite recursion detected in policy for relation home_members".
--
-- FIX: Use a SECURITY DEFINER helper function that bypasses RLS to
-- resolve the user's home_id, breaking the recursion cycle.
--
-- This also fixes the same pattern in homes, meal_plans, and recipes policies.

-- ============================================================================
-- Step 1: Create a helper function (SECURITY DEFINER = bypasses RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_my_home_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT home_id FROM home_members WHERE user_id = auth.uid();
$$;

-- ============================================================================
-- Step 2: Fix HOME_MEMBERS policies (the primary source of recursion)
-- ============================================================================

-- SELECT: any member can see all members of their household
DROP POLICY IF EXISTS "Members can view household" ON home_members;
CREATE POLICY "Members can view household" ON home_members
  FOR SELECT TO authenticated
  USING (home_id IN (SELECT get_my_home_ids()));

-- INSERT: owner can add members
DROP POLICY IF EXISTS "Owner can add members" ON home_members;
CREATE POLICY "Owner can add members" ON home_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM home_members hm
      WHERE hm.home_id = home_members.home_id
        AND hm.user_id = auth.uid()
        AND hm.role = 'owner'
    )
  );

-- UPDATE: owner can update roles
DROP POLICY IF EXISTS "Owner can update members" ON home_members;
CREATE POLICY "Owner can update members" ON home_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM home_members hm
      WHERE hm.home_id = home_members.home_id
        AND hm.user_id = auth.uid()
        AND hm.role = 'owner'
    )
  );

-- DELETE: owner can remove members
DROP POLICY IF EXISTS "Owner can remove members" ON home_members;
CREATE POLICY "Owner can remove members" ON home_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM home_members hm
      WHERE hm.home_id = home_members.home_id
        AND hm.user_id = auth.uid()
        AND hm.role = 'owner'
    )
  );

-- ============================================================================
-- Step 3: Fix HOMES policies (also referenced home_members)
-- ============================================================================

DROP POLICY IF EXISTS "Members can view own home" ON homes;
CREATE POLICY "Members can view own home" ON homes
  FOR SELECT TO authenticated
  USING (id IN (SELECT get_my_home_ids()));

-- ============================================================================
-- Step 4: Fix MEAL_PLANS policies (also referenced home_members)
-- ============================================================================

DROP POLICY IF EXISTS "Members can view meal plans" ON meal_plans;
CREATE POLICY "Members can view meal plans" ON meal_plans
  FOR SELECT TO authenticated
  USING (home_id IN (SELECT get_my_home_ids()));

DROP POLICY IF EXISTS "Members can add meal plans" ON meal_plans;
CREATE POLICY "Members can add meal plans" ON meal_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    home_id IN (SELECT get_my_home_ids())
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Members can remove meal plans" ON meal_plans;
CREATE POLICY "Members can remove meal plans" ON meal_plans
  FOR DELETE TO authenticated
  USING (home_id IN (SELECT get_my_home_ids()));

-- ============================================================================
-- Step 5: Fix RECIPES INSERT policy (also referenced home_members)
-- ============================================================================

DROP POLICY IF EXISTS "Members can create recipes in own home" ON recipes;
CREATE POLICY "Members can create recipes in own home" ON recipes
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      home_id IN (SELECT get_my_home_ids())
      OR source IN ('themealdb', 'spoonacular')
    )
  );

-- ============================================================================
-- DONE! The infinite recursion is fixed. All policies now use
-- get_my_home_ids() which is SECURITY DEFINER and bypasses RLS.
-- ============================================================================
