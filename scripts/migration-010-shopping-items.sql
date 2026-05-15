-- Migration 010: Shared shopping list items
-- Run this in Supabase SQL Editor
--
-- Adds a `shopping_items` table so household members see the same shopping
-- list — both manually-added items (e.g., "milk", "paper towels") and any
-- recipe-generated ingredients a user has hidden ("excluded") from the list.
--
-- Scoped per (home_id, week_start) so the list resets each week and members
-- never see each other's last-week items.

CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday of the week (YYYY-MM-DD)
  kind TEXT NOT NULL CHECK (kind IN ('manual', 'excluded')),
  -- For kind='manual':   name is the display string (e.g. "milk")
  -- For kind='excluded': name is the aggregated key (e.g. "banana||" or "salmon||lb")
  name TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shopping_items_home_week
  ON shopping_items(home_id, week_start);

-- Prevent duplicate excludes for the same key in the same week
CREATE UNIQUE INDEX IF NOT EXISTS idx_shopping_items_unique_exclude
  ON shopping_items(home_id, week_start, name)
  WHERE kind = 'excluded';

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_shopping_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shopping_items_updated_at ON shopping_items;
CREATE TRIGGER shopping_items_updated_at
  BEFORE UPDATE ON shopping_items
  FOR EACH ROW
  EXECUTE FUNCTION update_shopping_items_updated_at();

-- ============================================================================
-- RLS — household members share the shopping list
-- ============================================================================

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view shopping items" ON shopping_items;
CREATE POLICY "Members can view shopping items" ON shopping_items
  FOR SELECT TO authenticated
  USING (home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Members can add shopping items" ON shopping_items;
CREATE POLICY "Members can add shopping items" ON shopping_items
  FOR INSERT TO authenticated
  WITH CHECK (
    home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid())
    AND created_by = auth.uid()
  );

-- Any member can update (check off, rename) any item — collaborative model
DROP POLICY IF EXISTS "Members can update shopping items" ON shopping_items;
CREATE POLICY "Members can update shopping items" ON shopping_items
  FOR UPDATE TO authenticated
  USING (home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid()));

-- Any member can delete any item — collaborative model
DROP POLICY IF EXISTS "Members can delete shopping items" ON shopping_items;
CREATE POLICY "Members can delete shopping items" ON shopping_items
  FOR DELETE TO authenticated
  USING (home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid()));

-- ============================================================================
-- Realtime — enable Supabase realtime for live sync across household members
-- ============================================================================

-- Add table to the realtime publication (safe if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'shopping_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shopping_items;
  END IF;
END $$;
