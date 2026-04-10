"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Ticket, CheckCircle2, XCircle, Loader2, Star, ScanLine, RotateCcw } from "lucide-react";
import NavigationBar from "@/app/components/NavigationBar";
import { useAuth } from "@/lib/auth/AuthContext";
import type { RedeemResponse } from "@/lib/coupons/types";

// html5-qrcodeはブラウザAPIのためSSRを無効化
const QrScanner = dynamic(() => import("./QrScanner"), { ssr: false });

type RedeemState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "loading"; visitorKey: string }
  | { status: "success"; result: RedeemResponse }
  | { status: "error"; message: string };

function todayJST(): string {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  )
    .toISOString()
    .slice(0, 10);
}

export default function MyShopCouponPage() {
  const { isLoggedIn, isLoading } = useAuth();
  const [redeemState, setRedeemState] = useState<RedeemState>({ status: "idle" });

  const handleScan = useCallback(async (visitorKey: string) => {
    // スキャン済み or 処理中は無視
    if (redeemState.status !== "scanning") return;

    setRedeemState({ status: "loading", visitorKey });

    try {
      const res = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor_key: visitorKey, market_date: todayJST() }),
      });
      const json = await res.json();

      if (!res.ok) {
        const msgMap: Record<number, string> = {
          400: "QRコードの有効期限が切れたか、読み取りに失敗しました",
          401: "ログインが必要です",
          403: "このお店はクーポン参加店ではありません",
          409: "このお客様はクーポンをお持ちではありません",
        };
        setRedeemState({
          status: "error",
          message: msgMap[res.status] ?? json.error ?? "処理に失敗しました",
        });
        return;
      }

      setRedeemState({ status: "success", result: json as RedeemResponse });
    } catch {
      setRedeemState({ status: "error", message: "通信エラーが発生しました" });
    }
  }, [redeemState.status]);

  const startScanning = () => setRedeemState({ status: "scanning" });
  const reset = () => setRedeemState({ status: "idle" });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-gray-600">出店者としてログインしてください。</p>
        <Link
          href="/login"
          className="rounded-full bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow"
        >
          ログイン
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-28">
      {/* ヘッダー */}
      <div className="border-b border-green-100 bg-white/90 px-4 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/my-shop"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition hover:bg-gray-200"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">クーポンを確定する</h1>
            <p className="text-xs text-gray-500">お客様のQRコードを読み取ります</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-6 space-y-5">

        {/* ─ 待機中 ─ */}
        {redeemState.status === "idle" && (
          <>
            <div className="rounded-2xl border border-green-100 bg-white p-4 text-sm text-gray-600 shadow-sm">
              <ol className="list-decimal list-inside space-y-1">
                <li>「スキャンを開始する」を押す</li>
                <li>お客様の「クーポン」ページのQRコードにカメラを向ける</li>
                <li>読み取り完了で自動的に確定されます</li>
              </ol>
            </div>
            <button
              type="button"
              onClick={startScanning}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 py-4 text-base font-bold text-white shadow transition hover:bg-green-600"
            >
              <ScanLine size={20} />
              スキャンを開始する
            </button>
          </>
        )}

        {/* ─ スキャン中 ─ */}
        {redeemState.status === "scanning" && (
          <>
            <p className="text-center text-sm font-semibold text-gray-600">
              お客様のQRコードを枠内に合わせてください
            </p>
            <QrScanner onScan={handleScan} active />
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-50"
            >
              キャンセル
            </button>
          </>
        )}

        {/* ─ 処理中 ─ */}
        {redeemState.status === "loading" && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white py-10 shadow-sm">
            <Loader2 size={36} className="animate-spin text-green-500" />
            <p className="text-sm font-semibold text-gray-600">クーポンを確定中...</p>
          </div>
        )}

        {/* ─ エラー ─ */}
        {redeemState.status === "error" && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <XCircle size={30} className="text-red-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">確定できませんでした</p>
                <p className="mt-1 text-sm text-red-600">{redeemState.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={startScanning}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3.5 text-sm font-bold text-white shadow transition hover:bg-green-600"
            >
              <RotateCcw size={16} />
              もう一度スキャンする
            </button>
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-50"
            >
              戻る
            </button>
          </div>
        )}

        {/* ─ 成功 ─ */}
        {redeemState.status === "success" && (
          <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 size={36} className="text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">確定しました</p>
                <p className="mt-1 text-sm text-gray-500">
                  ¥{redeemState.result.amount_discounted} 割引が適用されました
                </p>
              </div>
            </div>

            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-600">スタンプ</span>
                {redeemState.result.is_new_stamp ? (
                  <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
                    <Star size={14} fill="currentColor" />
                    新しいスタンプを付与
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">スタンプ済み（新規なし）</span>
                )}
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-600">次回クーポン</span>
                {redeemState.result.next_coupon_issued ? (
                  <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                    🎟️ {redeemState.result.next_coupon?.coupon_type?.name ?? "クーポン"}を発行
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">発行なし</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={startScanning}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3.5 text-sm font-bold text-white shadow transition hover:bg-green-600"
            >
              <ScanLine size={16} />
              続けてスキャンする
            </button>
            {redeemState.result.next_coupon_issued && (
              <Link
                href="/coupons?lottery=1"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
              >
                <Ticket size={16} />
                クーポンを確認する
              </Link>
            )}
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              戻る
            </button>
          </div>
        )}

        {/* ─ 待機中のみ：クーポンを確定する旨のボタン下の補足 ─ */}
        {redeemState.status === "idle" && (
          <p className="text-center text-xs text-gray-400">
            カメラへのアクセス許可が必要です
          </p>
        )}
      </div>

      <NavigationBar />
    </div>
  );
}
