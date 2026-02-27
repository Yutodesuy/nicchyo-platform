"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type VisitorChartPoint = {
  key: string;
  label: string;
  value: number;
  trend: number;
};

type Mode = "daily" | "weekly" | "monthly" | "yearly";

type Props = {
  dailyChart: VisitorChartPoint[];
  weeklyChart: VisitorChartPoint[];
  monthlyChart: VisitorChartPoint[];
  yearlyChart: VisitorChartPoint[];
};

function VisitorCompositeChart({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: VisitorChartPoint[];
}) {
  const width = 720;
  const height = 260;
  const marginTop = 16;
  const marginRight = 16;
  const marginBottom = 44;
  const marginLeft = 36;
  const chartWidth = width - marginLeft - marginRight;
  const chartHeight = height - marginTop - marginBottom;
  const baseMax = data.reduce((max, point) => Math.max(max, point.value, point.trend), 0);
  const maxValue = Math.max(1, Math.ceil(baseMax * 1.1));
  const step = data.length > 0 ? chartWidth / data.length : chartWidth;
  const barWidth = Math.max(6, step * 0.58);
  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  const xAt = (index: number) => marginLeft + index * step + step / 2;
  const yAt = (value: number) => marginTop + chartHeight - (value / maxValue) * chartHeight;
  const linePath = data
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xAt(index)} ${yAt(point.trend)}`)
    .join(" ");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [data]);

  return (
    <article className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
      <h3 className="text-base font-bold text-amber-900">{title}</h3>
      <p className="mt-1 text-xs text-amber-800/80">{subtitle}</p>
      <div ref={scrollRef} className="mt-3 w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[680px] w-full">
          {[0, 1, 2, 3, 4].map((lineIndex) => {
            const ratio = lineIndex / 4;
            const y = marginTop + chartHeight * ratio;
            return (
              <line
                key={`grid-${lineIndex}`}
                x1={marginLeft}
                y1={y}
                x2={width - marginRight}
                y2={y}
                stroke="#FDE68A"
                strokeWidth="1"
              />
            );
          })}

          {data.map((point, index) => {
            const barHeight = (point.value / maxValue) * chartHeight;
            return (
              <rect
                key={`bar-${point.key}`}
                x={xAt(index) - barWidth / 2}
                y={marginTop + chartHeight - barHeight}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill="#F59E0B"
                opacity="0.82"
              />
            );
          })}

          {data.length > 1 ? (
            <path d={linePath} fill="none" stroke="#9A3412" strokeWidth="2.5" strokeLinecap="round" />
          ) : null}

          {data.map((point, index) => (
            <circle
              key={`dot-${point.key}`}
              cx={xAt(index)}
              cy={yAt(point.trend)}
              r="2.5"
              fill="#9A3412"
            />
          ))}

          {data.map((point, index) =>
            index % labelStep === 0 || index === data.length - 1 ? (
              <text
                key={`label-${point.key}`}
                x={xAt(index)}
                y={height - 16}
                textAnchor="middle"
                className="fill-amber-900 text-[10px]"
              >
                {point.label}
              </text>
            ) : null
          )}
        </svg>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px] text-amber-900/80">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />
          棒: 実数値
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-amber-900" />
          折れ線: 3期間移動平均
        </span>
      </div>
    </article>
  );
}

export default function VisitorTrendSwitcher({
  dailyChart,
  weeklyChart,
  monthlyChart,
  yearlyChart,
}: Props) {
  const [mode, setMode] = useState<Mode>("daily");

  const selected = useMemo(() => {
    if (mode === "weekly") {
      return { title: "週次推移", subtitle: "直近12週間の来訪者数（週合計）", data: weeklyChart };
    }
    if (mode === "monthly") {
      return { title: "月次推移", subtitle: "直近12か月の来訪者数（月合計）", data: monthlyChart };
    }
    if (mode === "yearly") {
      return { title: "年次推移", subtitle: "直近5年の来訪者数（年合計）", data: yearlyChart };
    }
    return { title: "日次推移", subtitle: "直近14日間の来訪者数", data: dailyChart };
  }, [mode, dailyChart, weeklyChart, monthlyChart, yearlyChart]);

  const modes: { key: Mode; label: string }[] = [
    { key: "daily", label: "日次" },
    { key: "weekly", label: "週次" },
    { key: "monthly", label: "月次" },
    { key: "yearly", label: "年次" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {modes.map((item) => {
          const active = item.key === mode;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setMode(item.key)}
              className={[
                "rounded-full border px-4 py-1.5 text-sm font-semibold transition",
                active
                  ? "border-amber-700 bg-amber-700 text-white"
                  : "border-amber-200 bg-white text-amber-900 hover:bg-amber-50",
              ].join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <VisitorCompositeChart title={selected.title} subtitle={selected.subtitle} data={selected.data} />
    </div>
  );
}
