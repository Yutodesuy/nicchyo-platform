"use client";

import Link from "next/link";
import { BarChart3, MapPinned, Shield, Store, Users } from "lucide-react";
import NavigationBar from "@/app/components/NavigationBar";

const MENU_ITEMS = [
  {
    title: "管理ダッシュボード",
    description: "全体状況の確認",
    href: "/admin",
    icon: Shield,
    accent: "from-red-500/35 via-red-100/70 to-white",
  },
  {
    title: "店舗管理",
    description: "出店情報の管理",
    href: "/admin/shops",
    icon: Store,
    accent: "from-orange-500/35 via-orange-100/70 to-white",
  },
  {
    title: "ユーザー管理",
    description: "権限とアカウント管理",
    href: "/admin/users",
    icon: Users,
    accent: "from-amber-500/35 via-amber-100/70 to-white",
  },
  {
    title: "分析を見る",
    description: "アクセスや利用状況の確認",
    href: "/admin/analytics",
    icon: BarChart3,
    accent: "from-rose-500/35 via-rose-100/70 to-white",
  },
  {
    title: "マップ管理",
    description: "建物や店舗マーカの位置を編集",
    href: "/map-edit",
    icon: MapPinned,
    accent: "from-sky-500/35 via-sky-100/70 to-white",
  },
];

export default function MyMarketPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.18),_rgba(255,255,255,0))] pb-24">
      <div className="border-b border-red-100 bg-white/90 px-4 py-4 backdrop-blur-sm md:hidden">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-red-600">
            Market Admin
          </p>
          <h1 className="text-xl font-bold text-slate-900">マイ市場</h1>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 pt-5 md:max-w-4xl md:pt-8">
        <div className="hidden md:block">
          <div className="rounded-[32px] border border-red-100 bg-white/95 px-6 py-7 text-center shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-red-700">
              Market Admin
            </p>
            <h1 className="mt-2 text-4xl font-bold text-slate-900 md:text-5xl">
              マイ市場
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              管理者向けの主要メニューをここから開けます。
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.accent}`} />
                <div className="absolute inset-0 bg-white/35 backdrop-blur-[1px]" aria-hidden="true" />
                <div className="relative flex min-h-[180px] flex-col gap-4 px-6 py-6">
                  <div className="flex items-center justify-end">
                    <span className="rounded-3xl border border-white/80 bg-white/85 p-3 text-slate-700 shadow-md">
                      <Icon size={30} />
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <NavigationBar />
    </div>
  );
}
