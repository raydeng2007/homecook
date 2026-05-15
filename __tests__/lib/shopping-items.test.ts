/**
 * Tests for shopping-items library.
 *
 * These tests mock the Supabase client and verify the data layer functions
 * call the right tables with the right arguments. The actual realtime sync
 * and RLS policies are tested separately via integration tests in Supabase.
 */

import {
  getShoppingItems,
  addManualItem,
  excludeIngredient,
  renameItem,
  setItemChecked,
  removeItem,
  unhideIngredient,
} from '@/lib/shopping-items';

// ── Supabase mock ────────────────────────────────────────────────────

type Stage = {
  select?: jest.Mock;
  insert?: jest.Mock;
  update?: jest.Mock;
  upsert?: jest.Mock;
  delete?: jest.Mock;
  eq?: jest.Mock;
  order?: jest.Mock;
  single?: jest.Mock;
};

let lastBuilder: Stage;

function makeBuilder(response: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  const builder: Stage = {};
  const chain = () => builder as any;

  builder.select = jest.fn(chain);
  builder.insert = jest.fn(chain);
  builder.update = jest.fn(chain);
  builder.upsert = jest.fn(chain);
  builder.delete = jest.fn(chain);
  builder.eq = jest.fn(chain);
  builder.order = jest.fn().mockResolvedValue(response);
  builder.single = jest.fn().mockResolvedValue(response);

  // For methods that resolve immediately without .single() or .order()
  // (e.g. update/delete chains), make the chain thenable.
  Object.assign(builder, {
    then: (resolve: (v: typeof response) => void) => resolve(response),
  });

  lastBuilder = builder;
  return builder;
}

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from '@/lib/supabase';
const mockFrom = supabase.from as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────

describe('shopping-items library', () => {
  describe('getShoppingItems', () => {
    it('queries the shopping_items table filtered by home + week', async () => {
      const fakeItems = [{ id: '1', name: 'milk', kind: 'manual' }];
      mockFrom.mockReturnValue(makeBuilder({ data: fakeItems, error: null }));

      const result = await getShoppingItems('home-1', '2026-05-04');

      expect(mockFrom).toHaveBeenCalledWith('shopping_items');
      expect(lastBuilder.select).toHaveBeenCalledWith('*');
      expect(lastBuilder.eq).toHaveBeenCalledWith('home_id', 'home-1');
      expect(lastBuilder.eq).toHaveBeenCalledWith('week_start', '2026-05-04');
      expect(result).toEqual(fakeItems);
    });

    it('returns empty array when DB returns null data', async () => {
      mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }));
      const result = await getShoppingItems('home-1', '2026-05-04');
      expect(result).toEqual([]);
    });

    it('throws when DB returns an error', async () => {
      mockFrom.mockReturnValue(makeBuilder({ data: null, error: new Error('db down') }));
      await expect(getShoppingItems('home-1', '2026-05-04')).rejects.toThrow('db down');
    });
  });

  describe('addManualItem', () => {
    it('inserts a manual item with trimmed name', async () => {
      const fakeItem = { id: '1', name: 'milk', kind: 'manual' };
      mockFrom.mockReturnValue(makeBuilder({ data: fakeItem, error: null }));

      await addManualItem('home-1', '2026-05-04', '  milk  ', 'user-1');

      expect(lastBuilder.insert).toHaveBeenCalledWith({
        home_id: 'home-1',
        week_start: '2026-05-04',
        kind: 'manual',
        name: 'milk',
        created_by: 'user-1',
      });
    });

    it('rejects empty/whitespace-only names', async () => {
      await expect(addManualItem('home-1', '2026-05-04', '   ', 'user-1')).rejects.toThrow(
        'Item name cannot be empty'
      );
      // Should not have hit the DB
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('excludeIngredient', () => {
    it('upserts an excluded ingredient by aggregated key', async () => {
      const fakeItem = { id: '1', name: 'banana||', kind: 'excluded' };
      mockFrom.mockReturnValue(makeBuilder({ data: fakeItem, error: null }));

      await excludeIngredient('home-1', '2026-05-04', 'banana||', 'user-1');

      expect(lastBuilder.upsert).toHaveBeenCalledWith(
        {
          home_id: 'home-1',
          week_start: '2026-05-04',
          kind: 'excluded',
          name: 'banana||',
          created_by: 'user-1',
        },
        { onConflict: 'home_id,week_start,name', ignoreDuplicates: false }
      );
    });
  });

  describe('renameItem', () => {
    it('updates the name field with trimmed value', async () => {
      mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }));
      await renameItem('item-1', '  paper towels  ');
      expect(lastBuilder.update).toHaveBeenCalledWith({ name: 'paper towels' });
      expect(lastBuilder.eq).toHaveBeenCalledWith('id', 'item-1');
    });

    it('rejects empty names', async () => {
      await expect(renameItem('item-1', '   ')).rejects.toThrow('Item name cannot be empty');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('setItemChecked', () => {
    it('updates the checked field', async () => {
      mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }));
      await setItemChecked('item-1', true);
      expect(lastBuilder.update).toHaveBeenCalledWith({ checked: true });
      expect(lastBuilder.eq).toHaveBeenCalledWith('id', 'item-1');
    });
  });

  describe('removeItem', () => {
    it('deletes the row by id', async () => {
      mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }));
      await removeItem('item-1');
      expect(lastBuilder.delete).toHaveBeenCalled();
      expect(lastBuilder.eq).toHaveBeenCalledWith('id', 'item-1');
    });
  });

  describe('unhideIngredient', () => {
    it('deletes the excluded row matching home + week + key', async () => {
      mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }));
      await unhideIngredient('home-1', '2026-05-04', 'banana||');

      expect(lastBuilder.delete).toHaveBeenCalled();
      expect(lastBuilder.eq).toHaveBeenCalledWith('home_id', 'home-1');
      expect(lastBuilder.eq).toHaveBeenCalledWith('week_start', '2026-05-04');
      expect(lastBuilder.eq).toHaveBeenCalledWith('kind', 'excluded');
      expect(lastBuilder.eq).toHaveBeenCalledWith('name', 'banana||');
    });
  });
});
