"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CouponSetting } from "./ShopBannerHero";

export function CouponInfoCard({
  setting,
  allSettings,
  couponStatus,
  activeCouponTypeId,
}: {
  setting: CouponSetting;
  allSettings: CouponSetting[];
  couponStatus: "active" | "stamped" | "participating";
  activeCouponTypeId?: string;
}) {
  if (couponStatus === "active") {
    return (
      <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">{setting.coupon_type_emoji}</span>
          <span className="text-sm font-bold text-green-800">{setting.coupon_type_name}</span>
          <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white">
            今すぐ使える
          </span>
        </div>
        <p className="text-2xl font-extrabold text-green-600 mb-0.5">
          {setting.coupon_type_amount.toLocaleString()}円引き
        </p>
        {setting.min_purchase_amount > 0 && (
          <p className="text-xs text-slate-500">
            {setting.min_purchase_amount.toLocaleString()}円以上のご購入で適用
          </p>
        )}
        {allSettings.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {allSettings.filter((s) => s.coupon_type_id !== activeCouponTypeId).map((s) => (
              <span
                key={s.coupon_type_id}
                className="rounded-full border border-green-200 bg-white px-2 py-0.5 text-[11px] text-green-700"
              >
                {s.coupon_type_emoji} {s.coupon_type_name}も対応
              </span>
            ))}
          </div>
        )}
        <Link
          href="/coupons"
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-green-500 py-2.5 text-sm font-bold text-white transition hover:bg-green-600"
        >
          クーポンを確認する
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  if (couponStatus === "stamped") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-base">{setting.coupon_type_emoji}</span>
          <span className="text-sm font-semibold text-emerald-800">{setting.coupon_type_name}</span>
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
            ✅ 本日スタンプ済み
          </span>
        </div>
        <p className="mt-1.5 text-xs text-emerald-700">
          本日はこのお店のスタンプを取得済みです
        </p>
      </div>
    );
  }

  // "participating" — クーポンは未保有
  return (
    <div className="rounded-xl border border-dashed border-green-200 bg-green-50/50 p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{setting.coupon_type_emoji}</span>
        <span className="text-sm font-semibold text-green-800">
          {setting.coupon_type_name}クーポン対応
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        クーポンページでQRコードを確認できます
      </p>
      <Link
        href="/coupons"
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-green-300 bg-white py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50"
      >
        クーポンを確認する
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
