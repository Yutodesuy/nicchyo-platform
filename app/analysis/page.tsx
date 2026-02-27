import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import VisitorTrendSwitcher from "./VisitorTrendSwitcher";

type CategoryCount = {
  name: string;
  count: number;
  color: string;
};

type VendorRow = {
  category_id: string | null;
};

type CategoryRow = {
  id: string;
  name: string | null;
};

type VisitorRow = {
  visit_date: string;
  visitor_count: number | null;
};

type VisitorChartPoint = {
  key: string;
  label: string;
  value: number;
  trend: number;
};

const PIE_COLORS = [
  "#F97316",
  "#FB923C",
  "#F59E0B",
  "#FDBA74",
  "#EA580C",
  "#C2410C",
  "#D97706",
  "#B45309",
];

export const revalidate = 3600;

function getTokyoDateParts(baseDate: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(baseDate);
  const year = Number(parts.find((p) => p.type === "year")?.value ?? "0");
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "0");
  const day = Number(parts.find((p) => p.type === "day")?.value ?? "0");
  return { year, month, day };
}

function getTokyoTodayIso(baseDate = new Date()) {
  const { year, month, day } = getTokyoDateParts(baseDate);
  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function formatJapaneseDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00+09:00`);
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function toUtcDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`);
}

function isoFromUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shiftIsoDays(isoDate: string, days: number) {
  const date = toUtcDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return isoFromUtcDate(date);
}

