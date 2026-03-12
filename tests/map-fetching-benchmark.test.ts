import { describe, it, expect, vi } from 'vitest';
import { fetchMapData } from '../app/(public)/map/fetch-map-data';
import { SupabaseClient } from '@supabase/supabase-js';

// Minimal valid shape for the test logic (we only use id and legacy_id for mapping)
const MOCK_SHOPS = [
  {
    id: 'uuid-1',
    legacy_id: 1,
    name: 'Shop 1',
    // ... allow other fields to be missing for this specific test as we cast or just need the structure for the logic
  }
];

const MOCK_ESTIMATES = [
  {
    shop_id: 'uuid-1',
    label: 'Open',
    p: 0.9,
    n_eff: 10,
    vendor_override: false,
    evidence_summary: 'Test',
  }
];

describe('fetchMapData Concurrency', () => {
  it('initiates both requests in parallel', async () => {
    // 1. Create controlled promises to pause execution
    let resolveShops: (value: any) => void;
    const shopsPromise = new Promise(resolve => {
      resolveShops = resolve;
    });

    let resolveEstimates: (value: any) => void;
    const estimatesPromise = new Promise(resolve => {
      resolveEstimates = resolve;
    });

    // 2. Mock Supabase client
    const mockOrder = vi.fn().mockReturnValue(shopsPromise);
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    const mockRpc = vi.fn().mockReturnValue(estimatesPromise);

    const supabase = {
      from: mockFrom,
      rpc: mockRpc,
    } as unknown as SupabaseClient;

    // 3. Start the fetch
    const fetchPromise = fetchMapData(supabase);

    // 4. Verification: Both chains should have been built/called *before* we resolve anything.
    // This confirms they are not awaiting each other.
    expect(mockFrom).toHaveBeenCalledWith('shops');
    expect(mockSelect).toHaveBeenCalled(); // .select(...)
    expect(mockOrder).toHaveBeenCalled();  // .order(...) - this is the "request" being built/sent

    expect(mockRpc).toHaveBeenCalledWith('get_shop_attendance_estimates', expect.any(Object));

    // 5. Resolve the promises with data
    if (resolveShops!) resolveShops({ data: MOCK_SHOPS });
    if (resolveEstimates!) resolveEstimates({ data: MOCK_ESTIMATES });

    // 6. Await the result
    const result = await fetchPromise;

    // 7. Assert correct data processing
    expect(result.shopRows).toHaveLength(1);
    expect(result.attendanceEstimates[1]).toBeDefined();
    expect(result.attendanceEstimates[1].label).toBe('Open');
  });
});
