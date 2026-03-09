"use client";

import Link from "next/link";
import NavigationBar from "@/app/components/NavigationBar";
import { MOCK_HOURLY } from "../../_mock/data";
import { ArrowLeft, Clock, TrendingUp } from "lucide-react";
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

const PEAK_COLOR = "#f59e0b";
const BASE_COLOR = "#fde68a";

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-amber-100 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="text-base font-bold text-amber-600">{payload[0].value} 回</p>
    </div>
  );
}

export default function TimeAnalyticsPage() {
  const maxViews = Math.max(...MOCK_HOURLY.map((d) => d.views));
  const peakHour = MOCK_HOURLY.find((d) => d.views === maxViews);

  const insights = [
    {
      label: "ピーク時間",
      value: peakHour?.hour ?? "-",
      sub: `閲覧数 ${maxViews} 回`,
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "市場の平均",
      value: "9時",
      sub: "最も賑わう時間帯",
      icon: Clock,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
  ];

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
              Time Analytics
            </p>
            <h1 className="text-xl font-bold text-slate-900">時間帯分析</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-5">

        {/* インサイトカード */}
        <div className="grid grid-cols-2 gap-3">
          {insights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl ${item.bg}`}>
                  <Icon size={15} className={item.color} />
                </div>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-slate-400">{item.sub}</p>
              </div>
            );
          })}
        </div>

        {/* グラフ */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-1 text-sm font-semibold text-slate-700">時間帯別 閲覧数</p>
          <p className="mb-4 text-xs text-slate-400">今週日曜日のデータ</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MOCK_HOURLY} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#fef3c7" }} />
              <Bar dataKey="views" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {MOCK_HOURLY.map((entry) => (
                  <Cell
                    key={entry.hour}
                    fill={entry.views === maxViews ? PEAK_COLOR : BASE_COLOR}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
              ピーク時間
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-200" />
              その他
            </span>
          </div>
        </div>

        {/* アドバイス */}
        <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
          <p className="text-xs font-semibold text-sky-700">💡 アドバイス</p>
          <p className="mt-1 text-xs leading-relaxed text-sky-800">
            {peakHour?.hour}頃が最も閲覧が多い時間帯です。この時間帯に合わせて
            SNS投稿や限定商品のアナウンスをすると効果的です。
          </p>
        </div>

      </div>
      <NavigationBar />
    </div>
  );
}
