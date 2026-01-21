"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import TurnstileWidget from "../../components/TurnstileWidget";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const hasCaptcha = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("ユーザー名を入力してください。");
      return;
    }
    if (!email.trim()) {
      setError("メールアドレスを入力してください。");
      return;
    }
    if (!password) {
      setError("パスワードを入力してください。");
      return;
    }
    if (password !== passwordConfirm) {
      setError("パスワードが一致しません。");
      return;
    }
    if (hasCaptcha && !captchaToken) {
      setError("認証を完了してください。");
      return;
    }

    setIsSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          role: "general_user",
        },
        captchaToken: hasCaptcha ? captchaToken : undefined,
      },
    });
    setIsSubmitting(false);

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "登録に失敗しました。");
      return;
    }

    router.push("/map");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-24">
      <div className="mx-auto w-full max-w-md px-4 pt-10">
        <div className="mb-6 rounded-3xl border border-orange-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            new account
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">アカウント登録</h1>
          <p className="mt-2 text-sm text-slate-600">
            メールアドレスとパスワードで新しいアカウントを作ります。
          </p>
        </div>

        <form
          className="space-y-4 rounded-3xl border border-orange-300 bg-white p-5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <label className="block text-sm text-slate-700">
            ユーザー名
            <input
              type="text"
              required
              placeholder="例: nicchyo_user"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none"
            />
          </label>
          <label className="block text-sm text-slate-700">
            メールアドレス
            <input
              type="email"
              required
              placeholder="example@domain.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none"
            />
          </label>
          <label className="block text-sm text-slate-700">
            パスワード
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none"
            />
          </label>
          <label className="block text-sm text-slate-700">
            パスワード（確認）
            <input
              type="password"
              required
              placeholder="••••••••"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none"
            />
          </label>

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-amber-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            {isSubmitting ? "登録中..." : "アカウントを作成する"}
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
