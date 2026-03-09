"use client";

import Link from "next/link";
import NavigationBar from "@/app/components/NavigationBar";
import { MOCK_ANALYTICS, MOCK_STORE } from "../_mock/data";
import {
  ArrowLeft,
  Eye,
  MousePointerClick,
  Search,
  BarChart2,
  Clock,
  ShoppingBag,
  TrendingUp,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

function DeltaBadge({ current, prev }: { current: number; prev: number }) {
  const diff = current - prev;
  const pct = prev > 0 ? Math.round((diff / prev) * 100) : 0;
  if (diff === 0) return null;
  const up = diff > 0;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${up ? "text-emerald-600" : "text-rose-500"}`}>
      {up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {Math.abs(pct)}%
    </span>
  );
}

const SUB_PAGES = [
  {
    href: "/vendor/analytics/time",
    icon: Clock,
    label: "時間帯分析",
    desc: "来訪ピーク時間を確認",
    color: "bg-sky-50 text-sky-600 border-sky-100",
  },
  {
    href: "/vendor/analytics/products",
    icon: ShoppingBag,
    label: "商品分析",
    desc: "人気商品ランキング・市場トレンド",
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    href: "/vendor/analytics/input",
    icon: TrendingUp,
    label: "販売数量を入力",
    desc: "今日の売上データを記録",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
];

export default function VendorAnalyticsPage() {
  const { thisWeek, lastWeek, rank, totalVendors } = MOCK_ANALYTICS;

  const metrics = [
    {
      label: "閲覧数",
      icon: Eye,
      value: thisWeek.views,
      prev: lastWeek.views,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "クリック数",
      icon: MousePointerClick,
      value: thisWeek.clicks,
      prev: lastWeek.clicks,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
    {
      label: "検索表示数",
      icon: Search,
      value: thisWeek.searchImpressions,
      prev: lastWeek.searchImpressions,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFAF0] pb-24">
      {/* ヘッダー */}
      <div className="border-b border-amber-100 bg-white/90 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/my-shop"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-600">
              Analytics
            </p>
            <h1 className="text-xl font-bold text-slate-900">アナリティクス</h1>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5">
            <BarChart2 size={13} className="text-amber-600" />
            <span className="text-xs font-semibold text-amber-700">{MOCK_STORE.name}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-5">

        {/* 今週の指標 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold text-slate-500">今週の閲覧状況</p>
          <div className="grid grid-cols-3 gap-3">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="text-center">
                  <div className={`mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl ${m.bg}`}>
                    <Icon size={16} className={m.color} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{m.value.toLocaleString()}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{m.label}</p>
                  <div className="mt-1 flex justify-center">
                    <DeltaBadge current={m.value} prev={m.prev} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[10px] text-slate-400">
            ↑ 先週比
          </p>
        </div>

        {/* 注目度ランキング */}
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm">
          <p className="mb-1 text-xs font-semibold text-slate-500">市場内注目度ランキング</p>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-amber-500">{rank}</span>
            <span className="mb-1 text-sm text-slate-500">位 / {totalVendors}店中</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-amber-100">
            <div
              className="h-full rounded-full bg-amber-400"
              style={{ width: `${Math.round(((totalVendors - rank + 1) / totalVendors) * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">閲覧数・クリック数をもとに算出</p>
        </div>

        {/* サブページへのリンク */}
        <div className="space-y-2.5">
          {SUB_PAGES.map((page) => {
            const Icon = page.icon;
            return (
              <Link
                key={page.href}
                href={page.href}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:shadow-md"
              >
                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border ${page.color}`}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800">{page.label}</p>
                  <p className="text-xs text-slate-500">{page.desc}</p>
                </div>
                <ChevronRight size={16} className="flex-shrink-0 text-slate-300" />
              </Link>
            );
          })}
        </div>

      </div>
      <NavigationBar />
    </div>
  );
}
