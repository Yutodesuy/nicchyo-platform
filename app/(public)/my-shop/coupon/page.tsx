"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ticket, CheckCircle2, XCircle, Loader2, Star } from "lucide-react";
import NavigationBar from "@/app/components/NavigationBar";
import { useAuth } from "@/lib/auth/AuthContext";
import type { RedeemResponse } from "@/lib/coupons/types";

type RedeemState =
  | { status: "idle" }
  | { status: "loading" }
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
  const [visitorKey, setVisitorKey] = useState("");
  const [redeemState, setRedeemState] = useState<RedeemState>({ status: "idle" });

  const handleRedeem = async () => {
    const key = visitorKey.trim();
    if (!key) return;

    setRedeemState({ status: "loading" });
    try {
      const res = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor_key: key, market_date: todayJST() }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msgMap: Record<number, string> = {
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
      setVisitorKey("");
    } catch {
      setRedeemState({ status: "error", message: "通信エラーが発生しました" });
    }
  };

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
            <p className="text-xs text-gray-500">お客様のクーポンを使用済みにします</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-6 space-y-5">

        {/* 使い方説明 */}
        <div className="rounded-2xl border border-green-100 bg-white p-4 text-sm text-gray-600 shadow-sm">
          <ol className="list-decimal list-inside space-y-1">
            <li>お客様のクーポンページを開いてもらう</li>
            <li>画面に表示されている「クーポンコード」を確認する</li>
            <li>下のボックスにコードを入力して「確定」を押す</li>
          </ol>
        </div>

        {/* 入力フォーム */}
        {redeemState.status !== "success" && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
            <div>
              <label
                htmlFor="visitor-key"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                クーポンコード
              </label>
              <input
                id="visitor-key"
                type="text"
                value={visitorKey}
                onChange={(e) => {
                  setVisitorKey(e.target.value);
                  if (redeemState.status === "error") setRedeemState({ status: "idle" });
                }}
                placeholder="お客様の画面に表示されているコードを入力"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-mono text-gray-800 placeholder-gray-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>

            {redeemState.status === "error" && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <XCircle size={16} className="flex-shrink-0" />
                {redeemState.message}
              </div>
            )}

            <button
              type="button"
              onClick={handleRedeem}
              disabled={!visitorKey.trim() || redeemState.status === "loading"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-4 text-base font-bold text-white shadow transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {redeemState.status === "loading" ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Ticket size={18} />
              )}
              {redeemState.status === "loading" ? "処理中..." : "クーポンを確定する"}
            </button>
          </div>
        )}

        {/* 成功表示 */}
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
              onClick={reset}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              続けてクーポンを確定する
            </button>
          </div>
        )}
      </div>

      <NavigationBar />
    </div>
  );
}
