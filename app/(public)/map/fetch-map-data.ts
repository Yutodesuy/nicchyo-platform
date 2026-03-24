import { SupabaseClient } from '@supabase/supabase-js';
import { fetchVendorShopsFromDb } from './services/shopDb';

export type AttendanceEstimate = {
  label: string;
  p: number | null;
  n_eff: number;
  vendor_override: boolean;
  evidence_summary: string;
};

export async function fetchMapData(supabase: SupabaseClient) {
  let attendanceEstimates: Record<number, AttendanceEstimate> = {};

  try {
    const today = new Date().toISOString().slice(0, 10);
    const [shops, estimatesResult] = await Promise.all([
      fetchVendorShopsFromDb(supabase),
      supabase.rpc('get_shop_attendance_estimates', {
        target_date: today,
      }),
    ]);

    const vendorIdToLegacy = new Map<string, number>();
    shops.forEach((shop) => {
      if (shop.vendorId && Number.isFinite(shop.id)) {
        vendorIdToLegacy.set(shop.vendorId, shop.id);
      }
    });

    const { data: estimatesData } = estimatesResult;
    if (Array.isArray(estimatesData)) {
      estimatesData.forEach((row: any) => {
        const legacyId = vendorIdToLegacy.get(String(row.shop_id));
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
  } catch {
    attendanceEstimates = {};
  }

  return { attendanceEstimates };
}
