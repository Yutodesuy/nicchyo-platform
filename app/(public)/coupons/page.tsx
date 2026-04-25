"use client";

import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import NavigationBar from "@/app/components/NavigationBar";
import { Badge } from "@/components/ui/badge";
import { getOrCreateConsultVisitorKey } from "@/lib/consultVisitorKey";
import {
  COUPON_LOTTERY_PENDING_KEY,
  fetchMyCoupons,
  todayJstString,
} from "@/lib/coupons/client";
import { isMilestoneStep, type MilestoneStep } from "@/lib/coupons/milestones";
import type {
  CouponIssuance,
  CouponQrTokensResponse,
  CouponType,
  MyCouponsResponse,
} from "@/lib/coupons/types";

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

function getQrProgressColor(secondsLeft: number): string {
  if (secondsLeft <= 60) return "bg-rose-500";
  if (secondsLeft <= 150) return "bg-amber-400";
  return "bg-emerald-500";
}

const MILESTONE_AMOUNTS: Record<MilestoneStep, number> = { 1: 100, 3: 200, 5: 300 };
const STAMP_TOTAL = 5;

function StampCard({
  stampCount,
  nextMilestone,
  stampsToNext,
}: {
  stampCount: number;
  nextMilestone: MilestoneStep | null;
  stampsToNext: number;
}) {
  return (
    <div className="rounded-3xl border border-amber-100 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-600">Stamp Card</p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="flex gap-2">
          {Array.from({ length: STAMP_TOTAL }, (_, i) => {
            const slotNum = i + 1;
            const isStamped = slotNum <= stampCount;
            const isMilestone = isMilestoneStep(slotNum);
            return (
              <div key={slotNum} className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-xl transition-all ${
                    isStamped
                      ? "bg-amber-400 shadow-md"
                      : "border-2 border-dashed border-gray-200 bg-gray-50"
                  }`}
                >
                  {isStamped ? "🐾" : (
                    <span className="text-xs font-bold text-gray-300">{slotNum}</span>
                  )}
                </div>
                {isMilestone && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      slotNum <= stampCount
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {MILESTONE_AMOUNTS[slotNum]}円
                  </span>
                )}
                {!isMilestone && <span className="h-4" />}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-gray-700">
        {nextMilestone !== null ? (
          <>
            あと<span className="text-amber-600 font-bold">{stampsToNext}</span>スタンプで{" "}
            <span className="text-amber-600 font-bold">{MILESTONE_AMOUNTS[nextMilestone]}円</span>
            クーポン！
          </>
        ) : stampCount >= STAMP_TOTAL ? (
          <span className="text-green-600">全スタンプ達成！おめでとうございます🎉</span>
        ) : (
          "お店でQRを見せてスタンプをもらおう"
        )}
      </p>
    </div>
  );
}

function CouponsPageContent() {
  const isDevCouponOverride = process.env.NEXT_PUBLIC_DEV_MARKET_DAY === "true";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<MyCouponsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [visitorKey, setVisitorKey] = useState<string | null>(null);
  const [qrTokensByCouponId, setQrTokensByCouponId] = useState<Record<string, string>>({});
  const [qrSecondsLeft, setQrSecondsLeft] = useState(0);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [showNewCouponNotice, setShowNewCouponNotice] = useState(false);
  const lotteryHandledRef = useRef(false);
  const marketDate = todayJstString();

  const fetchData = useCallback(
    async (vk: string) => {
      setIsLoading(true);
      try {
        const next = await fetchMyCoupons(vk, marketDate);
        setData(next);
        setHasLoadError(next === null);
      } finally {
        setIsLoading(false);
      }
    },
    [marketDate]
  );

  const refreshQrTokens = useCallback(
    async (vk: string) => {
      setIsQrLoading(true);
      try {
        const response = await fetch(
          `/api/coupons/qr-token?market_date=${marketDate}`,
          { headers: { "X-Visitor-Key": vk } }
        );
        if (!response.ok) {
          setQrTokensByCouponId({});
          setQrSecondsLeft(0);
          return;
        }
        const payload = (await response.json()) as CouponQrTokensResponse;
        const nextMap: Record<string, string> = {};
        payload.tokens.forEach((item) => {
          nextMap[item.coupon_issuance_id] = item.token;
        });
        setQrTokensByCouponId(nextMap);
        setQrSecondsLeft(payload.expires_in_seconds);
      } finally {
        setIsQrLoading(false);
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

  const activeCoupons = useMemo(
    () => (data?.active_coupons ?? []) as ActiveCoupon[],
    [data?.active_coupons]
  );
  const isMarketDay = isDevCouponOverride || (data?.is_market_day ?? false);

  useEffect(() => {
    if (!visitorKey || activeCoupons.length === 0) {
      setQrTokensByCouponId({});
      setQrSecondsLeft(0);
      return;
    }
    refreshQrTokens(visitorKey);
  }, [activeCoupons.length, refreshQrTokens, visitorKey]);

  useEffect(() => {
    if (Object.keys(qrTokensByCouponId).length === 0 || qrSecondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setQrSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [qrSecondsLeft, qrTokensByCouponId]);

  useEffect(() => {
    if (!visitorKey || activeCoupons.length === 0 || qrSecondsLeft > 0 || isQrLoading) return;
    refreshQrTokens(visitorKey);
  }, [activeCoupons.length, isQrLoading, qrSecondsLeft, refreshQrTokens, visitorKey]);

  useEffect(() => {
    if (isLoading || activeCoupons.length === 0 || lotteryHandledRef.current) return;
    const hasPendingFlag =
      typeof window !== "undefined" &&
      window.localStorage.getItem(COUPON_LOTTERY_PENDING_KEY) === "1";
    const shouldShow = hasPendingFlag || searchParams?.get("lottery") === "1";
    if (!shouldShow) return;

    lotteryHandledRef.current = true;
    setShowNewCouponNotice(true);
    if (hasPendingFlag) {
      window.localStorage.removeItem(COUPON_LOTTERY_PENDING_KEY);
    }
    if (searchParams?.get("lottery") === "1") {
      router.replace("/coupons");
    }
  }, [activeCoupons.length, isLoading, router, searchParams]);

  const activeCouponVendors = useMemo(() => {
    if (activeCoupons.length === 0) return [];
    const activeCouponTypeIds = new Set(activeCoupons.map((c) => c.coupon_type_id));
    return (data?.participating_vendors ?? [])
      .filter((vendor) => activeCouponTypeIds.has(vendor.coupon_type_id))
      .sort((a, b) => {
        if (a.is_stamped === b.is_stamped) {
          return a.vendor_name.localeCompare(b.vendor_name, "ja");
        }
        return a.is_stamped ? 1 : -1;
      });
  }, [activeCoupons, data?.participating_vendors]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white pb-28">
      <div className="px-4 pt-6 pb-4">
        <div className="rounded-3xl border border-amber-100 bg-white/95 px-5 py-5 shadow-card">
          <p className="eyebrow">Coupon</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">クーポン</h1>
              <p className="mt-1 text-sm text-slate-500">日曜市の参加店でそのまま使えます</p>
            </div>
            {isMarketDay && (
              <div className="flex flex-col items-end gap-1">
                <Badge variant="secondary" className="border-amber-200 bg-amber-100 text-amber-800 text-xs">
                  保有中 {activeCoupons.length}枚
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4">
        {!isMarketDay && (
          <div className="rounded-3xl border border-amber-100 bg-amber-50 px-5 py-5 text-center">
            {hasLoadError ? (
              <>
                <p className="font-semibold text-amber-800">クーポン情報を取得できませんでした</p>
                <p className="mt-1 text-sm text-amber-700">
                  通信状態を確認して、もう一度お試しください。
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-amber-800">今日は日曜市の開催日ではありません</p>
                <p className="mt-1 text-sm text-amber-700">
                  開催日にお店でQRを見せると、スタンプが集まります。
                </p>
              </>
            )}
          </div>
        )}

        {isMarketDay && (
          <StampCard
            stampCount={data?.stamp_count ?? 0}
            nextMilestone={data?.next_milestone ?? 1}
            stampsToNext={data?.stamps_to_next ?? 1}
          />
        )}

        {isMarketDay && (
          <section className="space-y-3">
            <p className="eyebrow">今日のクーポン</p>
            {activeCoupons.length > 0 && visitorKey ? (
              <div className="space-y-3">
                {showNewCouponNotice && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    新しいクーポンを受け取りました
                  </div>
                )}
                {activeCoupons.map((coupon) => (
                  <ActiveCouponCard
                    key={coupon.id}
                    coupon={coupon}
                    qrToken={qrTokensByCouponId[coupon.id] ?? null}
                    qrSecondsLeft={qrSecondsLeft}
                    isQrLoading={isQrLoading}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-amber-100 bg-surface-warmwhite px-5 py-6 text-center shadow-card">
                <span className="text-4xl">🐾</span>
                <div>
                  <p className="font-semibold text-slate-700">クーポンはまだありません</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    お店でQRを見せてスタンプを集めると、クーポンがもらえます。
                  </p>
                </div>
                <Link
                  href="/map"
                  className="mt-1 inline-flex h-12 items-center justify-center rounded-full border border-transparent bg-amber-500 px-6 text-base font-medium text-white shadow-pop transition-colors hover:bg-amber-600"
                >
                  マップでお店を探す
                </Link>
              </div>
            )}
          </section>
        )}

        {isMarketDay && activeCoupons.length > 0 && activeCouponVendors.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">クーポンが使えるお店</p>
                <p className="mt-1 text-sm text-slate-500">
                  条件を満たす参加店ならどこでも使えます
                </p>
              </div>
              <Badge variant="secondary" className="border-amber-200 bg-amber-50 text-amber-800">
                {activeCouponVendors.length}店
              </Badge>
            </div>

            <div className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-card">
              {activeCouponVendors.map((vendor, index) => (
                <div
                  key={`${vendor.vendor_id}-${vendor.coupon_type_id}`}
                  className={`flex items-start gap-3 px-4 py-4 ${
                    index > 0 ? "border-t border-amber-50" : ""
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
                    {vendor.coupon_type_emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {vendor.vendor_name}
                      </p>
                      {vendor.is_stamped && (
                        <Badge variant="secondary" className="border-amber-200 bg-amber-100 text-amber-800 text-[11px]">
                          スタンプ済み
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {vendor.min_purchase_amount > 0
                        ? `${vendor.min_purchase_amount.toLocaleString()}円以上で${vendor.coupon_type_amount.toLocaleString()}円引き`
                        : `${vendor.coupon_type_amount.toLocaleString()}円引き`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {isMarketDay && (
          <Link
            href="/map"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-transparent bg-amber-500 px-6 text-base font-medium text-white shadow-pop transition-colors hover:bg-amber-600"
          >
            <MapPin size={16} />
            マップで参加店を見る
          </Link>
        )}
      </div>

      <NavigationBar />
    </div>
  );
}

export default function CouponsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      }
    >
      <CouponsPageContent />
    </Suspense>
  );
}

function ActiveCouponCard({
  coupon,
  qrToken,
  qrSecondsLeft,
  isQrLoading,
}: {
  coupon: ActiveCoupon;
  qrToken: string | null;
  qrSecondsLeft: number;
  isQrLoading: boolean;
}) {
  const progressPercent = Math.max(0, Math.min(100, (qrSecondsLeft / 300) * 100));
  const progressColor = getQrProgressColor(qrSecondsLeft);

  return (
    <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-4xl">{coupon.coupon_type.emoji}</span>
        <div>
          <p className="font-bold text-slate-900">{coupon.coupon_type.name}</p>
          <p className="text-xs text-slate-500">{coupon.coupon_type.description}</p>
        </div>
      </div>

      <div className="mb-1 flex items-baseline gap-1">
        <span className="text-5xl font-extrabold text-amber-600">{coupon.amount}</span>
        <span className="text-2xl font-bold text-amber-600">円引き</span>
      </div>

      <p className="mb-5 text-sm text-slate-400">有効期限: {formatExpiresAt(coupon.expires_at)}</p>

      <div className="rounded-2xl border border-amber-100 bg-surface-tint px-4 py-5">
        <div className="flex flex-col items-center gap-3">
          {qrToken ? (
            <QRCodeSVG value={qrToken} size={180} level="M" bgColor="#FEF3C7" fgColor="#111827" />
          ) : (
            <div className="flex h-[180px] w-[180px] items-center justify-center rounded-2xl bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          )}
          <p className="text-center text-xs leading-relaxed text-slate-500">
            お店のスタッフにこのQRコードを読み取ってもらってください
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-gray-500">安全のため5分ごとに更新</span>
            <span className="text-gray-700">
              {isQrLoading && !qrToken ? "更新中..." : `あと${qrSecondsLeft}秒で更新`}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
