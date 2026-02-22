import { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import MapPageClient from './MapPageClient';
import { shops as staticShops } from './data/shops';
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
      shopRows = null;
      attendanceEstimates = {};
    }
  }

  // Supabaseからデータを取得、取得できない場合は静的データにフォールバック
  const shops = (shopRows as unknown as ShopRow[] | null)
    ? (shopRows as unknown as ShopRow[])
        .filter((row) => row.legacy_id !== null)
        .map((row) => ({
          id: row.legacy_id ?? 0,
          name: row.name ?? '',
          ownerName: row.owner_name ?? '',
          side: (row.side ?? 'north') as 'north' | 'south',
          position: row.position ?? 0,
          lat: row.lat ?? 0,
          lng: row.lng ?? 0,
          chome: normalizeChome(row.chome),
          category: row.category ?? '',
          products: Array.isArray(row.products) ? row.products : [],
          description: row.description ?? '',
          specialtyDish: row.specialty_dish ?? undefined,
          aboutVendor: row.about_vendor ?? undefined,
          stallStyle: row.stall_style ?? undefined,
          icon: row.icon ?? '',
          schedule: row.schedule ?? '',
          message: row.message ?? undefined,
          topic: Array.isArray(row.topic) ? row.topic : undefined,
          shopStrength: row.shop_strength ?? undefined,
        }))
    : staticShops;

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
