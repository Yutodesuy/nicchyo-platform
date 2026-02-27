import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

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

function getLastSundayIsoInTokyo(baseDate = new Date()) {
  const { year, month, day } = getTokyoDateParts(baseDate);
  const tokyoDateUtc = new Date(Date.UTC(year, month - 1, day));
  const weekday = tokyoDateUtc.getUTCDay();
  const daysToSubtract = weekday === 0 ? 7 : weekday;
  tokyoDateUtc.setUTCDate(tokyoDateUtc.getUTCDate() - daysToSubtract);
  return tokyoDateUtc.toISOString().slice(0, 10);
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
  const lastSundayIso = getLastSundayIsoInTokyo();
  const lastSundayLabel = formatJapaneseDate(lastSundayIso);
  const hasSupabaseEnv =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  let categoryCounts: CategoryCount[] = [];
  let webVisitorCount: number | null = null;
  let dataFetchNote = "";

  if (hasSupabaseEnv) {
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);

      const [{ data: categoriesData, error: categoriesError }, { data: vendorsData, error: vendorsError }] =
        await Promise.all([
          supabase.from("categories").select("id, name"),
          supabase.from("vendors").select("category_id"),
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

      const { data: visitorData, error: visitorError } = await supabase
        .from("web_visitor_stats")
        .select("visit_date, visitor_count")
        .eq("visit_date", lastSundayIso)
        .maybeSingle();

      if (visitorError) {
        dataFetchNote =
          "web_visitor_stats テーブルが未作成、または先週日曜のデータが未登録です。";
      } else {
        const row = visitorData as VisitorRow | null;
        webVisitorCount = row?.visitor_count ?? null;
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
            Supabaseのデータを使って、カテゴリ別の出店比率と先週日曜のWeb来訪者数を表示しています。
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
          <h2 className="text-lg font-bold text-amber-900">先週日曜の来訪者数（Web）</h2>
          <p className="mt-2 text-sm text-amber-900/70">{lastSundayLabel} のデータを表示しています。</p>
          <p className="mt-4 text-4xl font-extrabold text-orange-600">
            {webVisitorCount !== null ? `${webVisitorCount.toLocaleString()} 人` : "データ未登録"}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-amber-800/80">
            ※この数値は現地来訪者数ではなく、Web来訪者数です。
          </p>
          {dataFetchNote ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{dataFetchNote}</p>
          ) : null}
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
