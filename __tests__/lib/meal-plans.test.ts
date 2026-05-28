/**
 * Tests for meal-plans library, focused on removeMealPlan — the entry
 * point that powers the "delete a planned meal" action on the Home /
 * Calendar view and the Planner screen. Locks in the contract:
 *
 *  - issues a DELETE against meal_plans where id matches
 *  - resolves void on success
 *  - rethrows the supabase error on failure (so screens can show an Alert)
 */

import { removeMealPlan } from '@/lib/meal-plans';

// ── Mock supabase client ─────────────────────────────────────────────

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

function buildDeleteChain(response: { error: unknown } = { error: null }) {
  const builder: any = {};
  builder.delete = jest.fn().mockReturnValue(builder);
  builder.eq = jest.fn().mockResolvedValue(response);
  return builder;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('removeMealPlan', () => {
  it('issues a DELETE on meal_plans filtered by id and resolves on success', async () => {
    const chain = buildDeleteChain({ error: null });
    mockFrom.mockReturnValue(chain);

    await expect(removeMealPlan('mp-123')).resolves.toBeUndefined();

    expect(mockFrom).toHaveBeenCalledWith('meal_plans');
    expect(chain.delete).toHaveBeenCalledTimes(1);
    expect(chain.eq).toHaveBeenCalledWith('id', 'mp-123');
  });

  it('throws the supabase error so callers can show an alert', async () => {
    const supabaseError = { message: 'permission denied', code: '42501' };
    const chain = buildDeleteChain({ error: supabaseError });
    mockFrom.mockReturnValue(chain);

    await expect(removeMealPlan('mp-bad')).rejects.toBe(supabaseError);
  });
});
