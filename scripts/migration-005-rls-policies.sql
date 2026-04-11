-- Migration 005: Row Level Security (RLS) Policies
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
--
-- Enables RLS on homes, home_members, meal_plans, saved_recipes and creates
-- policies that enforce home-based data isolation. Also tightens the recipes
-- INSERT policy and hardens SECURITY DEFINER RPC functions.
--
-- Safe to re-run: uses DROP POLICY IF EXISTS before each CREATE POLICY.

-- ============================================================================
-- 1. HOMES — members can read their own home, owner can update
-- ============================================================================

ALTER TABLE homes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view own home" ON homes;
CREATE POLICY "Members can view own home" ON homes
  FOR SELECT TO authenticated
  USING (id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Owner can update home" ON homes;
CREATE POLICY "Owner can update home" ON homes
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- No INSERT/DELETE policies: all home creation/deletion happens inside
-- SECURITY DEFINER RPCs (get_or_create_home, join_home_by_code, leave_home).

-- ============================================================================
-- 2. HOME_MEMBERS — members can read, owner can write
-- ============================================================================

ALTER TABLE home_members ENABLE ROW LEVEL SECURITY;

-- Any household member can see all members of their home
DROP POLICY IF EXISTS "Members can view household" ON home_members;
CREATE POLICY "Members can view household" ON home_members
  FOR SELECT TO authenticated
  USING (home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid()));

-- Owner can add members directly
DROP POLICY IF EXISTS "Owner can add members" ON home_members;
CREATE POLICY "Owner can add members" ON home_members
  FOR INSERT TO authenticated
  WITH CHECK (
    home_id IN (
      SELECT home_id FROM home_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Owner can update member roles
DROP POLICY IF EXISTS "Owner can update members" ON home_members;
CREATE POLICY "Owner can update members" ON home_members
  FOR UPDATE TO authenticated
  USING (
    home_id IN (
      SELECT home_id FROM home_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Owner can remove members
DROP POLICY IF EXISTS "Owner can remove members" ON home_members;
CREATE POLICY "Owner can remove members" ON home_members
  FOR DELETE TO authenticated
  USING (
    home_id IN (
      SELECT home_id FROM home_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Note: join/leave RPCs use SECURITY DEFINER and bypass these policies.

-- ============================================================================
-- 3. MEAL_PLANS — household members share the calendar
-- ============================================================================

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- All household members can see the shared calendar
DROP POLICY IF EXISTS "Members can view meal plans" ON meal_plans;
CREATE POLICY "Members can view meal plans" ON meal_plans
  FOR SELECT TO authenticated
  USING (home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid()));

-- Any member can add meals to the shared calendar
DROP POLICY IF EXISTS "Members can add meal plans" ON meal_plans;
CREATE POLICY "Members can add meal plans" ON meal_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid())
    AND created_by = auth.uid()
  );

-- Any member can remove meals from the shared calendar
-- (collaborative model: everyone manages the calendar together)
DROP POLICY IF EXISTS "Members can remove meal plans" ON meal_plans;
CREATE POLICY "Members can remove meal plans" ON meal_plans
  FOR DELETE TO authenticated
  USING (home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid()));

-- ============================================================================
-- 4. SAVED_RECIPES — personal bookmarks, user-level isolation
-- ============================================================================

ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own bookmarks" ON saved_recipes;
CREATE POLICY "Users manage own bookmarks" ON saved_recipes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 5. RECIPES — tighten INSERT to check home membership
-- ============================================================================

-- Replace the overly-permissive insert policy with a home-membership check
DROP POLICY IF EXISTS "Authenticated users can insert recipes" ON recipes;
DROP POLICY IF EXISTS "Members can create recipes in own home" ON recipes;
CREATE POLICY "Members can create recipes in own home" ON recipes
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid())
      OR source IN ('themealdb', 'spoonacular')
    )
  );

-- Existing SELECT policies (anyone can read) are correct for the public cookbook.
-- Existing UPDATE/DELETE policies (created_by = auth.uid()) are already correct.

-- ============================================================================
-- 6. HARDEN RPC FUNCTIONS — add auth.uid() checks
-- ============================================================================

-- 6a. join_home_by_code: verify caller matches p_user_id
CREATE OR REPLACE FUNCTION join_home_by_code(p_user_id UUID, p_code TEXT)
RETURNS SETOF homes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_home homes;
  v_old_home_id UUID;
  v_old_member_count INT;
BEGIN
  -- Auth check: caller can only join themselves
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Find the target home by invite code
  SELECT * INTO v_target_home
  FROM homes
  WHERE invite_code = upper(trim(p_code));

  IF v_target_home IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  -- If user is already a member of this home, just return it
  IF EXISTS (
    SELECT 1 FROM home_members
    WHERE home_id = v_target_home.id AND user_id = p_user_id
  ) THEN
    RETURN NEXT v_target_home;
    RETURN;
  END IF;

  -- Find user's current home (if any)
  SELECT home_id INTO v_old_home_id
  FROM home_members
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Remove user from their old home
  IF v_old_home_id IS NOT NULL THEN
    DELETE FROM home_members
    WHERE user_id = p_user_id AND home_id = v_old_home_id;

    -- If old home is now empty, clean it up
    SELECT count(*) INTO v_old_member_count
    FROM home_members
    WHERE home_id = v_old_home_id;

    IF v_old_member_count = 0 THEN
      DELETE FROM meal_plans WHERE home_id = v_old_home_id;
      DELETE FROM homes WHERE id = v_old_home_id;
    END IF;
  END IF;

  -- Add user to the new home as a member
  INSERT INTO home_members (home_id, user_id, role)
  VALUES (v_target_home.id, p_user_id, 'member');

  RETURN NEXT v_target_home;
  RETURN;
END;
$$;

-- 6b. regenerate_invite_code: verify caller is the home owner
CREATE OR REPLACE FUNCTION regenerate_invite_code(p_home_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_code TEXT;
BEGIN
  -- Auth check: only the home owner can regenerate codes
  IF NOT EXISTS (
    SELECT 1 FROM home_members
    WHERE home_id = p_home_id AND user_id = auth.uid() AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only the home owner can regenerate invite codes';
  END IF;

  v_new_code := upper(
    substr(md5(random()::text), 1, 4) || '-' || substr(md5(random()::text), 5, 4)
  );

  UPDATE homes SET invite_code = v_new_code WHERE id = p_home_id;

  RETURN v_new_code;
END;
$$;

-- 6c. leave_home: verify caller matches p_user_id
CREATE OR REPLACE FUNCTION leave_home(p_user_id UUID)
RETURNS SETOF homes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_home_id UUID;
  v_new_home homes;
BEGIN
  -- Auth check: caller can only remove themselves
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Find current home
  SELECT home_id INTO v_old_home_id
  FROM home_members
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_old_home_id IS NULL THEN
    RAISE EXCEPTION 'Not a member of any home';
  END IF;

  -- Remove from current home
  DELETE FROM home_members
  WHERE user_id = p_user_id AND home_id = v_old_home_id;

  -- Create a fresh home for this user
  INSERT INTO homes (name, created_by)
  VALUES ('My Home', p_user_id)
  RETURNING * INTO v_new_home;

  -- Add user as owner of new home
  INSERT INTO home_members (home_id, user_id, role)
  VALUES (v_new_home.id, p_user_id, 'owner');

  RETURN NEXT v_new_home;
  RETURN;
END;
$$;

-- ============================================================================
-- DONE! Verify by checking the Policies tab in Supabase Dashboard.
-- All 5 tables should now show active RLS policies.
-- ============================================================================
