import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { CouponType } from "@/lib/coupons/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * GET /api/coupons/types
 * 有効なクーポン種類一覧と、各種類の参加店情報を返す公開API
 */
export async function GET() {
  try {
    const supabase = getServiceClient();

    const { data: types, error: typesErr } = await supabase
      .from("coupon_types")
      .select("*")
      .eq("is_enabled", true)
      .order("display_order", { ascending: true });

    if (typesErr) {
      return NextResponse.json({ error: "Failed to fetch coupon types" }, { status: 500 });
    }

    // 各クーポン種類の参加店数を集計
    const { data: settings, error: settingsErr } = await supabase
      .from("vendor_coupon_settings")
      .select("coupon_type_id, vendor_id, min_purchase_amount, vendors(shop_name)")
      .eq("is_participating", true);

    if (settingsErr) {
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }

    const participantsByType: Record<
      string,
      Array<{ vendor_id: string; vendor_name: string; min_purchase_amount: number }>
    > = {};

    for (const s of settings ?? []) {
      if (!participantsByType[s.coupon_type_id]) {
        participantsByType[s.coupon_type_id] = [];
      }
      const vendorName =
        s.vendors && typeof s.vendors === "object" && !Array.isArray(s.vendors)
          ? (s.vendors as { shop_name: string | null }).shop_name ?? "名称未設定"
          : "名称未設定";
      participantsByType[s.coupon_type_id].push({
        vendor_id: s.vendor_id,
        vendor_name: vendorName,
        min_purchase_amount: s.min_purchase_amount,
      });
    }

    const result = (types as CouponType[]).map((t) => ({
      ...t,
      participants: participantsByType[t.id] ?? [],
      participant_count: (participantsByType[t.id] ?? []).length,
    }));

    return NextResponse.json({ coupon_types: result });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
