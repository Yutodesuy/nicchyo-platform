"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NavigationBar from "@/app/components/NavigationBar";
import { useAuth } from "@/lib/auth/AuthContext";
import { fetchAllProductSales } from "../../_services/analyticsService";
import type { ProductSale } from "../../_types";
import { ArrowLeft, Medal, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
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
  const { user } = useAuth();
  const [sales, setSales] = useState<ProductSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchAllProductSales(user.id)
      .then(setSales)
      .finally(() => setIsLoading(false));
  }, [user]);

  const sorted = [...sales].sort((a, b) => b.quantity - a.quantity);
  const maxQty = sorted[0]?.quantity ?? 1;

  return (
    <div className="min-h-screen bg-[#FFFAF0] pb-24">
      <div className="border-b border-amber-100 bg-white/90 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link href="/vendor/analytics" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-600">Product Analytics</p>
            <h1 className="text-xl font-bold text-slate-900">商品分析</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-5">

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-amber-500" />
          </div>
        ) : (
          <>
            {/* 自店ランキング */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Medal size={14} />
                </div>
                <h2 className="text-sm font-semibold text-slate-700">自店 商品ランキング</h2>
                <Link href="/vendor/analytics/input" className="ml-auto text-[10px] font-medium text-amber-600 hover:underline">
                  データを入力 →
                </Link>
              </div>

              {sorted.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-400">販売データがありません</p>
                  <Link href="/vendor/analytics/input" className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-400">
                    今日の販売を入力する →
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-4 space-y-3">
                    {sorted.map((item, i) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-5 flex-shrink-0 text-center">
                          {i < 3 ? <Medal size={16} className={MEDAL_COLORS[i]} /> : <span className="text-xs font-bold text-slate-400">{i + 1}</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">{item.product_name}</span>
                            <span className="text-sm font-bold text-slate-800">{item.quantity} 個</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${Math.round((item.quantity / maxQty) * 100)}%`, backgroundColor: RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)] }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={sorted} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="product_name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "#fef3c7" }} />
                      <Bar dataKey="quantity" radius={[6, 6, 0, 0]} maxBarSize={32}>
                        {sorted.map((_, i) => <Cell key={i} fill={RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>

          </>
        )}
      </div>
      <NavigationBar />
    </div>
  );
}
