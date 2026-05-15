import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod";
import type { Database } from "@/types/database.types";
import { createClient as createServerClient } from "@/utils/supabase/server";
import type { RedeemResponse } from "@/lib/coupons/types";
import { normalizeCouponIssuance } from "@/lib/coupons/types";
import type { SupabaseCouponIssuanceRow } from "@/lib/coupons/types";
import { isCouponQrTokenValid, parseCouponQrToken } from "@/lib/coupons/qrToken";
import { todayJstString } from "@/lib/time/jstDate";
import { requireVendorRole } from "@/lib/auth/permissions";

const RedeemBodySchema = z.object({
  visitor_key: z.string().min(1),
  market_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "market_date must be YYYY-MM-DD"),
});

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
 * 出店者ログイン必須。クーポン利用を確定する。
 * - 保有クーポン1枚を消費
 * - スタンプを付与（同日・同店は UPSERT）
 * - 新規スタンプなら次回クーポンを発行（1枚まで / 上限内）
 *
 * クーポン消費・スタンプ付与・次回クーポン発行は redeem_coupon SQL 関数で
 * 1トランザクション内に閉じており、ロールバック不整合と race condition を防止する。
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
    const forbidden = requireVendorRole(user);
    if (forbidden) return forbidden;

    // ② リクエストボディ
    const parsed = RedeemBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const visitorToken = parsed.data.visitor_key;
    const market_date = parsed.data.market_date;

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

    // ④ visitor_key のアクティブなクーポンを取得
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

    // ⑤ この出店者が、使おうとしているクーポンタイプで参加しているか確認
    // couponToUse.coupon_type_id と一致する設定のみを取得することで
    // タイプ違いの出店者によるクーポン消費を防ぐ
    const { data: vendorSettings } = await serviceClient
      .from("vendor_coupon_settings")
      .select("coupon_type_id, min_purchase_amount, is_participating")
      .eq("vendor_id", vendor_id)
      .eq("coupon_type_id", couponToUse.coupon_type_id)
      .eq("is_participating", true)
      .limit(1);

    const vendorSetting = vendorSettings?.[0] ?? null;

    if (!vendorSetting) {
      return NextResponse.json(
        { error: "This vendor is not participating in coupon program for this coupon type" },
        { status: 403 }
      );
    }

    // ⑥⑦⑧⑨ クーポン消費・スタンプ付与・次回クーポン発行をアトミックに実行
    // redeem_coupon SQL 関数が1トランザクション内でこれらを完結させる
    const maxIssuance = couponSettings?.maxDailyIssuance ?? 300;
    const nextCouponAmount = couponSettings?.amount ?? 50;

    const { data: rpcResult, error: rpcError } = await serviceClient.rpc("redeem_coupon", {
      p_coupon_id: couponToUse.id,
      p_visitor_key: visitor_key,
      p_vendor_id: vendor_id,
      p_market_date: market_date,
      p_max_issuance: maxIssuance,
      p_next_coupon_amount: nextCouponAmount,
    });

    if (rpcError) {
      if (rpcError.message?.includes("COUPON_ALREADY_USED")) {
        return NextResponse.json(
          { error: "Coupon already used by another request" },
          { status: 409 }
        );
      }
      console.error("[redeem] rpc error:", rpcError);
      return NextResponse.json({ error: "Failed to process redemption" }, { status: 500 });
    }

    const rpc = rpcResult as { is_new_stamp: boolean; next_coupon_id: string | null };
    const is_new_stamp = rpc.is_new_stamp;

    // 次回クーポンの詳細を取得（発行された場合のみ）
    let next_coupon: RedeemResponse["next_coupon"] = null;
    let next_coupon_issued = false;

    if (rpc.next_coupon_id) {
      const { data: newCouponRow } = await serviceClient
        .from("coupon_issuances")
        .select("*, coupon_types(*)")
        .eq("id", rpc.next_coupon_id)
        .single();

      if (newCouponRow) {
        next_coupon = normalizeCouponIssuance(
          newCouponRow as SupabaseCouponIssuanceRow
        ) as RedeemResponse["next_coupon"];
        next_coupon_issued = true;
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
