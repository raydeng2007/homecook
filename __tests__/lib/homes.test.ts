/**
 * Tests for homes library — focused on getHomeMembers which now uses an RPC
 * (migration 011) with a graceful fallback to the bare home_members table
 * if the migration hasn't been applied yet.
 */

import { getHomeMembers } from '@/lib/homes';

// ── Mock supabase client ─────────────────────────────────────────────

const mockRpc = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

function buildSelectChain(response: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  const builder: any = {};
  builder.select = jest.fn().mockReturnValue(builder);
  builder.eq = jest.fn().mockReturnValue(builder);
  builder.order = jest.fn().mockResolvedValue(response);
  return builder;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────

describe('getHomeMembers', () => {
  it('returns members with full_name and email when RPC succeeds', async () => {
    const fakeMembers = [
      {
        id: 'm1',
        home_id: 'h1',
        user_id: 'u1',
        role: 'owner',
        joined_at: '2026-01-01',
        email: 'alice@example.com',
        full_name: 'Alice Smith',
      },
      {
        id: 'm2',
        home_id: 'h1',
        user_id: 'u2',
        role: 'member',
        joined_at: '2026-01-02',
        email: 'bob@example.com',
        full_name: 'Bob Jones',
      },
    ];

    mockRpc.mockResolvedValue({ data: fakeMembers, error: null });

    const result = await getHomeMembers('h1');

    expect(mockRpc).toHaveBeenCalledWith('get_home_members_with_profiles', {
      p_home_id: 'h1',
    });
    expect(result).toEqual(fakeMembers);
    expect(result[0].full_name).toBe('Alice Smith');
    expect(result[1].email).toBe('bob@example.com');
  });

  it('falls back to direct table query when RPC does not exist (42883)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: '42883', message: 'function does not exist' } });

    const fakeMembers = [
      { id: 'm1', home_id: 'h1', user_id: 'u1', role: 'owner', joined_at: '2026-01-01' },
    ];
    const selectChain = buildSelectChain({ data: fakeMembers, error: null });
    mockFrom.mockReturnValue(selectChain);

    const result = await getHomeMembers('h1');

    expect(mockFrom).toHaveBeenCalledWith('home_members');
    expect(selectChain.eq).toHaveBeenCalledWith('home_id', 'h1');
    expect(result).toEqual(fakeMembers);
  });

  it('falls back to direct table query when RPC not in schema cache (PGRST202)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'Not found' } });

    const selectChain = buildSelectChain({ data: [], error: null });
    mockFrom.mockReturnValue(selectChain);

    const result = await getHomeMembers('h1');

    expect(mockFrom).toHaveBeenCalledWith('home_members');
    expect(result).toEqual([]);
  });

  it('throws when the RPC returns a non-missing-function error', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'permission denied' },
    });

    await expect(getHomeMembers('h1')).rejects.toMatchObject({ code: '42501' });
    // Should NOT have attempted the fallback
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns empty array when RPC returns null data', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const result = await getHomeMembers('h1');
    expect(result).toEqual([]);
  });
});
