import { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import MapPageClient from './MapPageClient';
import type { Shop } from './data/shops';
import { fetchMapData, ShopRow, AttendanceEstimate } from './fetch-map-data';

export const metadata: Metadata = {
  title: 'nicchyo | Sunday Market Map',
  description: 'Explore the Sunday market map.',
};

const CHOME_VALUES = new Set([
  "一丁目",
  "二丁目",
  "三丁目",
  "四丁目",
  "五丁目",
  "六丁目",
  "七丁目",
]);

function normalizeChome(value: string | null): Shop["chome"] {
  if (value && CHOME_VALUES.has(value)) {
    return value as Shop["chome"];
  }
  return undefined;
}

export default async function MapPage() {
  const cookieStore = await cookies();
  let shopRows: ShopRow[] | null = null;
  let shops: Shop[] = [];
  let attendanceEstimates: Record<number, AttendanceEstimate> = {};

  const hasSupabaseEnv =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (hasSupabaseEnv) {
    try {
      const supabase = createClient(cookieStore);
      const result = await fetchMapData(supabase);
      shopRows = result.shopRows;
      attendanceEstimates = result.attendanceEstimates;
    } catch {
      shops = [];
    }
  }

  if (shopRows && shopRows.length > 0) {
    shops = shopRows
      .map((row): Shop | null => {
        const id = row.legacy_id ?? row.position;
        const lat = row.lat ?? 0;
        const lng = row.lng ?? 0;

        if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }

        return {
          id,
          vendorId: row.id ?? undefined,
          name: row.name ?? "",
          ownerName: row.owner_name ?? "",
          category: row.category ?? "",
          products: row.products ?? [],
          description: row.description ?? "",
          stallStyle: row.stall_style ?? undefined,
          schedule: row.schedule ?? "",
          message: row.message ?? undefined,
          shopStrength: row.shop_strength ?? undefined,
          lat,
          lng,
          position: row.position ?? id,
          chome: normalizeChome(row.chome),
        };
      })
      .filter((row): row is Shop => row !== null)
      .sort((a, b) => a.id - b.id);
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">Loading...</div>
      }
    >
      <MapPageClient shops={shops} attendanceEstimates={attendanceEstimates} />
    </Suspense>
  );
}
