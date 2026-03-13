"use client";

import { useMemo, useState } from "react";

export type TrafficGranularity = "day" | "week" | "month" | "year";

export type TrafficPoint = {
  key: string;
  label: string;
  value: number;
};

const GRANULARITY_LABELS: Record<TrafficGranularity, string> = {
  day: "日あたり",
  week: "週あたり",
  month: "月あたり",
  year: "年あたり",
};

type Props = {
  eyebrow: string;
  title: string;
  barClassName: string;
  panelClassName: string;
  dotClassName: string;
  legendLabel: string;
  seriesByGranularity: Record<TrafficGranularity, TrafficPoint[]>;
};

export default function TrafficChartCard({
  eyebrow,
  title,
  barClassName,
  panelClassName,
  dotClassName,
  legendLabel,
  seriesByGranularity,
}: Props) {
  const [granularity, setGranularity] = useState<TrafficGranularity>("day");
  const points = seriesByGranularity[granularity] ?? [];
  const max = useMemo(() => Math.max(...points.map((point) => point.value), 1), [points]);

  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-bold text-gray-900">{title}</h2>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <div className="inline-flex rounded-2xl bg-slate-100 p-1">
            {(Object.keys(GRANULARITY_LABELS) as TrafficGranularity[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setGranularity(key)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  granularity === key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {GRANULARITY_LABELS[key]}
              </button>
            ))}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              最大 {max} 人/{GRANULARITY_LABELS[granularity].replace("あたり", "")}
            </p>
            <div className="mt-2 flex items-center justify-end gap-2 text-xs text-slate-500">
              <span className={`h-2.5 w-2.5 rounded-full ${dotClassName}`} />
              {legendLabel}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 flex h-72 items-end gap-3">
        {points.map((point) => (
          <div key={point.key} className="flex flex-1 flex-col items-center gap-3">
            <div className={`flex h-56 w-full items-end rounded-2xl px-2 pb-2 ${panelClassName}`}>
              <div
                className={`w-full rounded-xl shadow-[0_10px_24px_rgba(15,23,42,0.16)] ${barClassName}`}
                style={{ height: `${Math.max((point.value / max) * 100, point.value > 0 ? 10 : 0)}%` }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900">{point.value}</p>
              <p className="text-xs text-gray-500">{point.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
