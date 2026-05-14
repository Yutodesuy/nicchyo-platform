import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient as createServerClient } from "@/utils/supabase/server";
import type { VendorCouponSettingsResponse } from "@/lib/coupons/types";

const CouponSettingsBodySchema = z.object({
  updates: z.array(
    z.object({
      coupon_type_id: z.string().min(1),
      is_participating: z.boolean(),
      min_purchase_amount: z.union([
        z.literal(0),
        z.literal(300),
        z.literal(500),
        z.literal(1000),
      ]),
    })
  ),
});

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
 * GET /api/vendor/coupon-settings
 * 出店者のクーポン参加設定一覧を取得
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = getServiceClient();

    // クーポン種類一覧を取得
    const { data: couponTypes, error: typesErr } = await serviceClient
      .from("coupon_types")
      .select("*")
      .eq("is_enabled", true)
      .order("display_order", { ascending: true });

    if (typesErr) {
      return NextResponse.json({ error: "Failed to fetch coupon types" }, { status: 500 });
    }

    // 出店者の参加設定を取得
    const { data: settings } = await serviceClient
      .from("vendor_coupon_settings")
      .select("*, coupon_types(*)")
      .eq("vendor_id", user.id);

    return NextResponse.json({
      settings: settings ?? [],
      coupon_types: couponTypes ?? [],
    } satisfies VendorCouponSettingsResponse);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/vendor/coupon-settings
 * 出店者のクーポン参加設定を一括更新
 *
 * body: {
 *   updates: Array<{
 *     coupon_type_id: string;
 *     is_participating: boolean;
 *     min_purchase_amount: 0 | 300 | 500 | 1000;
 *   }>
 * }
 */
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = CouponSettingsBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const serviceClient = getServiceClient();

    // UPSERT で一括保存
    const rows = parsed.data.updates.map((u) => ({
      vendor_id: user.id,
      coupon_type_id: u.coupon_type_id,
      is_participating: u.is_participating,
      min_purchase_amount: u.min_purchase_amount,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await serviceClient
      .from("vendor_coupon_settings")
      .upsert(rows, { onConflict: "vendor_id,coupon_type_id" });

    if (upsertError) {
      console.error("[vendor/coupon-settings PUT] upsert error:", upsertError);
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
