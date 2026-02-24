"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import TurnstileWidget from "@/app/components/TurnstileWidget";

function normalizeShopCode(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return digits.padStart(3, "0").slice(-3);
}

export default function ShopsLoginPage() {
  const router = useRouter();
  const { loginWithCredentials, isLoggedIn, user } = useAuth();
  const [shopCode, setShopCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const hasCaptcha = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const normalizedCode = useMemo(() => normalizeShopCode(shopCode), [shopCode]);
  const email = normalizedCode ? `shop${normalizedCode}@nicchyo.local` : "";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!normalizedCode) {
      setError("店舗コードを3桁で入力してください。");
      return;
    }
    if (!password.trim()) {
      setError("パスワードを入力してください。");
      return;
    }

    if (hasCaptcha && !captchaToken) {
      setError("認証を完了してください。");
      return;
    }

    setIsSubmitting(true);
    const ok = await loginWithCredentials(email, password, hasCaptcha ? captchaToken : undefined);
    setIsSubmitting(false);

    if (!ok) {
      setError("ログインできませんでした。店舗コードまたはパスワードをご確認ください。");
      return;
    }

    router.push("/my-shop");
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-800">
      <div className="mx-auto flex w-full max-w-md flex-col px-4 pt-10">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
              Vendor Portal
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">出店者ログイン</h1>
            <p className="mt-2 text-sm text-slate-600">
              店舗コード（3桁）とパスワードでログインしてください。
            </p>
          </div>

          {isLoggedIn && user?.role === "vendor" && (
            <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              すでにログインしています。続きは
              <Link href="/my-shop" className="ml-1 font-semibold underline">
                マイショップ
              </Link>
              へ進んでください。
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="shopCode" className="mb-1 block text-sm font-medium text-slate-700">
                店舗コード（3桁）
              </label>
              <input
                id="shopCode"
                name="shopCode"
                inputMode="numeric"
                maxLength={3}
                autoComplete="off"
                placeholder="例: 001"
                value={shopCode}
                onChange={(event) => setShopCode(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
              />
              {normalizedCode && (
                <p className="mt-1 text-xs text-slate-500">ログインID: {email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                パスワード
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-10 text-base text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-base font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <span>ログイン</span>
                  <LogIn size={18} />
                </>
              )}
            </button>
          </form>

          {hasCaptcha && (
            <div className="mt-4 flex items-center justify-center">
              <TurnstileWidget
                onVerify={setCaptchaToken}
                onExpire={() => setCaptchaToken("")}
                onError={() => setCaptchaToken("")}
                className="flex items-center justify-center"
              />
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            店舗コードは3桁の番号です。例: <span className="font-semibold">001</span>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          一般のお客様は
          <Link href="/login" className="ml-1 font-semibold text-slate-600 underline">
            通常ログイン
          </Link>
          をご利用ください。
        </div>
      </div>
    </main>
  );
}
