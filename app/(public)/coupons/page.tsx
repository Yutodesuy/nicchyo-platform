"use client";

import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MapPin, TicketX } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import NavigationBar from "@/app/components/NavigationBar";
import { getOrCreateConsultVisitorKey } from "@/lib/consultVisitorKey";
import {
  COUPON_LOTTERY_PENDING_KEY,
  fetchMyCoupons,
  todayJstString,
} from "@/lib/coupons/client";
import type {
  CouponIssuance,
  CouponQrTokenResponse,
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
type LotteryStage = "idle" | "lottery" | "revealed";

function getQrProgressColor(secondsLeft: number): string {
  if (secondsLeft <= 60) return "bg-rose-500";
  if (secondsLeft <= 150) return "bg-amber-400";
  return "bg-emerald-500";
}

function CouponsPageContent() {
  const isDevCouponOverride = process.env.NEXT_PUBLIC_DEV_MARKET_DAY === "true";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<MyCouponsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [visitorKey, setVisitorKey] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(0);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [lotteryStage, setLotteryStage] = useState<LotteryStage>("idle");
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

  const refreshQrToken = useCallback(
    async (vk: string) => {
      setIsQrLoading(true);
      try {
        const response = await fetch(
          `/api/coupons/qr-token?market_date=${marketDate}`,
          { headers: { "X-Visitor-Key": vk } }
        );
        if (!response.ok) {
          setQrToken(null);
          setQrSecondsLeft(0);
          return;
        }
        const payload = (await response.json()) as CouponQrTokenResponse;
        setQrToken(payload.token);
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

  const activeCoupon = data?.active_coupon as ActiveCoupon | null;
  const isMarketDay = isDevCouponOverride || (data?.is_market_day ?? false);

  useEffect(() => {
    if (!visitorKey || !activeCoupon) {
      setQrToken(null);
      setQrSecondsLeft(0);
      return;
    }
    refreshQrToken(visitorKey);
  }, [activeCoupon, refreshQrToken, visitorKey]);

  useEffect(() => {
    if (!qrToken || qrSecondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setQrSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [qrSecondsLeft, qrToken]);

  useEffect(() => {
    if (!visitorKey || !activeCoupon || qrSecondsLeft > 0 || isQrLoading) return;
    refreshQrToken(visitorKey);
  }, [activeCoupon, isQrLoading, qrSecondsLeft, refreshQrToken, visitorKey]);

  useEffect(() => {
    if (isLoading || !activeCoupon || lotteryHandledRef.current) return;
    const hasPendingFlag =
      typeof window !== "undefined" &&
      window.localStorage.getItem(COUPON_LOTTERY_PENDING_KEY) === "1";
    const shouldStartLottery = hasPendingFlag || searchParams?.get("lottery") === "1";
    if (!shouldStartLottery) return;

    lotteryHandledRef.current = true;
    setLotteryStage("lottery");
    if (hasPendingFlag) {
      window.localStorage.removeItem(COUPON_LOTTERY_PENDING_KEY);
    }
    if (searchParams?.get("lottery") === "1") {
      router.replace("/coupons");
    }
    const timer = window.setTimeout(() => {
      setLotteryStage("revealed");
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [activeCoupon, isLoading, router, searchParams]);

  const activeCouponVendors = useMemo(() => {
    if (!activeCoupon) return [];
    return (data?.participating_vendors ?? [])
      .filter((vendor) => vendor.coupon_type_id === activeCoupon.coupon_type_id)
      .sort((a, b) => {
        if (a.is_stamped === b.is_stamped) {
          return a.vendor_name.localeCompare(b.vendor_name, "ja");
        }
        return a.is_stamped ? 1 : -1;
      });
  }, [activeCoupon, data?.participating_vendors]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white pb-28">
      <div className="px-4 pt-6 pb-4">
        <div className="rounded-3xl border border-green-100 bg-white/95 px-5 py-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-green-600">Coupon</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">クーポン</h1>
              <p className="mt-1 text-sm text-gray-500">日曜市の参加店でそのまま使えます</p>
            </div>
            {isMarketDay && (
              <div className="rounded-2xl bg-green-50 px-4 py-2 text-right">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-green-700">
                  保有中
                </p>
                <p className="text-2xl font-extrabold text-green-700">
                  {activeCoupon ? "1" : "0"}
                  <span className="ml-1 text-sm font-semibold">枚</span>
                </p>
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
                  開催日にマップを開くと、最初のクーポンを受け取れます。
                </p>
              </>
            )}
          </div>
        )}

        {isMarketDay && (
          <section className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
              今日のクーポン
            </p>
            {activeCoupon && visitorKey ? (
              lotteryStage === "lottery" ? (
                <LotteryCard />
              ) : (
                <ActiveCouponCard
                  coupon={activeCoupon}
                  qrToken={qrToken}
                  qrSecondsLeft={qrSecondsLeft}
                  isQrLoading={isQrLoading}
                  showRevealNotice={lotteryStage === "revealed"}
                />
              )
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-gray-200 bg-white px-5 py-6 text-center shadow-sm">
                <TicketX className="h-10 w-10 text-gray-300" />
                <div>
                  <p className="font-semibold text-gray-700">クーポンはまだありません</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    マップを開くと、最初の1枚を受け取れます。
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

        {isMarketDay && activeCoupon && activeCouponVendors.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                  このクーポンが使えるお店
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  条件を満たす参加店ならどこでも使えます
                </p>
              </div>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                {activeCouponVendors.length}店
              </span>
            </div>

            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              {activeCouponVendors.map((vendor, index) => (
                <div
                  key={`${vendor.vendor_id}-${vendor.coupon_type_id}`}
                  className={`flex items-start gap-3 px-4 py-4 ${
                    index > 0 ? "border-t border-gray-100" : ""
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                    {vendor.coupon_type_emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {vendor.vendor_name}
                      </p>
                      {vendor.is_stamped && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                          スタンプ済み
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 text-sm font-bold text-white shadow transition hover:bg-gray-700"
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
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        </div>
      }
    >
      <CouponsPageContent />
    </Suspense>
  );
}

function LotteryCard() {
  return (
    <div className="rounded-3xl border border-green-200 bg-white px-5 py-10 shadow-sm">
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <span className="absolute text-4xl animate-[spin_2.6s_linear_infinite]">🎟️</span>
          <span className="absolute text-2xl -translate-x-7 translate-y-5 animate-[ping_1.8s_ease-in-out_infinite]">
            ✨
          </span>
          <span className="absolute text-2xl translate-x-7 -translate-y-5 animate-[ping_2.2s_ease-in-out_infinite]">
            ✨
          </span>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">クーポンを引いています...</p>
          <p className="mt-1 text-sm text-gray-500">
            今日使える1枚を準備しています
          </p>
        </div>
      </div>
    </div>
  );
}

function ActiveCouponCard({
  coupon,
  qrToken,
  qrSecondsLeft,
  isQrLoading,
  showRevealNotice,
}: {
  coupon: ActiveCoupon;
  qrToken: string | null;
  qrSecondsLeft: number;
  isQrLoading: boolean;
  showRevealNotice: boolean;
}) {
  const progressPercent = Math.max(0, Math.min(100, (qrSecondsLeft / 300) * 100));
  const progressColor = getQrProgressColor(qrSecondsLeft);

  return (
    <div className="rounded-3xl border border-green-200 bg-white p-5 shadow-sm">
      {showRevealNotice && (
        <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          新しいクーポンを受け取りました
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <span className="text-4xl">{coupon.coupon_type.emoji}</span>
        <div>
          <p className="font-bold text-gray-900">{coupon.coupon_type.name}</p>
          <p className="text-xs text-gray-500">{coupon.coupon_type.description}</p>
        </div>
      </div>

      <div className="mb-1 flex items-baseline gap-1">
        <span className="text-5xl font-extrabold text-green-600">{coupon.amount}</span>
        <span className="text-2xl font-bold text-green-600">円引き</span>
      </div>

      <p className="mb-5 text-sm text-gray-400">有効期限: {formatExpiresAt(coupon.expires_at)}</p>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-5">
        <div className="flex flex-col items-center gap-3">
          {qrToken ? (
            <QRCodeSVG value={qrToken} size={180} level="M" bgColor="#F9FAFB" fgColor="#111827" />
          ) : (
            <div className="flex h-[180px] w-[180px] items-center justify-center rounded-2xl bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
          )}
          <p className="text-center text-xs leading-relaxed text-gray-500">
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
