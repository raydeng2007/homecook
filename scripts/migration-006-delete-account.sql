-- Migration 006: Delete User Account
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
--
-- Creates an RPC function that permanently deletes a user's account and all
-- associated data. Required by Apple App Store and Google Play Store policies.

CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_home_id UUID;
  v_member_count INT;
BEGIN
  -- Auth check: caller can only delete themselves
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Find user's current home
  SELECT home_id INTO v_home_id
  FROM home_members
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Remove user from household
  IF v_home_id IS NOT NULL THEN
    DELETE FROM home_members
    WHERE user_id = p_user_id AND home_id = v_home_id;

    -- Check if anyone else is left in the home
    SELECT count(*) INTO v_member_count
    FROM home_members
    WHERE home_id = v_home_id;

    -- If home is now empty, clean up all shared data
    IF v_member_count = 0 THEN
      DELETE FROM meal_plans WHERE home_id = v_home_id;
      DELETE FROM recipes WHERE home_id = v_home_id AND source = 'user';
      DELETE FROM homes WHERE id = v_home_id;
    END IF;
  END IF;

  -- Delete user's personal data
  DELETE FROM saved_recipes WHERE user_id = p_user_id;

  -- Delete user's personally created recipes (in any home)
  DELETE FROM recipes WHERE created_by = p_user_id AND source = 'user';

  -- Delete the auth user (removes from auth.users)
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;
