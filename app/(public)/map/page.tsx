import { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import MapPageClient from './MapPageClient';
import type { Shop } from './data/shops';
import { fetchShopsFromDb } from './services/shopDb';
import { fetchLandmarksFromDb } from './services/landmarksDb';
import type { Landmark } from './types/landmark';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'nicchyo | Sunday Market Map',
  description: 'Explore the Sunday market map.',
};

export default async function MapPage() {
  const cookieStore = await cookies();
  let shops: Shop[] = [];
  let landmarks: Landmark[] = [];
  const attendanceEstimates: Record<
    number,
    {
      label: string;
      p: number | null;
      n_eff: number;
      vendor_override: boolean;
      evidence_summary: string;
    }
  > = {};

  const hasSupabaseEnv =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (hasSupabaseEnv) {
    try {
      const supabase = createClient(cookieStore);
      [shops, landmarks] = await Promise.all([
        fetchShopsFromDb(supabase),
        fetchLandmarksFromDb(supabase),
      ]);
    } catch {
      shops = [];
      landmarks = [];
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
        attendanceEstimates={attendanceEstimates}
      />
    </Suspense>
  );
}
