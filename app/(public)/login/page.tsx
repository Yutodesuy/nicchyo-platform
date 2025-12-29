"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../../lib/auth/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithCredentials } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const ok = loginWithCredentials(identifier, password);
    if (!ok) {
      setError("メールアドレス/ユーザーネームまたはパスワードが違います。");
      return;
    }
    router.push("/map");
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
            メールアドレス または ユーザーネーム
            <input
              type="text"
              required
              placeholder="example@domain.com / nicchyo_user"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
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
