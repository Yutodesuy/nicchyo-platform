import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";
import type { RedeemResponse } from "@/lib/coupons/types";
import { normalizeCouponIssuance } from "@/lib/coupons/types";
import type { SupabaseCouponIssuanceRow } from "@/lib/coupons/types";
import { isCouponQrTokenValid, parseCouponQrToken } from "@/lib/coupons/qrToken";

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
 * POST /api/coupons/redeem
 *
 * 出店者ログイン必須。クーポン利用を確定する。
 * - 保有クーポン1枚を消費
 * - スタンプを付与（同日・同店は UPSERT）
 * - 新規スタンプなら次回クーポンを発行（1枚まで / 上限内）
 */
export async function POST(request: Request) {
  try {
    // ① 出店者認証
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ② リクエストボディ
    const body = (await request.json()) as {
      visitor_key?: string;
      market_date?: string;
    };
    const visitorToken = body.visitor_key?.trim();
    const market_date = body.market_date?.trim();

    if (!visitorToken || !market_date) {
      return NextResponse.json(
        { error: "visitor_key and market_date are required" },
        { status: 400 }
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(market_date)) {
      return NextResponse.json({ error: "Invalid market_date format" }, { status: 400 });
    }

    if (!isCouponQrTokenValid(visitorToken)) {
      return NextResponse.json(
        { error: "QR code is invalid or expired" },
        { status: 400 }
      );
    }

    const parsedToken = parseCouponQrToken(visitorToken);
    if (!parsedToken) {
      return NextResponse.json(
        { error: "QR code is invalid or expired" },
        { status: 400 }
      );
    }

    const visitor_key = parsedToken.visitorKey;

    // market_date は今日でないと受け付けない
    const todayJST = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
    )
      .toISOString()
      .slice(0, 10);
    if (market_date !== todayJST) {
      return NextResponse.json({ error: "market_date must be today" }, { status: 400 });
    }

    const serviceClient = getServiceClient();
    const vendor_id = user.id;

    // ③ クーポン機能ON確認
    const { data: settingsRow } = await serviceClient
      .from("system_settings")
      .select("value")
      .eq("key", "coupon")
      .maybeSingle();

    const couponSettings = settingsRow?.value as {
      enabled?: boolean;
      amount?: number;
      maxDailyIssuance?: number;
    } | null;

    if (!couponSettings?.enabled) {
      return NextResponse.json({ error: "Coupon feature is disabled" }, { status: 403 });
    }

    // ④ この出店者がクーポン参加店かどうかを確認
    // 1つのvendorが複数のcoupon_typeに参加できるため .single() は使わない
    const { data: vendorSettings } = await serviceClient
      .from("vendor_coupon_settings")
      .select("coupon_type_id, min_purchase_amount, is_participating")
      .eq("vendor_id", vendor_id)
      .eq("is_participating", true)
      .limit(1);

    const vendorSetting = vendorSettings?.[0] ?? null;

    if (!vendorSetting) {
      return NextResponse.json(
        { error: "This vendor is not participating in coupon program" },
        { status: 403 }
      );
    }

    // ⑤ visitor_key のアクティブなクーポンを取得
    const now = new Date().toISOString();
    const { data: activeCoupons } = await serviceClient
      .from("coupon_issuances")
      .select("id, coupon_type_id, amount, coupon_types(*)")
      .eq("visitor_key", visitor_key)
      .eq("market_date", market_date)
      .eq("is_used", false)
      .gt("expires_at", now)
      .order("created_at", { ascending: true })
      .limit(1);

    if (!activeCoupons || activeCoupons.length === 0) {
      return NextResponse.json(
        { error: "No available coupon for this visitor" },
        { status: 409 }
      );
    }

    const couponToUse = activeCoupons[0];

    // ⑥ 今日この出店者ですでにスタンプ済みか確認
    const { data: existingStamp } = await serviceClient
      .from("coupon_stamps")
      .select("id")
      .eq("visitor_key", visitor_key)
      .eq("vendor_id", vendor_id)
      .eq("market_date", market_date)
      .maybeSingle();

    const is_new_stamp = !existingStamp;

    // ⑦ クーポン消費（is_used = true）
    const { error: updateError } = await serviceClient
      .from("coupon_issuances")
      .update({
        is_used: true,
        used_at: now,
        used_vendor_id: vendor_id,
      })
      .eq("id", couponToUse.id);

    if (updateError) {
      console.error("[redeem] update error:", updateError);
      return NextResponse.json({ error: "Failed to consume coupon" }, { status: 500 });
    }

    // ⑧ スタンプ付与（既存なら ignore）
    await serviceClient
      .from("coupon_stamps")
      .upsert(
        { visitor_key, vendor_id, market_date },
        { onConflict: "visitor_key,vendor_id,market_date", ignoreDuplicates: true }
      );

    // ⑨ 新スタンプなら次回クーポンを発行
    let next_coupon: RedeemResponse["next_coupon"] = null;
    let next_coupon_issued = false;

    if (is_new_stamp) {
      // 上限チェック
      const maxIssuance = couponSettings.maxDailyIssuance ?? 300;
      const { count: todayCount } = await serviceClient
        .from("coupon_issuances")
        .select("id", { count: "exact", head: true })
        .eq("market_date", market_date);

      if ((todayCount ?? 0) < maxIssuance) {
        // 次回クーポンの種類をランダムに選択（is_initial_gift = false のものから）
        const { data: nextTypes } = await serviceClient
          .from("coupon_types")
          .select("*")
          .eq("is_enabled", true)
          .order("display_order", { ascending: true });

        if (nextTypes && nextTypes.length > 0) {
          // is_initial_gift=false のものを優先、なければどれでも
          const nonInitialTypes = nextTypes.filter((t) => !t.is_initial_gift);
          const candidates = nonInitialTypes.length > 0 ? nonInitialTypes : nextTypes;
          const nextType = candidates[Math.floor(Math.random() * candidates.length)];

          const expiresAt = new Date(`${market_date}T15:00:00.000Z`);
          expiresAt.setDate(expiresAt.getDate() + 1);

          const { data: newCoupon } = await serviceClient
            .from("coupon_issuances")
            .insert({
              visitor_key,
              market_date,
              coupon_type_id: nextType.id,
              amount: couponSettings.amount ?? nextType.amount,
              issue_reason: "next_visit",
              expires_at: expiresAt.toISOString(),
            })
            .select("*, coupon_types(*)")
            .single();

          if (newCoupon) {
            next_coupon = normalizeCouponIssuance(
              newCoupon as SupabaseCouponIssuanceRow
            ) as RedeemResponse["next_coupon"];
            next_coupon_issued = true;
          }
        }
      }
    }

    // ⑩ 監査ログ
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : null;

    await serviceClient.from("coupon_redemption_logs").insert({
      coupon_issuance_id: couponToUse.id,
      visitor_key,
      vendor_id,
      coupon_type_id: couponToUse.coupon_type_id,
      market_date,
      amount_discounted: couponToUse.amount,
      is_new_stamp,
      next_coupon_issued,
      next_coupon_type_id: next_coupon
        ? (next_coupon as { coupon_type_id: string }).coupon_type_id
        : null,
      confirmed_by: vendor_id,
      ip_address: ip,
    });

    return NextResponse.json({
      success: true,
      amount_discounted: couponToUse.amount,
      is_new_stamp,
      next_coupon_issued,
      next_coupon,
    } satisfies RedeemResponse);
  } catch (err) {
    console.error("[redeem] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
