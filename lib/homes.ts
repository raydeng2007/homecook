import { supabase } from './supabase';
import type { Home, HomeMember } from '@/types/database';

/**
 * Get the user's home. If none exists, creates a default one and adds the
 * user as the owner.
 *
 * Uses a Supabase RPC function (SECURITY DEFINER) to bypass RLS policies
 * and avoid infinite recursion on home_members.
 */
export async function getOrCreateHome(userId: string): Promise<Home> {
  const { data, error } = await supabase.rpc('get_or_create_home', {
    p_user_id: userId,
  });

  if (error) throw error;

  // RPC returns a single row as an array
  const home = Array.isArray(data) ? data[0] : data;
  if (!home) throw new Error('Failed to get or create home');

  return home as Home;
}

/**
 * Get all members of a home, joined with auth.users so we can show their
 * full_name and email (not just a UUID).
 *
 * Uses get_home_members_with_profiles RPC (migration 011), which is
 * SECURITY DEFINER and enforces "caller must be a member of this home".
 *
 * Falls back to the bare home_members table query if the RPC doesn't exist
 * yet (e.g. user hasn't run the migration), so the household tab still
 * renders names for self while showing "Member" for others.
 */
export async function getHomeMembers(homeId: string): Promise<HomeMember[]> {
  const rpcResult = await supabase.rpc('get_home_members_with_profiles', {
    p_home_id: homeId,
  });

  // 42883 = function does not exist (migration 011 not yet applied)
  // PGRST202 = function not in schema cache
  if (rpcResult.error?.code === '42883' || rpcResult.error?.code === 'PGRST202') {
    const { data, error } = await supabase
      .from('home_members')
      .select('*')
      .eq('home_id', homeId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as HomeMember[];
  }

  if (rpcResult.error) throw rpcResult.error;
  return (rpcResult.data ?? []) as HomeMember[];
}

/**
 * Update the home name.
 */
export async function updateHomeName(
  homeId: string,
  name: string
): Promise<void> {
  const { error } = await supabase
    .from('homes')
    .update({ name })
    .eq('id', homeId);

  if (error) throw error;
}

/**
 * Remove a member from a home.
 */
export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('home_members')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
}

/**
 * Update a member's role.
 */
export async function updateMemberRole(
  memberId: string,
  role: 'owner' | 'member'
): Promise<void> {
  const { error } = await supabase
    .from('home_members')
    .update({ role })
    .eq('id', memberId);

  if (error) throw error;
}

/**
 * Add a member to a home by user ID.
 */
export async function addMemberByUserId(
  homeId: string,
  userId: string
): Promise<HomeMember> {
  const { data, error } = await supabase
    .from('home_members')
    .insert({
      home_id: homeId,
      user_id: userId,
      role: 'member',
    })
    .select()
    .single();

  if (error) throw error;
  return data as HomeMember;
}

/**
 * Join a household by invite code.
 *
 * Atomically: removes user from their old (empty) home, adds them to the
 * target home as a member. Old home is cleaned up if nobody else is in it.
 */
export async function joinHomeByCode(
  userId: string,
  code: string
): Promise<Home> {
  const { data, error } = await supabase.rpc('join_home_by_code', {
    p_user_id: userId,
    p_code: code,
  });

  if (error) throw error;

  const home = Array.isArray(data) ? data[0] : data;
  if (!home) throw new Error('Failed to join home');

  return home as Home;
}

/**
 * Regenerate the invite code for a household (owner action).
 * Returns the new code.
 */
export async function regenerateInviteCode(homeId: string): Promise<string> {
  const { data, error } = await supabase.rpc('regenerate_invite_code', {
    p_home_id: homeId,
  });

  if (error) throw error;
  return data as string;
}

/**
 * Leave the current household.
 *
 * Removes the user from their current home and creates a fresh home for them.
 * Returns the new home.
 */
export async function leaveHome(userId: string): Promise<Home> {
  const { data, error } = await supabase.rpc('leave_home', {
    p_user_id: userId,
  });

  if (error) throw error;

  const home = Array.isArray(data) ? data[0] : data;
  if (!home) throw new Error('Failed to leave home');

  return home as Home;
}

/**
 * Permanently delete the user's account and all associated data.
 *
 * Removes: home membership, personal recipes, bookmarks, meal plans,
 * and the auth user record. If the home is now empty, it's cleaned up too.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_user_account', {
    p_user_id: userId,
  });

  if (error) throw error;
}
