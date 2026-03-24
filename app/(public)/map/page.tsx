import { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import MapPageClient from './MapPageClient';
import type { Shop } from './data/shops';
import { fetchMapData, type AttendanceEstimate } from './fetch-map-data';
import { fetchVendorShopsFromDb } from './services/shopDb';
import { fetchLandmarksFromDb } from './services/landmarksDb';
import type { Landmark } from './types/landmark';
import type { MapRoute } from './types/mapRoute';
import { fetchMapRouteFromDb, getFallbackMapRoute } from './services/mapRouteDb';

export const metadata: Metadata = {
  title: 'nicchyo | Sunday Market Map',
  description: 'Explore the Sunday market map.',
};

export default async function MapPage() {
  const cookieStore = await cookies();
  let shops: Shop[] = [];
  let landmarks: Landmark[] = [];
  let mapRoute: MapRoute = getFallbackMapRoute();
  let attendanceEstimates: Record<number, AttendanceEstimate> = {};

  const hasSupabaseEnv =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (hasSupabaseEnv) {
    try {
      const supabase = createClient(cookieStore);
      const [fetchedShops, fetchedLandmarks, fetchedMapRoute, mapData] = await Promise.all([
        fetchVendorShopsFromDb(supabase),
        fetchLandmarksFromDb(supabase),
        fetchMapRouteFromDb(supabase),
        fetchMapData(supabase),
      ]);
      shops = fetchedShops;
      landmarks = fetchedLandmarks;
      mapRoute = fetchedMapRoute;
      attendanceEstimates = mapData.attendanceEstimates;
    } catch {
      shops = [];
      landmarks = [];
      mapRoute = getFallbackMapRoute();
    }
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">Loading...</div>
      }
    >
      <MapPageClient
        shops={shops}
        landmarks={landmarks}
        mapRoute={mapRoute}
        attendanceEstimates={attendanceEstimates}
      />
    </Suspense>
  );
}
