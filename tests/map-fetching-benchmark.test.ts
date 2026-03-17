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
    const mockGt = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockImplementation(function (this: any, arg) {
        // the mock doesn't have a good way to know the table name from `this` in this simple mock
        // We'll just assume any select with 'expires_at' or 'body' is vendor_contents
        if (arg && typeof arg === 'string' && arg.includes('expires_at')) {
            return { gt: mockGt };
        }
        return shopsPromise;
    });
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
    expect(mockFrom).toHaveBeenCalledWith('vendors');
    expect(mockFrom).toHaveBeenCalledWith('categories');
    expect(mockFrom).toHaveBeenCalledWith('products');
    expect(mockFrom).toHaveBeenCalledWith('market_locations');
    expect(mockFrom).toHaveBeenCalledWith('location_assignments');
    expect(mockFrom).toHaveBeenCalledWith('vendor_contents');
    expect(mockSelect).toHaveBeenCalled(); // .select(...)

    expect(mockRpc).toHaveBeenCalledWith('get_shop_attendance_estimates', expect.any(Object));

    // 5. Resolve the promises with data
    // fetchShopsFromDb awaits an array of 6 responses from Supabase
    if (resolveShops!) resolveShops({ data: [] });
    if (resolveEstimates!) resolveEstimates({ data: MOCK_ESTIMATES });

    // 6. Await the result
    const result = await fetchPromise;

    // 7. Assert correct data processing
    // The main point is to test that they start in parallel, not the exact logic of fetchShopsFromDb parsing data.
    // If it didn't throw and mockRpc was called immediately, the concurrency is working.
    expect(result.attendanceEstimates).toBeDefined();
  });
});
