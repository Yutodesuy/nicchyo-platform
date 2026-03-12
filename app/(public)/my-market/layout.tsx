"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";

function GuardMessage({
  title,
  message,
  cta,
}: {
  title: string;
  message: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50">
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-base font-semibold uppercase tracking-[0.3em] text-red-700">
          My Market
        </p>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h1>
        <p className="mt-2 text-lg text-slate-600">{message}</p>
        {cta && (
          <Link
            href={cta.href}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-red-500"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function MyMarketLayout({ children }: { children: ReactNode }) {
  const { user, permissions, isLoading } = useAuth();

  if (isLoading) {
    return (
      <GuardMessage
        title="読み込み中です"
        message="ログイン状態を確認しています。しばらくお待ちください。"
      />
    );
  }

  if (!user) {
    return (
      <GuardMessage
        title="ログインしてください"
        message="管理者専用ページです。ログインしてからご利用ください。"
        cta={{ href: "/login", label: "ログインへ" }}
      />
    );
  }

  if (!permissions.isSuperAdmin) {
    return (
      <GuardMessage
        title="管理者専用です"
        message="管理者ロールのアカウントでログインしてください。"
        cta={{ href: "/", label: "トップへ戻る" }}
      />
    );
  }

  return <>{children}</>;
}
