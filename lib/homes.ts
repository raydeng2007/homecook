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
 * Get all members of a home with their profile info.
 */
export async function getHomeMembers(homeId: string): Promise<HomeMember[]> {
  const { data, error } = await supabase
    .from('home_members')
    .select('*')
    .eq('home_id', homeId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as HomeMember[];
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