function formatMonthDayLabel(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00+09:00`);
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function getWeekStartIso(isoDate: string) {
  const date = toUtcDate(isoDate);
  const day = date.getUTCDay();
  const shift = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + shift);
  return isoFromUtcDate(date);
}

function shiftMonthKey(monthKey: string, delta: number) {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  return `${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}`;
}

function formatMonthLabel(monthKey: string) {
  const [yearText, monthText] = monthKey.split("-");
  return `${yearText}/${monthText}`;
}

function addTrend(points: Omit<VisitorChartPoint, "trend">[]) {
  return points.map((point, index) => {
    const windowStart = Math.max(0, index - 2);
    const values = points.slice(windowStart, index + 1).map((item) => item.value);
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    return { ...point, trend: avg };
  });
}

function buildDailySeries(todayIso: string, byDate: Map<string, number>, days = 14) {
  const points: Omit<VisitorChartPoint, "trend">[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const key = shiftIsoDays(todayIso, -i);
    points.push({
      key,
      label: formatMonthDayLabel(key),
      value: byDate.get(key) ?? 0,
    });
  }
  return addTrend(points);
}

function buildWeeklySeries(todayIso: string, byDate: Map<string, number>, weeks = 12) {
  const byWeekStart = new Map<string, number>();
  byDate.forEach((value, dateKey) => {
    const weekStart = getWeekStartIso(dateKey);
    byWeekStart.set(weekStart, (byWeekStart.get(weekStart) ?? 0) + value);
  });

  const currentWeekStart = getWeekStartIso(todayIso);
  const points: Omit<VisitorChartPoint, "trend">[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const key = shiftIsoDays(currentWeekStart, -7 * i);
    points.push({
      key,
      label: `${formatMonthDayLabel(key)}週`,
      value: byWeekStart.get(key) ?? 0,
    });
  }
  return addTrend(points);
}

function buildMonthlySeries(todayIso: string, byDate: Map<string, number>, months = 12) {
  const byMonth = new Map<string, number>();
  byDate.forEach((value, dateKey) => {
    const monthKey = dateKey.slice(0, 7);
    byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + value);
  });

  const currentMonthKey = todayIso.slice(0, 7);
  const points: Omit<VisitorChartPoint, "trend">[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const key = shiftMonthKey(currentMonthKey, -i);
    points.push({
      key,
      label: formatMonthLabel(key),
      value: byMonth.get(key) ?? 0,
    });
  }
  return addTrend(points);
}

function buildYearlySeries(todayIso: string, byDate: Map<string, number>, years = 5) {
  const byYear = new Map<string, number>();
  byDate.forEach((value, dateKey) => {
    const yearKey = dateKey.slice(0, 4);
    byYear.set(yearKey, (byYear.get(yearKey) ?? 0) + value);
  });

  const currentYear = Number(todayIso.slice(0, 4));
  const points: Omit<VisitorChartPoint, "trend">[] = [];
  for (let i = years - 1; i >= 0; i -= 1) {
    const key = String(currentYear - i);
    points.push({
      key,
      label: `${key}年`,
      value: byYear.get(key) ?? 0,
    });
  }
  return addTrend(points);
}

function PieChart({ data }: { data: CategoryCount[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let accumulatedLength = 0;

  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
      <div className="mx-auto h-[220px] w-[220px]">
        {total > 0 ? (
          <svg viewBox="0 0 220 220" className="h-full w-full">
            <g transform="rotate(-90 110 110)">
              {data.map((item) => {
                const segmentLength = (item.count / total) * circumference;
                const currentOffset = accumulatedLength;
                accumulatedLength += segmentLength;
                return (
                  <circle
                    key={item.name}
                    cx="110"
                    cy="110"
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="30"
                    strokeDasharray={`${segmentLength} ${circumference}`}
                    strokeDashoffset={-currentOffset}
                    strokeLinecap="butt"
                  />
                );
              })}
            </g>
            <circle cx="110" cy="110" r="45" fill="#ffffff" />
            <text
              x="110"
              y="106"
              textAnchor="middle"
              className="fill-amber-900 text-[10px] font-semibold"
            >
              総出店数
            </text>
            <text
              x="110"
              y="126"
              textAnchor="middle"
              className="fill-amber-900 text-[18px] font-bold"
            >
              {total}
            </text>
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center rounded-full border border-dashed border-amber-200 bg-amber-50/60 text-sm text-amber-800">
            データなし
          </div>
        )}
      </div>

      <ul className="space-y-2">
        {data.map((item) => {
          const percentage = total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0;
          return (
            <li
              key={item.name}
              className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-amber-900">{item.name}</span>
              </div>
              <div className="text-sm text-amber-900/80">
                {item.count}件 ({percentage}%)
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default async function AnalysisPage() {
  const todayIso = getTokyoTodayIso();
  const todayLabel = formatJapaneseDate(todayIso);
  const historyStartIso = `${String(Number(todayIso.slice(0, 4)) - 4)}-01-01`;
  const hasSupabaseEnv =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  let categoryCounts: CategoryCount[] = [];
  let webVisitorCount: number | null = null;
  let dailyChart: VisitorChartPoint[] = [];
  let weeklyChart: VisitorChartPoint[] = [];
  let monthlyChart: VisitorChartPoint[] = [];
  let yearlyChart: VisitorChartPoint[] = [];
  let dataFetchNote = "";

  if (hasSupabaseEnv) {
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);

      const [
        { data: categoriesData, error: categoriesError },
        { data: vendorsData, error: vendorsError },
        { data: visitorRowsData, error: visitorRowsError },
      ] =
        await Promise.all([
          supabase.from("categories").select("id, name"),
          supabase.from("vendors").select("category_id"),
          supabase
            .from("web_visitor_stats")
            .select("visit_date, visitor_count")
            .gte("visit_date", historyStartIso)
            .order("visit_date", { ascending: true }),
        ]);

      if (categoriesError) {
        throw categoriesError;
      }
      if (vendorsError) {
        throw vendorsError;
      }

      const categories = Array.isArray(categoriesData) ? (categoriesData as CategoryRow[]) : [];
      const vendors = Array.isArray(vendorsData) ? (vendorsData as VendorRow[]) : [];

      const categoryNameById = new Map<string, string>();
      categories.forEach((category) => {
        if (category.id) {
          categoryNameById.set(category.id, category.name?.trim() || "未分類");
        }
      });

      const countByName = new Map<string, number>();
      vendors.forEach((vendor) => {
        const name = vendor.category_id
          ? categoryNameById.get(vendor.category_id) ?? "未分類"
          : "未分類";
        countByName.set(name, (countByName.get(name) ?? 0) + 1);
      });

      categoryCounts = Array.from(countByName.entries())
        .map(([name, count], index) => ({
          name,
          count,
          color: PIE_COLORS[index % PIE_COLORS.length],
        }))
        .sort((a, b) => b.count - a.count);

      if (visitorRowsError) {
        dataFetchNote = "web_visitor_stats の取得に失敗しました。";
      } else {
        const visitorRows = Array.isArray(visitorRowsData) ? (visitorRowsData as VisitorRow[]) : [];
        const visitorsByDate = new Map<string, number>();
        visitorRows.forEach((row) => {
          if (!row.visit_date) return;
          visitorsByDate.set(row.visit_date, row.visitor_count ?? 0);
        });

        webVisitorCount = visitorsByDate.get(todayIso) ?? null;
        dailyChart = buildDailySeries(todayIso, visitorsByDate, 14);
        weeklyChart = buildWeeklySeries(todayIso, visitorsByDate, 12);
        monthlyChart = buildMonthlySeries(todayIso, visitorsByDate, 12);
        yearlyChart = buildYearlySeries(todayIso, visitorsByDate, 5);
      }
    } catch {
      dataFetchNote = "Supabaseからのデータ取得に失敗しました。";
    }
  } else {
    dataFetchNote = "Supabase環境変数が未設定のため、データを取得できません。";
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8] px-6 py-14 text-amber-950">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-amber-700/80">NICCHYO ANALYTICS</p>
          <h1 className="mt-3 text-3xl font-bold text-amber-900 md:text-4xl">日曜市をデータで見る</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-amber-900/70">
            Supabaseのデータを使って、カテゴリ別の出店比率と日次のWeb来訪者数を表示しています。
          </p>
        </header>

        <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-amber-900">カテゴリ別出店比率</h2>
          <p className="mt-2 text-sm text-amber-900/70">
            `vendors.category_id` と `categories.name` を集計して円グラフ化しています。
          </p>
          <div className="mt-5">
            <PieChart data={categoryCounts} />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-amber-900">本日の来訪者数（Web）</h2>
          <p className="mt-2 text-sm text-amber-900/70">{todayLabel} のデータを表示しています。</p>
          <p className="mt-4 text-4xl font-extrabold text-orange-600">
            {webVisitorCount !== null ? `${webVisitorCount.toLocaleString()} 人` : "データ未登録"}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-amber-800/80">
            ※この数値は現地来訪者数ではなく、Web来訪者数です。
          </p>
          {dataFetchNote ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{dataFetchNote}</p>
          ) : null}

          <div className="mt-6">
            <VisitorTrendSwitcher
              dailyChart={dailyChart}
              weeklyChart={weeklyChart}
              monthlyChart={monthlyChart}
              yearlyChart={yearlyChart}
            />
          </div>
        </section>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full border border-amber-200 bg-white px-5 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-50"
          >
            ホームへ戻る
          </Link>
          <Link
            href="/map"
            className="rounded-full bg-amber-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
          >
            マップを見る
          </Link>
        </div>
      </div>
    </main>
  );
}
