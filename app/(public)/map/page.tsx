import { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import MapPageClient from './MapPageClient';
import { shops as staticShops } from './data/shops';
import type { Shop } from './data/shops';

export const metadata: Metadata = {
  title: 'nicchyo | Sunday Market Map',
  description: 'Explore the Sunday market map.',
};

type ShopRow = {
  id: string | null;
  legacy_id: number | null;
  name: string | null;
  owner_name: string | null;
  side: 'north' | 'south' | null;
  position: number | null;
  lat: number | null;
  lng: number | null;
  chome: string | null;
  category: string | null;
  products: string[] | null;
  description: string | null;
  specialty_dish: string | null;
  about_vendor: string | null;
  stall_style: string | null;
  icon: string | null;
  schedule: string | null;
  message: string | null;
  topic: string[] | null;
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
  const supabase = createClient(cookieStore);
  const { data: shopRows } = await supabase
    .from('shops')
    .select(
      [
        'id',
        'legacy_id',
        'name',
        'owner_name',
        'side',
        'position',
        'lat',
        'lng',
        'chome',
        'category',
        'products',
        'description',
        'specialty_dish',
        'about_vendor',
        'stall_style',
        'icon',
        'schedule',
        'message',
        'topic',
      ].join(',')
    )
    .order('legacy_id', { ascending: true });

  // Supabaseからtopicなどの追加データを取得してマージ
  // 座標は静的データを使用（Supabaseのマイグレーション実行後に切り替え可能）
  const topicByLegacyId = new Map<number, string[]>();
  (shopRows as unknown as ShopRow[] | null)?.forEach((row) => {
    if (row.legacy_id !== null && Array.isArray(row.topic)) {
      topicByLegacyId.set(row.legacy_id, row.topic);
    }
  });

  const shops = staticShops.map((shop) => ({
    ...shop,
    topic: topicByLegacyId.get(shop.id),
  }));

  const uuidToLegacy = new Map<string, number>();
  (shopRows as unknown as ShopRow[] | null)?.forEach((row) => {
    if (row.id && row.legacy_id !== null) {
      uuidToLegacy.set(row.id, row.legacy_id);
    }
  });

  const today = new Date().toISOString().slice(0, 10);
  const { data: estimates } = await supabase.rpc('get_shop_attendance_estimates', {
    target_date: today,
  });

  const attendanceEstimates: Record<number, {
    label: string;
    p: number | null;
    n_eff: number;
    vendor_override: boolean;
    evidence_summary: string;
  }> = {};

  if (Array.isArray(estimates)) {
    estimates.forEach((row: any) => {
      const legacyId = uuidToLegacy.get(String(row.shop_id));
      if (!legacyId) return;
      attendanceEstimates[legacyId] = {
        label: row.label,
        p: row.p,
        n_eff: row.n_eff,
        vendor_override: row.vendor_override,
        evidence_summary: row.evidence_summary,
      };
    });
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
