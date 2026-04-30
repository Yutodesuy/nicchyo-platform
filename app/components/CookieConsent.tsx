"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

import {
  getAnalyticsConsent,
  getLocationConsent,
  loadGA,
  setAnalyticsConsent,
  setLocationConsent,
  type ConsentValue,
} from "@/lib/analytics/consentClient";

type ConsentChoice = Exclude<ConsentValue, null>;

export default function CookieConsent() {
  const [analyticsConsent, setAnalyticsConsentState] = useState<ConsentValue>(null);
  const [locationConsent, setLocationConsentState] = useState<ConsentValue>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

  useEffect(() => {
    const storedAnalytics = getAnalyticsConsent();
    const storedLocation = getLocationConsent();
    setAnalyticsConsentState(storedAnalytics);
    setLocationConsentState(storedLocation);
    if (storedAnalytics === "accepted" && gaId && process.env.NODE_ENV === "production") {
      loadGA(gaId);
    }
    setIsReady(true);
  }, [gaId]);

  useEffect(() => {
    if (analyticsConsent === "accepted" && gaId && process.env.NODE_ENV === "production") {
      loadGA(gaId);
    }
  }, [analyticsConsent, gaId]);

  const needsPrompt = analyticsConsent === null || locationConsent === null;

  const persist = (nextAnalytics: ConsentChoice, nextLocation: ConsentChoice) => {
    setAnalyticsConsent(nextAnalytics);
    setLocationConsent(nextLocation);
    setAnalyticsConsentState(nextAnalytics);
    setLocationConsentState(nextLocation);
  };

  const acceptAll = () => persist("accepted", "accepted");
  const declineAll = () => persist("declined", "declined");
  const savePreferences = () => {
    persist(
      analyticsConsent === "accepted" ? "accepted" : "declined",
      locationConsent === "accepted" ? "accepted" : "declined"
    );
  };

  if (!isReady || !needsPrompt) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] p-3 sm:p-4">
      <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-xl">

        {/* メインバナー */}
        {!showDetail ? (
          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                🍪 当サイトはサービス改善のため Cookie および位置情報を利用します。詳細は
                <Link href="/privacy" className="mx-1 text-green-600 underline underline-offset-2 hover:text-green-700">
                  プライバシーポリシー
                </Link>
                をご確認ください。
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
              >
                すべて許可
              </button>
              <button
                type="button"
                onClick={declineAll}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                拒否する
              </button>
              <button
                type="button"
                onClick={() => setShowDetail(true)}
                className="px-2 py-2 text-sm text-gray-400 underline underline-offset-2 hover:text-gray-600"
              >
                設定を変更
              </button>
            </div>
          </div>
        ) : (
          /* 詳細設定パネル */
          <div className="px-5 py-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Cookie の設定</p>
              <button
                type="button"
                onClick={() => setShowDetail(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="閉じる"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {/* 必須 */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">必須 Cookie</p>
                  <p className="mt-0.5 text-xs text-gray-500">サービスの動作に必要なため、常に有効です。</p>
                </div>
                <span className="shrink-0 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500">
                  常に有効
                </span>
              </div>

              {/* 解析 */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div id="analytics-label">
                  <p className="text-sm font-medium text-gray-800">解析 Cookie</p>
                  <p className="mt-0.5 text-xs text-gray-500">Google Analytics による利用状況の計測に使います。</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={analyticsConsent === "accepted"}
                  aria-labelledby="analytics-label"
                  onClick={() =>
                    setAnalyticsConsentState(analyticsConsent === "accepted" ? "declined" : "accepted")
                  }
                  className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                    analyticsConsent === "accepted" ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      analyticsConsent === "accepted" ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* 位置情報 */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div id="location-label">
                  <p className="text-sm font-medium text-gray-800">位置情報</p>
                  <p className="mt-0.5 text-xs text-gray-500">現在地表示や周辺案内のために使います。</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={locationConsent === "accepted"}
                  aria-labelledby="location-label"
                  onClick={() =>
                    setLocationConsentState(locationConsent === "accepted" ? "declined" : "accepted")
                  }
                  className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                    locationConsent === "accepted" ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      locationConsent === "accepted" ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={savePreferences}
                className="flex-1 rounded-lg bg-green-500 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
              >
                設定を保存
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                すべて許可
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
