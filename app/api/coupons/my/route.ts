import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { MyCouponsResponse, CouponIssuance, CouponType } from "@/lib/coupons/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createServiceClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const MILESTONE_STEPS = [1, 3, 5] as const;

function computeNextMilestone(stampCount: number): {
  next_milestone: 1 | 3 | 5 | null;
  stamps_to_next: number;
} {
  const next = MILESTONE_STEPS.find((m) => m > stampCount) ?? null;
  return {
    next_milestone: next,
    stamps_to_next: next !== null ? next - stampCount : 0,
  };
}

/**
 * GET /api/coupons/my?visitor_key=xxx&market_date=YYYY-MM-DD
 *
 * visitor_key の当日クーポン・スタンプ・参加店情報を返す公開API。
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const visitor_key = searchParams.get("visitor_key")?.trim();
    const market_date = searchParams.get("market_date")?.trim();

    if (!visitor_key || !market_date) {
      return NextResponse.json(
        { error: "visitor_key and market_date are required" },
        { status: 400 }
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(market_date)) {
      return NextResponse.json({ error: "Invalid market_date format" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // ① 開催日チェック
    const { count: marketDayCount } = await supabase
      .from("location_assignments")
      .select("id", { count: "exact", head: true })
      .eq("market_date", market_date);

    const is_market_day = (marketDayCount ?? 0) > 0;

    // ② アクティブなクーポン（最大2枚）
    const now = new Date().toISOString();
    const { data: activeCouponsRaw } = await supabase
      .from("coupon_issuances")
      .select("*, coupon_types(*)")
      .eq("visitor_key", visitor_key)
      .eq("market_date", market_date)
      .eq("is_used", false)
      .gt("expires_at", now)
      .order("created_at", { ascending: true })
      .limit(2);

    const active_coupons: Array<CouponIssuance & { coupon_type: CouponType }> = (
      activeCouponsRaw ?? []
    ).map((c) => ({
      ...c,
      coupon_type: (c.coupon_types ?? null) as CouponType,
    })) as Array<CouponIssuance & { coupon_type: CouponType }>;

    const active_coupon = active_coupons[0] ?? null;

    // ③ 当日スタンプ一覧
    const { data: stampRows } = await supabase
      .from("coupon_stamps")
      .select("vendor_id, created_at, vendors(shop_name)")
      .eq("visitor_key", visitor_key)
      .eq("market_date", market_date)
      .order("created_at", { ascending: true });

    const stamps = (stampRows ?? []).map((s) => ({
      vendor_id: s.vendor_id as string,
      vendor_name:
        s.vendors && typeof s.vendors === "object" && !Array.isArray(s.vendors)
          ? (s.vendors as { shop_name: string | null }).shop_name ?? "名称未設定"
          : "名称未設定",
      stamped_at: s.created_at as string,
    }));

    const stamp_count = stamps.length;
    const stampedVendorIds = new Set(stamps.map((s) => s.vendor_id));

    // ④ 達成済みマイルストーン（本日発行されたmilestone_*クーポンから判定）
    const { data: milestoneIssuances } = await supabase
      .from("coupon_issuances")
      .select("issue_reason")
      .eq("visitor_key", visitor_key)
      .eq("market_date", market_date)
      .like("issue_reason", "milestone_%");

    const claimed_milestones: number[] = (milestoneIssuances ?? [])
      .map((r) => {
        const match = (r.issue_reason as string).match(/^milestone_(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n): n is number => n !== null);

    const { next_milestone, stamps_to_next } = computeNextMilestone(stamp_count);

    // ⑤ 参加店一覧（クーポン機能ON の出店者）
    const { data: settingRows } = await supabase
      .from("vendor_coupon_settings")
      .select("vendor_id, coupon_type_id, min_purchase_amount, vendors(shop_name), coupon_types(name, emoji, amount)")
      .eq("is_participating", true);

    const participating_vendors = (settingRows ?? []).map((s) => {
      const vendorName =
        s.vendors && typeof s.vendors === "object" && !Array.isArray(s.vendors)
          ? (s.vendors as { shop_name: string | null }).shop_name ?? "名称未設定"
          : "名称未設定";
      const rawType = s.coupon_types;
      const typeData =
        rawType && !Array.isArray(rawType) && typeof rawType === "object"
          ? (rawType as { name: string; emoji: string; amount?: number })
          : null;
      return {
        vendor_id: s.vendor_id as string,
        vendor_name: vendorName,
        coupon_type_id: s.coupon_type_id as string,
        coupon_type_name: typeData?.name ?? "",
        coupon_type_emoji: typeData?.emoji ?? "🎟️",
        coupon_type_amount:
          rawType && !Array.isArray(rawType) && typeof rawType === "object"
            ? ((rawType as { amount?: number }).amount ?? 50)
            : 50,
        min_purchase_amount: s.min_purchase_amount as 0 | 300 | 500 | 1000,
        is_stamped: stampedVendorIds.has(s.vendor_id as string),
      };
    });

    const response: MyCouponsResponse = {
      active_coupon,
      active_coupons,
      stamp_count,
      next_milestone,
      stamps_to_next,
      claimed_milestones,
      stamps,
      participating_vendors,
      is_market_day,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[coupons/my] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
