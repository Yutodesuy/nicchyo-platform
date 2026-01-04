"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../../lib/auth/AuthContext";
import TurnstileWidget from "../../components/TurnstileWidget";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { loginWithCredentials } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const hasCaptcha = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (hasCaptcha && !captchaToken) {
      setError("認証を完了してください。");
      return;
    }
    const ok = await loginWithCredentials(
      identifier,
      password,
      hasCaptcha ? captchaToken : undefined
    );
    if (!ok) {
      setError("メールアドレスまたはパスワードが違います。");
      return;
    }
    router.push("/map");
  };

  const handleGoogleLogin = async () => {
    setError("");
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: origin ? `${origin}/map` : undefined,
      },
    });
    if (oauthError) {
      setError("Googleログインに失敗しました。");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-24">
      <div className="mx-auto w-full max-w-md px-4 pt-10">
        <div className="mb-6 rounded-3xl border border-orange-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            login
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">ログイン</h1>
          <p className="mt-2 text-sm text-slate-600">
            メールアドレスとパスワードでログインしてください。
          </p>
        </div>

        <form
          className="space-y-4 rounded-3xl border border-orange-300 bg-white p-5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <label className="block text-sm text-slate-700">
            メールアドレス
            <input
              type="email"
              required
              placeholder="example@domain.com"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none"
            />
          </label>
          <label className="block text-sm text-slate-700">
            パスワード
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 pr-12 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50"
              >
                {showPassword ? "隠す" : "表示"}
              </button>
            </div>
          </label>
          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-amber-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500"
          >
            ログインする
          </button>
        </form>

        <div className="mt-4 rounded-3xl border border-orange-200 bg-white/90 p-4 shadow-sm">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-6 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            aria-label="Googleでログイン"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
              <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303C33.62 32.91 29.168 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.819C14.53 16.011 19.002 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.682 0-14.344 4.342-17.694 10.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.127 0 9.91-1.972 13.477-5.182l-6.222-5.255C29.191 35.091 26.715 36 24 36c-5.147 0-9.586-3.06-11.282-7.477l-6.522 5.02C9.505 39.556 16.227 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303c-1.09 2.76-3.16 5.092-5.848 6.563l.003-.002 6.222 5.255C35.184 40.255 44 36 44 24c0-1.341-.138-2.65-.389-3.917z"
                />
              </svg>
            </span>
            Googleでログイン
          </button>
        </div>

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

        <div className="mt-4 flex items-center justify-center">
          <Link
            href="/"
            className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
