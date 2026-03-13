import { SupabaseClient } from '@supabase/supabase-js';

export type ShopRow = {
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
  shop_strength: string | null;
};

export type AttendanceEstimate = {
  label: string;
  p: number | null;
  n_eff: number;
  vendor_override: boolean;
  evidence_summary: string;
};

export async function fetchMapData(supabase: SupabaseClient) {
  let shopRows: ShopRow[] | null = null;
  let attendanceEstimates: Record<number, AttendanceEstimate> = {};

  try {
    const today = new Date().toISOString().slice(0, 10);

    const shopsPromise = supabase
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
          'shop_strength',
        ].join(',')
      )
      .order('legacy_id', { ascending: true });

    const estimatesPromise = supabase.rpc('get_shop_attendance_estimates', {
      target_date: today,
    });

    const [shopsResult, estimatesResult] = await Promise.all([shopsPromise, estimatesPromise]);

    const { data: shopsData } = shopsResult;
    shopRows = Array.isArray(shopsData) ? (shopsData as unknown as ShopRow[]) : null;

    if (shopRows && shopRows.length > 0) {
      const uuidToLegacy = new Map<string, number>();
      shopRows.forEach((row) => {
        if (row.id && row.legacy_id !== null) {
          uuidToLegacy.set(row.id, row.legacy_id);
        }
      });

      const { data: estimatesData } = estimatesResult;

      if (Array.isArray(estimatesData)) {
        estimatesData.forEach((row: any) => {
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
    }
  } catch {
    shopRows = null;
    attendanceEstimates = {};
  }

  return { shopRows, attendanceEstimates };
}
