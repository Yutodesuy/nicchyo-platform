import { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import MapPageClient from './MapPageClient';
import type { Shop } from './data/shops';
import { fetchMapData, AttendanceEstimate } from './fetch-map-data';
import { fetchShopsFromDb } from './services/shopDb';

export const metadata: Metadata = {
  title: 'nicchyo | Sunday Market Map',
  description: 'Explore the Sunday market map.',
};

export default async function MapPage() {
  const cookieStore = await cookies();
  let shops: Shop[] = [];
  let attendanceEstimates: Record<number, AttendanceEstimate> = {};

  const hasSupabaseEnv =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (hasSupabaseEnv) {
    try {
      const supabase = createClient(cookieStore);
      const [fetchedShops, result] = await Promise.all([
        fetchShopsFromDb(supabase),
        fetchMapData(supabase),
      ]);
      shops = fetchedShops;
      attendanceEstimates = result.attendanceEstimates;
    } catch {
      shops = [];
    }
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
