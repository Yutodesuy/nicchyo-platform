"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import NavigationBar from "@/app/components/NavigationBar";

const MENU_ITEMS = [
  {
    title: "最新情報の発信",
    description: "お知らせや近況を投稿します。",
    href: "/my-shop/contents",
  },
  {
    title: "スケジュールの登録",
    description: "出店予定や営業日を更新します。",
    href: "/my-shop/schedule",
  },
  {
    title: "出店情報の更新",
    description: "店舗情報・商品・紹介文を編集します。",
    href: "/my-shop/detail",
  },
];

export default function MyShopPage() {
  const { isLoggedIn, permissions } = useAuth();
  const canAccess = isLoggedIn;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-24">
      <div className="mx-auto w-full max-w-3xl px-4 pt-6">
        <div className="rounded-3xl border border-amber-100 bg-white/95 px-6 py-6 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
            My shop
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            出店者メニュー
          </h1>
          <p className="mt-2 text-base text-slate-600">
            更新したい内容を選んでください。
          </p>
        </div>

        {!canAccess ? (
          <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            出店者としてログインしてください。ログインは
            <Link href="/shops" className="ml-1 font-semibold underline">
              出店者ログイン
            </Link>
            から行えます。
          </div>
        ) : (
          <>
            {!permissions.isVendor && (
              <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                現在のアカウントに出店者ロールが設定されていません。表示はできますが、保存時に制限が出る場合があります。
              </div>
            )}
            <div className="mt-4 grid gap-4">
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-3xl border border-amber-100 bg-white px-6 py-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
                >
                  <h2 className="text-xl font-semibold text-slate-900">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                  <span className="mt-4 inline-flex items-center text-sm font-semibold text-amber-700">
                    開く →
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <NavigationBar />
    </div>
  );
}
