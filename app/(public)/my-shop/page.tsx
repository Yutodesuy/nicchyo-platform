"use client";

import { useEffect, useState, type ElementType } from "react";
import Link from "next/link";
import { Megaphone, Store, BarChart2, Sparkles, Settings, ChevronRight, CheckCircle2, BookOpen } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { fetchVendorStore } from "@/app/vendor/_services/storeService";
import { fetchVendorPosts } from "@/app/vendor/_services/postsService";
import NavigationBar from "@/app/components/NavigationBar";

const MENU_ITEMS: {
  title: string;
  description: string;
  href: string;
  accent: string;
  icon: ElementType;
  image: string;
  badge?: string;
}[] = [
  {
    title: "最新情報の発信",
    description: "今日のおすすめ・残り数量など",
    href: "/vendor/post/new",
    accent: "from-amber-500/40 via-amber-100/70 to-white",
    icon: Megaphone,
    image: "/images/home/posters/HomePagePoster3.jpeg",
  },
  {
    title: "お店の分析",
    description: "閲覧数・人気商品・時間帯分析",
    href: "/vendor/analytics",
    accent: "from-violet-400/40 via-violet-100/70 to-white",
    icon: BarChart2,
    image: "/images/home/posters/HomePagePoster6.jpeg",
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
    title: "AIばあちゃんに教える",
    description: "お店の情報をAIに学習させる",
    href: "/vendor/ai-knowledge",
    accent: "from-rose-400/40 via-rose-100/70 to-white",
    icon: Sparkles,
    image: "/images/home/posters/HomePagePoster2.png",
  },
  {
    title: "使い方ガイド",
    description: "各機能の説明・Tips",
    href: "/vendor/help",
    accent: "from-sky-400/30 via-sky-100/70 to-white",
    icon: BookOpen,
    image: "/images/home/posters/HomePagePoster6.jpeg",
  },
  {
    title: "アカウント設定",
    description: "名前・メール・パスワード変更",
    href: "/vendor/account",
    accent: "from-slate-400/30 via-slate-100/70 to-white",
    icon: Settings,
    image: "/images/home/posters/HomePagePoster3.jpeg",
  },
];

type SetupStep = {
  label: string;
  done: boolean;
  href: string;
};

export default function MyShopPage() {
  const { isLoggedIn, user, permissions, isLoading } = useAuth();
  const canAccess = !isLoading && isLoggedIn;

  const [setupSteps, setSetupSteps] = useState<SetupStep[] | null>(null);
  useEffect(() => {
    if (!user) return;

    Promise.all([fetchVendorStore(user.id), fetchVendorPosts(user.id)]).then(([store, posts]) => {
      if (!store) return;
      const steps: SetupStep[] = [
        { label: "店舗名を設定する", done: !!store.name?.trim(), href: "/vendor/store" },
        { label: "商品を追加する", done: store.main_products.length > 0, href: "/vendor/store" },
        { label: "出店予定日を設定する", done: store.schedule.length > 0, href: "/vendor/store" },
        { label: "決済方法を設定する", done: store.payment_methods.length > 0, href: "/vendor/store" },
        { label: "店舗写真を追加する", done: !!store.shop_image_url, href: "/vendor/store" },
        { label: "最初の投稿をする", done: posts.length > 0, href: "/vendor/post/new" },
      ];
      setSetupSteps(steps);
    }).catch(() => {
      // 取得失敗時は非表示
    });
  }, [user]);

  const incompletedSteps = setupSteps?.filter((s) => !s.done) ?? [];
  const completedCount = setupSteps ? setupSteps.length - incompletedSteps.length : 0;
  const showOnboarding = setupSteps !== null && incompletedSteps.length > 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_rgba(255,255,255,0))] pb-24">
      {/* モバイル用ヘッダー */}
      <div className="border-b border-amber-100 bg-white/90 px-4 py-4 backdrop-blur-sm md:hidden">
        <div className="flex items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">出店者メニュー</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 pt-5 md:max-w-4xl md:pt-8">
        {/* デスクトップ用ヘッダー */}
        <div className="hidden md:block">
          <div className="rounded-[32px] border border-amber-100 bg-white/95 px-6 py-7 text-center shadow-sm">
            <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">
              出店者メニュー
            </h1>
          </div>
        </div>

        {isLoading ? (
        <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ログイン状態を確認しています。しばらくお待ちください。
        </div>
        ) : !canAccess ? (
        <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
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

            {/* 初回オンボーディング */}
            {showOnboarding && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-slate-900">はじめに設定しましょう</p>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {completedCount} / {setupSteps!.length} 完了
                  </span>
                </div>
                {/* プログレスバー */}
                <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${(completedCount / setupSteps!.length) * 100}%` }}
                  />
                </div>
                <ul className="space-y-2">
                  {setupSteps!.map((step) => (
                    <li key={step.label}>
                      <Link
                        href={step.href}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3.5 transition ${
                          step.done
                            ? "bg-slate-50 text-slate-400"
                            : "bg-emerald-50 text-slate-700 hover:bg-emerald-100"
                        }`}
                      >
                        <CheckCircle2
                          size={22}
                          className={`flex-shrink-0 ${step.done ? "text-emerald-400" : "text-slate-300"}`}
                        />
                        <span className={`flex-1 text-base font-medium ${step.done ? "line-through" : ""}`}>
                          {step.label}
                        </span>
                        {!step.done && <ChevronRight size={18} className="flex-shrink-0 text-slate-400" />}
                      </Link>
                    </li>
                  ))}
                </ul>
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
                      <div className="flex items-center justify-between">
                        {item.badge ? (
                          <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                            {item.badge}
                          </span>
                        ) : (
                          <span />
                        )}
                        <span className="rounded-3xl border border-white/70 bg-white/90 p-3 text-slate-700 shadow-md">
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
