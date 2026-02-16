import { describe, it, expect, vi } from 'vitest';
import { fetchMapData } from '../app/(public)/map/fetch-map-data';
import { SupabaseClient } from '@supabase/supabase-js';

const MOCK_SHOPS = Array.from({ length: 10 }, (_, i) => ({
  id: `uuid-${i}`,
  legacy_id: i + 1,
  name: `Shop ${i}`,
  owner_name: 'Test Owner',
  side: 'north',
  position: i,
  lat: 0,
  lng: 0,
  chome: '一丁目',
  category: 'Food',
  products: ['Apple'],
  description: 'Desc',
  specialty_dish: 'Dish',
  about_vendor: 'About',
  stall_style: 'Style',
  icon: 'icon',
  schedule: 'Weekly',
  message: 'Msg',
  topic: ['Topic'],
  shop_strength: 'Strong',
}));

const MOCK_ESTIMATES = MOCK_SHOPS.map(shop => ({
  shop_id: shop.id,
  label: 'Open',
  p: 0.9,
  n_eff: 10,
  vendor_override: false,
  evidence_summary: 'Test',
}));

function createMockSupabase(shopsDelay = 100, estimatesDelay = 100) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, shopsDelay));
          return { data: MOCK_SHOPS };
        }),
      }),
    }),
    rpc: vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, estimatesDelay));
      return { data: MOCK_ESTIMATES };
    }),
  } as unknown as SupabaseClient;
}

describe('fetchMapData Benchmark', () => {
  it('measures execution time', async () => {
    const shopsDelay = 100;
    const estimatesDelay = 100;
    const supabase = createMockSupabase(shopsDelay, estimatesDelay);

    const start = performance.now();
    await fetchMapData(supabase);
    const end = performance.now();

    const duration = end - start;
    console.log(`Execution time: ${duration}ms`);

    // Sequential: shopsDelay + estimatesDelay = 200ms (plus overhead)
    // Parallel: max(shopsDelay, estimatesDelay) = 100ms (plus overhead)

    // Check if it behaves in parallel
    // We expect it to be significantly less than the sum
    expect(duration).toBeLessThan(shopsDelay + estimatesDelay);

    // It should be at least the max delay
    expect(duration).toBeGreaterThanOrEqual(Math.max(shopsDelay, estimatesDelay));
  });
});
