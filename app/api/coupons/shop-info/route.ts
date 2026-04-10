import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

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
 * GET /api/coupons/shop-info?vendor_id=xxx
 *
 * 特定の出店者のクーポン参加情報を返す公開API。
 * バナー表示用の軽量エンドポイント。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vendor_id = searchParams.get("vendor_id")?.trim();

  if (!vendor_id) {
    return NextResponse.json({ error: "vendor_id is required" }, { status: 400 });
  }

  try {
    const supabase = getServiceClient();

    const { data: settings } = await supabase
      .from("vendor_coupon_settings")
      .select("coupon_type_id, min_purchase_amount, coupon_types(name, emoji)")
      .eq("vendor_id", vendor_id)
      .eq("is_participating", true);

    const participatingSettings = (settings ?? []).map((s) => {
      const rawType = s.coupon_types;
      const typeData =
        rawType && !Array.isArray(rawType) && typeof rawType === "object"
          ? (rawType as { name: string; emoji: string })
          : null;
      return {
        coupon_type_id: s.coupon_type_id as string,
        coupon_type_name: typeData?.name ?? "",
        coupon_type_emoji: typeData?.emoji ?? "🎟️",
        min_purchase_amount: s.min_purchase_amount as number,
      };
    });

    return NextResponse.json({
      vendor_id,
      is_participating: participatingSettings.length > 0,
      settings: participatingSettings,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
