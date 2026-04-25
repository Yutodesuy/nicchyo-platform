import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { createClient as createServerClient } from "@/utils/supabase/server";
import type { RedeemResponse } from "@/lib/coupons/types";
import { normalizeCouponIssuance } from "@/lib/coupons/types";
import type { SupabaseCouponIssuanceRow } from "@/lib/coupons/types";
import { verifyAndParseCouponQrToken } from "@/lib/coupons/qrToken";
import { getMilestoneIssueReason, isMilestoneStep } from "@/lib/coupons/milestones";
import { todayJstString } from "@/lib/time/jstDate";

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

/**
 * POST /api/coupons/redeem
 *
 * 出店者ログイン必須。QRスキャンを処理する。
 * - クーポン保有あり → クーポン消費 + スタンプ付与
 * - クーポン保有なし → スタンプのみ付与（チェックイン）
 * - 1/3/5スタンプ到達時にマイルストーンクーポンを発行
 */
export async function POST(request: Request) {
  try {
    const isDevCouponOverride = process.env.NODE_ENV !== "production";

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

    const parsedToken = verifyAndParseCouponQrToken(visitorToken);
    if (!parsedToken) {
      return NextResponse.json(
        { error: "QR code is invalid or expired" },
        { status: 400 }
      );
    }

    const visitor_key = parsedToken.visitorKey;

    if (market_date !== todayJstString()) {
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

    if (!isDevCouponOverride && couponSettings?.enabled === false) {
      return NextResponse.json({ error: "Coupon feature is disabled" }, { status: 403 });
    }

    // ④ visitor_key のアクティブなクーポンを取得（最古を1枚消費対象に）
    const now = new Date().toISOString();
    const { data: activeCoupons } = await serviceClient
      .from("coupon_issuances")
      .select("id, coupon_type_id, amount, coupon_types(*)")
      .eq("visitor_key", visitor_key)
      .eq("market_date", market_date)
      .eq("is_used", false)
      .gt("expires_at", now)
      .order("created_at", { ascending: true })
      ;

    const activeCouponList = activeCoupons ?? [];
    let couponToUse: typeof activeCouponList[number] | null = activeCouponList[0] ?? null;
    if (parsedToken.issuanceId) {
      couponToUse = activeCouponList.find((coupon) => coupon.id === parsedToken.issuanceId) ?? null;
      if (!couponToUse) {
        return NextResponse.json({ error: "QR code is invalid or expired" }, { status: 400 });
      }
    }
    const had_coupon = couponToUse !== null;

    // ⑤ 出店者参加チェック
    if (had_coupon) {
      // クーポンがある場合: そのクーポン種別で参加しているか
      const { data: vendorSettings } = await serviceClient
        .from("vendor_coupon_settings")
        .select("coupon_type_id")
        .eq("vendor_id", vendor_id)
        .eq("coupon_type_id", couponToUse!.coupon_type_id)
        .eq("is_participating", true)
        .limit(1);

      if (!vendorSettings || vendorSettings.length === 0) {
        return NextResponse.json(
          { error: "This vendor is not participating in coupon program for this coupon type" },
          { status: 403 }
        );
      }
    } else {
      // クーポンなしチェックイン: 任意のクーポン種別で参加しているか
      const { data: vendorSettings } = await serviceClient
        .from("vendor_coupon_settings")
        .select("vendor_id")
        .eq("vendor_id", vendor_id)
        .eq("is_participating", true)
        .limit(1);

      if (!vendorSettings || vendorSettings.length === 0) {
        return NextResponse.json(
          { error: "This vendor is not participating in coupon program" },
          { status: 403 }
        );
      }
    }

    // ⑥ 今日この出店者でスタンプ済みか確認
    const { data: existingStamp } = await serviceClient
      .from("coupon_stamps")
      .select("id")
      .eq("visitor_key", visitor_key)
      .eq("vendor_id", vendor_id)
      .eq("market_date", market_date)
      .maybeSingle();

    const is_new_stamp = !existingStamp;

    // ⑦ クーポンがあれば消費（アトミック）
    if (had_coupon) {
      const { data: updatedRows, error: updateError } = await serviceClient
        .from("coupon_issuances")
        .update({
          is_used: true,
          used_at: now,
          used_vendor_id: vendor_id,
        })
        .eq("id", couponToUse!.id)
        .eq("is_used", false)
        .select("id");

      if (updateError) {
        console.error("[redeem] update error:", updateError);
        return NextResponse.json({ error: "Failed to consume coupon" }, { status: 500 });
      }

      if (!updatedRows || updatedRows.length === 0) {
        return NextResponse.json(
          { error: "Coupon already used by another request" },
          { status: 409 }
        );
      }
    }

    // ⑧ スタンプ付与（クーポン有無に関わらず）
    const { error: stampError } = await serviceClient
      .from("coupon_stamps")
      .upsert(
        { visitor_key, vendor_id, market_date },
        { onConflict: "visitor_key,vendor_id,market_date", ignoreDuplicates: true }
      );

    if (stampError) {
      // スタンプ失敗 → クーポン消費をロールバック
      console.error("[redeem] stamp upsert error:", stampError);
      if (had_coupon) {
        await serviceClient
          .from("coupon_issuances")
          .update({ is_used: false, used_at: null, used_vendor_id: null })
          .eq("id", couponToUse!.id);
      }
      return NextResponse.json({ error: "Failed to record stamp" }, { status: 500 });
    }

    // ⑨ 新スタンプならマイルストーン判定
    let milestone_coupon: RedeemResponse["milestone_coupon"] = null;
    let milestone_coupon_issued = false;
    let milestone_reached: number | null = null;
    let total_stamps = 0;

    if (is_new_stamp) {
      const { count: stampCount } = await serviceClient
        .from("coupon_stamps")
        .select("id", { count: "exact", head: true })
        .eq("visitor_key", visitor_key)
        .eq("market_date", market_date);

      total_stamps = stampCount ?? 0;
      milestone_reached = isMilestoneStep(total_stamps) ? total_stamps : null;

      if (milestone_reached !== null) {
        const { data: milestoneType } = await serviceClient
          .from("coupon_types")
          .select("*")
          .eq("milestone_stamp_count", milestone_reached)
          .eq("is_enabled", true)
          .maybeSingle();

        if (milestoneType) {
          const expiresAt = new Date(`${market_date}T15:00:00.000Z`);
          expiresAt.setDate(expiresAt.getDate() + 1);

          const { data: newCoupon, error: insertError } = await serviceClient
              .from("coupon_issuances")
              .insert({
                visitor_key,
                market_date,
                coupon_type_id: milestoneType.id,
                amount: milestoneType.amount,
                issue_reason: getMilestoneIssueReason(milestone_reached as 1 | 3 | 5),
                expires_at: expiresAt.toISOString(),
              })
              .select("*, coupon_types(*)")
            .single();

          if (insertError) {
            if (insertError.code !== "23505") {
              console.error("[redeem] milestone insert error:", insertError);
              return NextResponse.json(
                { error: "Failed to issue milestone coupon" },
                { status: 500 }
              );
            }

            const { data: existingCoupon } = await serviceClient
              .from("coupon_issuances")
              .select("*, coupon_types(*)")
              .eq("visitor_key", visitor_key)
              .eq("market_date", market_date)
              .eq("issue_reason", `milestone_${milestone_reached}`)
              .maybeSingle();

            if (existingCoupon) {
              milestone_coupon = normalizeCouponIssuance(
                existingCoupon as SupabaseCouponIssuanceRow
              ) as RedeemResponse["milestone_coupon"];
              milestone_coupon_issued = true;
            }
          } else if (newCoupon) {
            milestone_coupon = normalizeCouponIssuance(
              newCoupon as SupabaseCouponIssuanceRow
            ) as RedeemResponse["milestone_coupon"];
            milestone_coupon_issued = true;
          }
        }
      }
    } else {
      // 既存スタンプの場合もtotal_stampsを取得
      const { count: stampCount } = await serviceClient
        .from("coupon_stamps")
        .select("id", { count: "exact", head: true })
        .eq("visitor_key", visitor_key)
        .eq("market_date", market_date);
      total_stamps = stampCount ?? 0;
    }

    // ⑩ 監査ログ
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : null;

    await serviceClient.from("coupon_redemption_logs").insert({
      coupon_issuance_id: had_coupon ? couponToUse!.id : null,
      visitor_key,
      vendor_id,
      coupon_type_id: had_coupon ? couponToUse!.coupon_type_id : null,
      market_date,
      amount_discounted: had_coupon ? (couponToUse!.amount as number) : 0,
      had_coupon,
      is_new_stamp,
      next_coupon_issued: milestone_coupon_issued,
      next_coupon_type_id: milestone_coupon
        ? (milestone_coupon as { coupon_type_id: string }).coupon_type_id
        : null,
      confirmed_by: vendor_id,
      ip_address: ip,
    });

    return NextResponse.json({
      success: true,
      amount_discounted: had_coupon ? (couponToUse!.amount as number) : 0,
      had_coupon,
      is_new_stamp,
      total_stamps,
      milestone_reached,
      milestone_coupon_issued,
      milestone_coupon,
    } satisfies RedeemResponse);
  } catch (err) {
    console.error("[redeem] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
