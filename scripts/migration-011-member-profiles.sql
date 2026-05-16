-- Migration 011: Surface member full_name + email
-- Run this in Supabase SQL Editor
--
-- Before this migration, the Household tab could only show "Member" + truncated
-- UUID for everyone except yourself, because auth.users is not directly
-- queryable from the client and home_members only stores user_id.
--
-- This adds a SECURITY DEFINER RPC that joins home_members with auth.users
-- and returns each member's email and full_name. Auth is enforced inside the
-- function — only members of the requested home can read its roster.

CREATE OR REPLACE FUNCTION get_home_members_with_profiles(p_home_id UUID)
RETURNS TABLE (
  id UUID,
  home_id UUID,
  user_id UUID,
  role TEXT,
  joined_at TIMESTAMPTZ,
  email TEXT,
  full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Auth check: caller must be a member of this home.
  -- Without this, any authenticated user could read any household's roster.
  IF NOT EXISTS (
    SELECT 1 FROM home_members
    WHERE home_members.home_id = p_home_id
      AND home_members.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this household';
  END IF;

  RETURN QUERY
  SELECT
    hm.id,
    hm.home_id,
    hm.user_id,
    hm.role::TEXT,
    hm.joined_at,
    au.email::TEXT,
    COALESCE(au.raw_user_meta_data->>'full_name', '')::TEXT AS full_name
  FROM home_members hm
  JOIN auth.users au ON au.id = hm.user_id
  WHERE hm.home_id = p_home_id
  ORDER BY hm.joined_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_home_members_with_profiles(UUID) TO authenticated;
