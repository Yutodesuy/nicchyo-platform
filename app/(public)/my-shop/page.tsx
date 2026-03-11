"use client";

import Link from "next/link";
import { Megaphone, Store, LogOut, BarChart2, Sparkles, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import NavigationBar from "@/app/components/NavigationBar";

const MENU_ITEMS = [
  {
    title: "最新情報の発信",
    description: "今日のおすすめ・残り数量など",
    href: "/vendor/post/new",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    icon: Megaphone,
  },
  {
    title: "出店情報の更新",
    description: "商品・決済方法・出店日",
    href: "/vendor/store",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    icon: Store,
  },
  {
    title: "アナリティクス",
    description: "閲覧数・人気商品・時間帯分析",
    href: "/vendor/analytics",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    icon: BarChart2,
  },
  {
    title: "AIばあちゃんに教える",
    description: "お店の情報をAIに学習させる",
    href: "/vendor/ai-knowledge",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
    icon: Sparkles,
  },
];

export default function MyShopPage() {
  const { isLoggedIn, permissions, logout } = useAuth();
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
          {isLoggedIn && (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut size={12} />
              ログアウト
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 pt-5">
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
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {MENU_ITEMS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 px-4 py-4 transition active:bg-slate-50 ${
                      index !== MENU_ITEMS.length - 1 ? "border-b border-slate-100" : ""
                    }`}
                  >
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}>
                      <Icon size={22} className={item.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                    <ChevronRight size={18} className="flex-shrink-0 text-slate-300" />
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
