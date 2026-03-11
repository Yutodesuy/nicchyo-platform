"use client";

import Link from "next/link";
import { Megaphone, Store, BarChart2, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import NavigationBar from "@/app/components/NavigationBar";

const MENU_ITEMS = [
  {
    title: "最新情報の発信",
    description: "今日のおすすめ・残り数量など",
    href: "/vendor/post/new",
    accent: "from-amber-500/40 via-amber-100/70 to-white",
    icon: Megaphone,
    image: "/images/home/posters/HomePagePoster3.jpeg",
  },
  {
    title: "出店情報の更新",
    description: "商品・決済方法・出店日",
    href: "/vendor/store",
    accent: "from-emerald-400/40 via-emerald-100/70 to-white",
    icon: Store,
    image: "/images/home/posters/HomePagePoster2.png",
  },
  {
    title: "アナリティクス",
    description: "閲覧数・人気商品・時間帯分析",
    href: "/vendor/analytics",
    accent: "from-violet-400/40 via-violet-100/70 to-white",
    icon: BarChart2,
    image: "/images/home/posters/HomePagePoster6.jpeg",
  },
  {
    title: "AIばあちゃんに教える",
    description: "お店の情報をAIに学習させる",
    href: "/vendor/ai-knowledge",
    accent: "from-rose-400/40 via-rose-100/70 to-white",
    icon: Sparkles,
    image: "/images/home/posters/HomePagePoster2.png",
  },
];

export default function MyShopPage() {
  const { isLoggedIn, permissions } = useAuth();
  const canAccess = isLoggedIn;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_rgba(255,255,255,0))] pb-24">
      {/* ヘッダー */}
      <div className="border-b border-amber-100 bg-white/90 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-600">
              Vendor Console
            </p>
            <h1 className="text-xl font-bold text-slate-900">出店者メニュー</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 pt-5 md:max-w-4xl">
        {!canAccess ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            出店者としてログインしてください。ログインは
            <Link href="/login" className="ml-1 font-semibold underline">
              出店者ログイン
            </Link>
            から行えます。
          </div>
        ) : (
          <>
            {!permissions.isVendor && (
              <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                現在のアカウントに出店者ロールが設定されていません。表示はできますが、保存時に制限が出る場合があります。
              </div>
            )}
            <div className="grid gap-5 md:grid-cols-3">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-70"
                      style={{ backgroundImage: `url(${item.image})` }}
                      aria-hidden="true"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.accent}`} />
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" aria-hidden="true" />
                    <div className="relative flex h-full min-h-[170px] flex-col gap-3 px-6 py-5">
                      <div className="flex items-center justify-end">
                        <span className="rounded-3xl border border-white/70 bg-white/80 p-3 text-slate-700 shadow-md">
                          <Icon size={32} />
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-semibold text-slate-900 md:text-[32px]">
                          {item.title}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
      <NavigationBar />
    </div>
  );
}
