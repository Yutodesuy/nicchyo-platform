import { describe, it, expect, vi } from 'vitest';
import { fetchMapData } from '../app/(public)/map/fetch-map-data';
import { SupabaseClient } from '@supabase/supabase-js';

// Minimal valid shape for the test logic (we only use id and legacy_id for mapping)
const MOCK_VENDORS = [
  {
    id: 'uuid-1',
    shop_name: 'Shop 1',
  }
];

const MOCK_LOCATIONS = [
  {
    id: 'loc-1',
    store_number: 1,
  }
];

const MOCK_ASSIGNMENTS = [
  {
    vendor_id: 'uuid-1',
    location_id: 'loc-1',
    market_date: '2025-01-01',
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
    let resolveVendors: (value: any) => void;
    let resolveCategories: (value: any) => void;
    let resolveProducts: (value: any) => void;
    let resolveLocations: (value: any) => void;
    let resolveAssignments: (value: any) => void;
    let resolveVendorContents: (value: any) => void;

    const vendorsPromise = new Promise(r => resolveVendors = r);
    const categoriesPromise = new Promise(r => resolveCategories = r);
    const productsPromise = new Promise(r => resolveProducts = r);
    const locationsPromise = new Promise(r => resolveLocations = r);
    const assignmentsPromise = new Promise(r => resolveAssignments = r);
    const vendorContentsPromise = new Promise(r => resolveVendorContents = r);

    let resolveEstimates: (value: any) => void;
    const estimatesPromise = new Promise(resolve => {
      resolveEstimates = resolve;
    });

    // 2. Mock Supabase client
    const mockGt = vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue(vendorContentsPromise) });
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === 'vendors') return { select: vi.fn().mockReturnValue(vendorsPromise) };
      if (table === 'categories') return { select: vi.fn().mockReturnValue(categoriesPromise) };
      if (table === 'products') return { select: vi.fn().mockReturnValue(productsPromise) };
      if (table === 'market_locations') return { select: vi.fn().mockReturnValue(locationsPromise) };
      if (table === 'location_assignments') return { select: vi.fn().mockReturnValue(assignmentsPromise) };
      if (table === 'vendor_contents') return { select: vi.fn().mockReturnValue({ gt: mockGt }) };
      return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [] })) };
    });

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
    expect(mockRpc).toHaveBeenCalledWith('get_shop_attendance_estimates', expect.any(Object));

    // 5. Resolve the promises with data
    if (resolveVendors!) resolveVendors({ data: MOCK_VENDORS });
    if (resolveCategories!) resolveCategories({ data: [] });
    if (resolveProducts!) resolveProducts({ data: [] });
    if (resolveLocations!) resolveLocations({ data: MOCK_LOCATIONS });
    if (resolveAssignments!) resolveAssignments({ data: MOCK_ASSIGNMENTS });
    if (resolveVendorContents!) resolveVendorContents({ data: [] });
    if (resolveEstimates!) resolveEstimates({ data: MOCK_ESTIMATES });

    // 6. Await the result
    const result = await fetchPromise;

    // 7. Assert correct data processing
    // result only contains attendanceEstimates based on fetchMapData return
    expect(result.attendanceEstimates[1]).toBeDefined();
    expect(result.attendanceEstimates[1].label).toBe('Open');
  });
});
