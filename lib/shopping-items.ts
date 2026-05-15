import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────

export type ShoppingItemKind = 'manual' | 'excluded';

export interface ShoppingItem {
  id: string;
  home_id: string;
  week_start: string; // YYYY-MM-DD
  kind: ShoppingItemKind;
  /**
   * For kind='manual':   display name (e.g. "milk")
   * For kind='excluded': aggregated key from shopping list (e.g. "banana||" or "salmon||lb")
   */
  name: string;
  checked: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────

/**
 * Get all shopping items for a home/week (both manual + excluded).
 */
export async function getShoppingItems(
  homeId: string,
  weekStart: string
): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .eq('home_id', homeId)
    .eq('week_start', weekStart)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ShoppingItem[];
}

/**
 * Add a manually-typed shopping list item.
 */
export async function addManualItem(
  homeId: string,
  weekStart: string,
  name: string,
  userId: string
): Promise<ShoppingItem> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Item name cannot be empty');

  const { data, error } = await supabase
    .from('shopping_items')
    .insert({
      home_id: homeId,
      week_start: weekStart,
      kind: 'manual',
      name: trimmed,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ShoppingItem;
}

/**
 * Hide a recipe-generated ingredient from the shopping list.
 * `key` is the aggregated `${normName}||${normUnit}` from shopping.tsx.
 * Idempotent — if the key is already excluded, returns the existing row.
 */
export async function excludeIngredient(
  homeId: string,
  weekStart: string,
  key: string,
  userId: string
): Promise<ShoppingItem> {
  const { data, error } = await supabase
    .from('shopping_items')
    .upsert(
      {
        home_id: homeId,
        week_start: weekStart,
        kind: 'excluded',
        name: key,
        created_by: userId,
      },
      { onConflict: 'home_id,week_start,name', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) throw error;
  return data as ShoppingItem;
}

/**
 * Rename a manual shopping item.
 */
export async function renameItem(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Item name cannot be empty');

  const { error } = await supabase
    .from('shopping_items')
    .update({ name: trimmed })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Toggle the checked state of any shopping item.
 */
export async function setItemChecked(id: string, checked: boolean): Promise<void> {
  const { error } = await supabase
    .from('shopping_items')
    .update({ checked })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Delete a shopping item by id.
 */
export async function removeItem(id: string): Promise<void> {
  const { error } = await supabase.from('shopping_items').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Un-hide an excluded recipe ingredient by its key.
 */
export async function unhideIngredient(
  homeId: string,
  weekStart: string,
  key: string
): Promise<void> {
  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('home_id', homeId)
    .eq('week_start', weekStart)
    .eq('kind', 'excluded')
    .eq('name', key);

  if (error) throw error;
}

// ── Realtime ─────────────────────────────────────────────────────────

/**
 * Subscribe to realtime changes for a home's shopping list.
 * Returns a channel; call `channel.unsubscribe()` to clean up.
 */
export function subscribeToShoppingItems(
  homeId: string,
  onChange: () => void
): RealtimeChannel {
  const channel = supabase
    .channel(`shopping_items:${homeId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shopping_items',
        filter: `home_id=eq.${homeId}`,
      },
      () => onChange()
    )
    .subscribe();

  return channel;
}
