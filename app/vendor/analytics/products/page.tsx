"use client";

import Link from "next/link";
import NavigationBar from "@/app/components/NavigationBar";
import { MOCK_PRODUCT_SALES, MOCK_MARKET_TRENDS } from "../../_mock/data";
import { ArrowLeft, Medal, Globe } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const RANK_COLORS = ["#f59e0b", "#94a3b8", "#d97706", "#60a5fa", "#a78bfa"];
const MEDAL_COLORS = ["text-amber-400", "text-slate-400", "text-amber-700"];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-amber-100 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="text-base font-bold text-amber-600">{payload[0].value} 個</p>
    </div>
  );
}

export default function ProductAnalyticsPage() {
  const sorted = [...MOCK_PRODUCT_SALES].sort((a, b) => b.quantity - a.quantity);
  const maxQty = sorted[0]?.quantity ?? 1;

  return (
    <div className="min-h-screen bg-[#FFFAF0] pb-24">
      {/* ヘッダー */}
      <div className="border-b border-amber-100 bg-white/90 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/vendor/analytics"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-600">
              Product Analytics
            </p>
            <h1 className="text-xl font-bold text-slate-900">商品分析</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-5">

        {/* 自店ランキング */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Medal size={14} />
            </div>
            <h2 className="text-sm font-semibold text-slate-700">自店 商品ランキング</h2>
            <Link
              href="/vendor/analytics/input"
              className="ml-auto text-[10px] font-medium text-amber-600 hover:underline"
            >
              データを入力 →
            </Link>
          </div>

          {/* ランキングリスト */}
          <div className="mb-4 space-y-3">
            {sorted.map((item, i) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-5 flex-shrink-0 text-center">
                  {i < 3 ? (
                    <Medal size={16} className={MEDAL_COLORS[i]} />
                  ) : (
                    <span className="text-xs font-bold text-slate-400">{i + 1}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{item.product_name}</span>
                    <span className="text-sm font-bold text-slate-800">{item.quantity} 個</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((item.quantity / maxQty) * 100)}%`,
                        backgroundColor: RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)],
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* バーチャート */}
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={sorted} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="product_name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#fef3c7" }} />
              <Bar dataKey="quantity" radius={[6, 6, 0, 0]} maxBarSize={32}>
                {sorted.map((_, i) => (
                  <Cell key={i} fill={RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 市場トレンド */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <Globe size={14} />
            </div>
            <h2 className="text-sm font-semibold text-slate-700">市場全体 人気商品トレンド</h2>
          </div>
          <div className="space-y-3">
            {MOCK_MARKET_TRENDS.map((item) => {
              const maxTotal = MOCK_MARKET_TRENDS[0].total_quantity;
              const pct = Math.round((item.total_quantity / maxTotal) * 100);
              return (
                <div key={item.rank} className="flex items-center gap-3">
                  <span className={`w-5 flex-shrink-0 text-center text-xs font-black ${
                    item.rank === 1 ? "text-amber-400" : item.rank === 2 ? "text-slate-400" : item.rank === 3 ? "text-amber-700" : "text-slate-400"
                  }`}>
                    {item.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">{item.product_name}</span>
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-400">
                          {item.vendor_count}店舗
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">{item.total_quantity.toLocaleString()} 個</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-violet-100">
                      <div
                        className="h-full rounded-full bg-violet-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] text-slate-400">※ 出店者が入力した販売数量の合計値</p>
        </div>

      </div>
      <NavigationBar />
    </div>
  );
}
