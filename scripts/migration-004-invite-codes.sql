-- Migration 004: Household Invite Codes
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
--
-- Adds invite codes to households so users can join via a shareable code.
-- No email service needed — users copy/paste codes via iMessage, WhatsApp, etc.

-- 1. Add invite_code column (nullable first for backfill)
ALTER TABLE homes ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- 2. Generate codes for all existing homes
UPDATE homes
SET invite_code = upper(substr(md5(random()::text), 1, 4) || '-' || substr(md5(random()::text), 5, 4))
WHERE invite_code IS NULL;

-- 3. Make invite_code NOT NULL with auto-generation default
ALTER TABLE homes ALTER COLUMN invite_code SET NOT NULL;
ALTER TABLE homes ALTER COLUMN invite_code SET DEFAULT upper(
  substr(md5(random()::text), 1, 4) || '-' || substr(md5(random()::text), 5, 4)
);

-- 4. RPC: Join a home by invite code (atomic operation)
--    - Finds the target home by code
--    - Removes user from their old (empty) home
--    - Cleans up the old home if nobody else is in it
--    - Adds user to the new home as 'member'
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

-- 5. RPC: Regenerate invite code for a home
CREATE OR REPLACE FUNCTION regenerate_invite_code(p_home_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_code TEXT;
BEGIN
  v_new_code := upper(
    substr(md5(random()::text), 1, 4) || '-' || substr(md5(random()::text), 5, 4)
  );

  UPDATE homes SET invite_code = v_new_code WHERE id = p_home_id;

  RETURN v_new_code;
END;
$$;

-- 6. RPC: Leave a home (member removes themselves, gets a fresh home)
CREATE OR REPLACE FUNCTION leave_home(p_user_id UUID)
RETURNS SETOF homes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_home_id UUID;
  v_new_home homes;
BEGIN
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
