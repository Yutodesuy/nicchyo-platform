"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, CheckCircle2 } from "lucide-react";
import NavigationBar from "@/app/components/NavigationBar";
import { useAuth } from "@/lib/auth/AuthContext";
import type { CouponType, VendorCouponSetting } from "@/lib/coupons/types";

type MinAmount = 0 | 300 | 500 | 1000;

const MIN_AMOUNT_OPTIONS: { value: MinAmount; label: string }[] = [
  { value: 0,    label: "条件なし（何円でも可）" },
  { value: 300,  label: "300円以上" },
  { value: 500,  label: "500円以上" },
  { value: 1000, label: "1,000円以上" },
];

type LocalSetting = {
  coupon_type_id: string;
  is_participating: boolean;
  min_purchase_amount: MinAmount;
};

export default function VendorCouponSettingsPage() {
  const { isLoggedIn, isLoading } = useAuth();
  const [couponTypes, setCouponTypes] = useState<CouponType[]>([]);
  const [localSettings, setLocalSettings] = useState<Record<string, LocalSetting>>({});
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      setIsFetching(true);
      try {
        const res = await fetch("/api/vendor/coupon-settings");
        if (!res.ok) return;
        const data = (await res.json()) as {
          settings: VendorCouponSetting[];
          coupon_types: CouponType[];
        };
        setCouponTypes(data.coupon_types);
        // ローカル状態を初期化（既存設定 or デフォルト）
        const init: Record<string, LocalSetting> = {};
        for (const ct of data.coupon_types) {
          const existing = data.settings.find((s) => s.coupon_type_id === ct.id);
          init[ct.id] = {
            coupon_type_id: ct.id,
            is_participating: existing?.is_participating ?? false,
            min_purchase_amount: (existing?.min_purchase_amount ?? 0) as MinAmount,
          };
        }
        setLocalSettings(init);
      } finally {
        setIsFetching(false);
      }
    })();
  }, [isLoggedIn]);

  const handleToggle = (couponTypeId: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      [couponTypeId]: {
        ...prev[couponTypeId],
        is_participating: !prev[couponTypeId].is_participating,
      },
    }));
    setSaveResult(null);
  };

  const handleAmountChange = (couponTypeId: string, amount: MinAmount) => {
    setLocalSettings((prev) => ({
      ...prev,
      [couponTypeId]: {
        ...prev[couponTypeId],
        min_purchase_amount: amount,
      },
    }));
    setSaveResult(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveResult(null);
    try {
      const res = await fetch("/api/vendor/coupon-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: Object.values(localSettings) }),
      });
      setSaveResult(res.ok ? "success" : "error");
    } catch {
      setSaveResult("error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isFetching) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-gray-600">ログインしてください。</p>
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
            <h1 className="text-lg font-bold text-slate-900">クーポン参加設定</h1>
            <p className="text-xs text-gray-500">参加するクーポン種類と条件を設定します</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-5 space-y-4">
        {/* 説明 */}
        <div className="rounded-2xl border border-green-100 bg-white p-4 text-sm text-gray-600 shadow-sm">
          <p>クーポンに参加すると、来訪者が保有するクーポンをお店で使えるようになります。</p>
          <p className="mt-1">参加をONにしたクーポン種類だけ、お客様のマップ・バナーに表示されます。</p>
        </div>

        {couponTypes.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">
            クーポン種類が設定されていません。管理者にお問い合わせください。
          </p>
        )}

        {/* クーポン種類ごとの設定カード */}
        {couponTypes.map((ct) => {
          const setting = localSettings[ct.id];
          if (!setting) return null;
          return (
            <div
              key={ct.id}
              className={`rounded-2xl border bg-white shadow-sm transition ${
                setting.is_participating
                  ? "border-green-200 ring-1 ring-green-200"
                  : "border-gray-100"
              }`}
            >
              <div className="flex items-center gap-3 px-5 py-4">
                <span className="text-3xl">{ct.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{ct.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{ct.description}</p>
                </div>
                {/* 参加トグル */}
                <button
                  type="button"
                  onClick={() => handleToggle(ct.id)}
                  className={`relative h-7 w-12 rounded-full transition-colors ${
                    setting.is_participating ? "bg-green-500" : "bg-gray-200"
                  }`}
                  aria-label={setting.is_participating ? "参加をOFFにする" : "参加をONにする"}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      setting.is_participating ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* 参加ONのときだけ条件設定を表示 */}
              {setting.is_participating && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <p className="mb-3 text-sm font-semibold text-gray-700">最低利用金額</p>
                  <div className="flex flex-wrap gap-2">
                    {MIN_AMOUNT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleAmountChange(ct.id, opt.value)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          setting.min_purchase_amount === opt.value
                            ? "bg-green-500 text-white shadow-sm"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    ※ お客様には「{
                      setting.min_purchase_amount === 0
                        ? "条件なし"
                        : `${setting.min_purchase_amount.toLocaleString()}円以上`
                    }で50円引き」と表示されます
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* 保存ボタン */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 py-4 text-base font-bold text-white shadow transition hover:bg-green-600 disabled:opacity-60"
        >
          {isSaving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          設定を保存する
        </button>

        {saveResult === "success" && (
          <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 size={18} />
            保存しました
          </div>
        )}
        {saveResult === "error" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            保存に失敗しました。再度お試しください。
          </div>
        )}
      </div>

      <NavigationBar />
    </div>
  );
}
