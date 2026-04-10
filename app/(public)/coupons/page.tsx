"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MapPin, Loader2, TicketX } from "lucide-react";
import NavigationBar from "@/app/components/NavigationBar";
import { getOrCreateConsultVisitorKey } from "@/lib/consultVisitorKey";
import type { MyCouponsResponse, CouponIssuance, CouponType } from "@/lib/coupons/types";

function todayJST(): string {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  )
    .toISOString()
    .slice(0, 10);
}

function formatExpiresAt(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return "まもなく失効";
  if (diffH < 24) return `あと${diffH}時間`;
  return "今日限り";
}

type ActiveCoupon = CouponIssuance & { coupon_type: CouponType };

export default function CouponsPage() {
  const [data, setData] = useState<MyCouponsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visitorKey, setVisitorKey] = useState<string | null>(null);

  const marketDate = todayJST();

  const fetchData = useCallback(
    async (vk: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/coupons/my?visitor_key=${encodeURIComponent(vk)}&market_date=${marketDate}`
        );
        if (res.ok) {
          setData(await res.json());
        }
      } finally {
        setIsLoading(false);
      }
    },
    [marketDate]
  );

  useEffect(() => {
    const vk = getOrCreateConsultVisitorKey();
    if (!vk) {
      setIsLoading(false);
      return;
    }
    setVisitorKey(vk);
    fetchData(vk);
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  const activeCoupon = data?.active_coupon as ActiveCoupon | null;
  const stamps = data?.stamps ?? [];
  const participating = data?.participating_vendors ?? [];
  const isMarketDay = data?.is_market_day ?? false;

  const stampedIds = new Set(stamps.map((s) => s.vendor_id));
  const unstampedVendors = participating.filter((v) => !stampedIds.has(v.vendor_id));

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white pb-28">
      {/* ページタイトル */}
      <div className="px-4 pt-6 pb-4">
        <div className="rounded-2xl border border-green-100 bg-white/95 px-5 py-5 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-green-600">Coupon</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">クーポン</h1>
          <p className="mt-1 text-sm text-gray-500">日曜市の参加店でご利用いただけます</p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 space-y-4">
        {/* ─ 開催日でない ─ */}
        {!isMarketDay && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-center">
            <p className="font-semibold text-amber-800">今日は日曜市の開催日ではありません</p>
            <p className="mt-1 text-sm text-amber-600">
              次の開催日にマップを開くとクーポンを受け取れます
            </p>
          </div>
        )}

        {/* ─ 今日のクーポン ─ */}
        {isMarketDay && (
          <section>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
              今日のクーポン
            </p>

            {activeCoupon ? (
              <ActiveCouponCard coupon={activeCoupon} visitorKey={visitorKey ?? ""} />
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-6 text-center shadow-sm">
                <TicketX className="h-10 w-10 text-gray-300" />
                <div>
                  <p className="font-semibold text-gray-600">クーポンがありません</p>
                  <p className="mt-0.5 text-sm text-gray-400">
                    マップを開いて最初の1枚を受け取りましょう
                  </p>
                </div>
                <Link
                  href="/map"
                  className="mt-1 rounded-full bg-green-500 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-green-600"
                >
                  マップを開く
                </Link>
              </div>
            )}
          </section>
        )}

        {/* ─ スタンプ状況 ─ */}
        {isMarketDay && participating.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                スタンプ状況
              </p>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                {stamps.length} / {participating.length}店
              </span>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
              {participating.map((v) => {
                const isStamped = stampedIds.has(v.vendor_id);
                return (
                  <div key={v.vendor_id} className="flex items-center gap-3 px-4 py-3.5">
                    <span className="text-xl">{isStamped ? "✅" : "⬜"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {v.vendor_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {v.coupon_type_emoji} {v.coupon_type_name}
                        {v.min_purchase_amount > 0 && (
                          <span className="ml-1">
                            · {v.min_purchase_amount.toLocaleString()}円以上
                          </span>
                        )}
                      </p>
                    </div>
                    {isStamped && (
                      <span className="shrink-0 text-xs font-medium text-green-500">
                        スタンプ済み
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─ 次はどこへ？ ─ */}
        {isMarketDay && unstampedVendors.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
              次はこちらへ
            </p>
            <div className="rounded-2xl border border-green-100 bg-white shadow-sm divide-y divide-gray-50">
              {unstampedVendors.slice(0, 3).map((v) => (
                <div key={v.vendor_id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="text-2xl">{v.coupon_type_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {v.vendor_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {v.coupon_type_name}
                      {v.min_purchase_amount > 0 && (
                        <span className="ml-1">
                          · {v.min_purchase_amount.toLocaleString()}円以上で50円引き
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─ マップへ ─ */}
        {isMarketDay && (
          <Link
            href="/map"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 text-sm font-bold text-white shadow transition hover:bg-gray-700"
          >
            <MapPin size={16} />
            マップでお店を探す
          </Link>
        )}
      </div>

      <NavigationBar />
    </div>
  );
}

// ─── アクティブなクーポンカード ───────────────────────────────────────────────
function ActiveCouponCard({
  coupon,
  visitorKey,
}: {
  coupon: ActiveCoupon;
  visitorKey: string;
}) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
      {/* クーポン種類 */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{coupon.coupon_type.emoji}</span>
        <div>
          <p className="font-bold text-gray-900">{coupon.coupon_type.name}</p>
          <p className="text-xs text-gray-500">{coupon.coupon_type.description}</p>
        </div>
      </div>

      {/* 金額 */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-5xl font-extrabold text-green-600">
          {coupon.amount}
        </span>
        <span className="text-2xl font-bold text-green-600">円引き</span>
      </div>

      {/* 有効期限 */}
      <p className="mb-4 text-sm text-gray-400">
        有効期限: {formatExpiresAt(coupon.expires_at)}
      </p>

      {/* クーポンコード（お店に見せるもの） */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
        <p className="mb-1.5 text-xs font-semibold text-gray-500">
          お店のスタッフにお見せください
        </p>
        {showCode ? (
          <p className="break-all font-mono text-xs text-gray-700">{visitorKey}</p>
        ) : (
          <button
            type="button"
            onClick={() => setShowCode(true)}
            className="w-full rounded-lg border border-green-200 bg-green-50 py-2.5 text-sm font-bold text-green-700 transition hover:bg-green-100"
          >
            クーポンコードを表示する
          </button>
        )}
      </div>
    </div>
  );
}
