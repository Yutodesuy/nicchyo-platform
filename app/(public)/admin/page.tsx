import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLayout, AdminPageHeader, StatCard } from "@/components/admin";
import { createClient } from "@/utils/supabase/server";

type ActivityItem = {
  id: string;
  icon: string;
  text: string;
  timestamp: string | null;
};

type VisitorPoint = {
  date: string;
  count: number;
};

type DurationPoint = {
  date: string;
  averageMinutes: number;
  vendorAverageMinutes: number;
};

type PageAnalyticsRow = {
  visit_date: string;
  visitor_key: string;
  path: string;
  duration_seconds: number | null;
  user_role: string | null;
};

type UrlSummary = {
  path: string;
  visitors: number;
  averageMinutes: number;
  totalMinutes: number;
};

function getRole(user: unknown) {
  if (!user || typeof user !== "object") return null;
  const record = user as {
    app_metadata?: { role?: string };
    user_metadata?: { role?: string; name?: string };
    email?: string;
  };
  return record.app_metadata?.role ?? record.user_metadata?.role ?? null;
}

function isAdminRole(role: string | null) {
  return role === "super_admin" || role === "admin";
}

function getDisplayName(user: unknown) {
  if (!user || typeof user !== "object") return "管理者";
  const record = user as {
    user_metadata?: { name?: string };
    email?: string;
  };
  return record.user_metadata?.name ?? record.email ?? "管理者";
}

function formatDateTime(value: string | null) {
  if (!value) return "日時不明";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日時不明";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function formatMinutes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0.0分";
  return `${value.toFixed(1)}分`;
}

function isAdminAnalyticsRole(role: string | null | undefined) {
  return role === "admin" || role === "super_admin";
}

function buildVisitorDailyDurationMap(rows: PageAnalyticsRow[]) {
  const byDate = new Map<string, Map<string, number>>();

  for (const row of rows) {
    if (!row.visit_date || !row.visitor_key) continue;
    if (isAdminAnalyticsRole(row.user_role)) continue;
    const duration = typeof row.duration_seconds === "number" ? row.duration_seconds : 0;
    const visitorMap = byDate.get(row.visit_date) ?? new Map<string, number>();
    visitorMap.set(row.visitor_key, (visitorMap.get(row.visitor_key) ?? 0) + duration);
    byDate.set(row.visit_date, visitorMap);
  }

  return byDate;
}

function buildDailyUniqueVisitorMap(rows: PageAnalyticsRow[]) {
  const byDate = new Map<string, Set<string>>();

  for (const row of rows) {
    if (!row.visit_date || !row.visitor_key) continue;
    const visitors = byDate.get(row.visit_date) ?? new Set<string>();
    visitors.add(row.visitor_key);
    byDate.set(row.visit_date, visitors);
  }

  return byDate;
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = getRole(user);

  if (!user || !role) {
    redirect("/login");
  }

  if (!isAdminRole(role)) {
    redirect("/");
  }

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);
  const weeklyStart = new Date(now);
  weeklyStart.setDate(now.getDate() - 6);
  const weeklyStartIso = weeklyStart.toISOString().slice(0, 10);

  const [
    vendorsCountResult,
    activeContentsCountResult,
    visitorStatsResult,
    pageAnalyticsResult,
    latestVendorsResult,
    latestContentsResult,
    latestLandmarksResult,
  ] = await Promise.all([
    supabase.from("vendors").select("*", { count: "exact", head: true }),
    supabase
      .from("vendor_contents")
      .select("*", { count: "exact", head: true })
      .gt("expires_at", now.toISOString()),
    supabase
      .from("web_visitor_stats")
      .select("visit_date, visitor_count")
      .gte("visit_date", monthStart)
      .lt("visit_date", monthEnd),
    supabase
      .from("web_page_analytics")
      .select("visit_date, visitor_key, path, duration_seconds, user_role")
      .gte("visit_date", weeklyStartIso)
      .lte("visit_date", todayIso)
      .order("created_at", { ascending: false }),
    supabase
      .from("vendors")
      .select("id, shop_name, created_at")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("vendor_contents")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("map_landmarks")
      .select("key, name, created_at")
      .order("created_at", { ascending: false })
      .limit(2),
  ]);

  const monthVisitors = (visitorStatsResult.data ?? []).reduce((sum, row) => {
    const count = typeof row.visitor_count === "number" ? row.visitor_count : 0;
    return sum + count;
  }, 0);

  const pageAnalytics = Array.isArray(pageAnalyticsResult.data)
    ? (pageAnalyticsResult.data as PageAnalyticsRow[])
    : [];
  const nonAdminPageAnalytics = pageAnalytics.filter((row) => !isAdminAnalyticsRole(row.user_role));
  const weeklyVisitorStatsRows = Array.isArray(visitorStatsResult.data)
    ? visitorStatsResult.data
    : [];
  const monthVisitorTotalByDate = new Map<string, number>();
  for (const row of weeklyVisitorStatsRows) {
    const visitDate = (row as { visit_date?: string }).visit_date;
    if (!visitDate) continue;
    monthVisitorTotalByDate.set(
      visitDate,
      typeof row.visitor_count === "number" ? row.visitor_count : 0
    );
  }
  const dailyUniqueVisitorMap = buildDailyUniqueVisitorMap(nonAdminPageAnalytics);
  const vendorPageAnalytics = nonAdminPageAnalytics.filter((row) => row.user_role === "vendor");
  const vendorDailyUniqueVisitorMap = buildDailyUniqueVisitorMap(vendorPageAnalytics);

  const weeklyVisitorSeries: Array<VisitorPoint & { vendorCount: number }> = Array.from(
    { length: 7 },
    (_, index) => {
      const date = new Date(weeklyStart);
      date.setDate(weeklyStart.getDate() + index);
      const iso = date.toISOString().slice(0, 10);
      return {
        date: iso,
        count: monthVisitorTotalByDate.get(iso) ?? dailyUniqueVisitorMap.get(iso)?.size ?? 0,
        vendorCount: vendorDailyUniqueVisitorMap.get(iso)?.size ?? 0,
      };
    }
  );

  const vendorVisitorsToday = new Set(
    nonAdminPageAnalytics
      .filter((row) => row.visit_date === todayIso && row.user_role === "vendor")
      .map((row) => row.visitor_key)
  ).size;

  const visitorDailyDurationMap = buildVisitorDailyDurationMap(nonAdminPageAnalytics);
  const vendorVisitorDailyDurationMap = buildVisitorDailyDurationMap(vendorPageAnalytics);

  const durationSeries: DurationPoint[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weeklyStart);
    date.setDate(weeklyStart.getDate() + index);
    const iso = date.toISOString().slice(0, 10);
    const visitorDurations = Array.from((visitorDailyDurationMap.get(iso) ?? new Map()).values());
    const totalDuration = visitorDurations.reduce((sum, value) => sum + value, 0);
    const vendorDurations = Array.from((vendorVisitorDailyDurationMap.get(iso) ?? new Map()).values());
    const vendorTotalDuration = vendorDurations.reduce((sum, value) => sum + value, 0);
    return {
      date: iso,
      averageMinutes:
        visitorDurations.length > 0 ? totalDuration / visitorDurations.length / 60 : 0,
      vendorAverageMinutes:
        vendorDurations.length > 0 ? vendorTotalDuration / vendorDurations.length / 60 : 0,
    };
  });

  const durationMax = Math.max(
    ...durationSeries.flatMap((item) => [item.averageMinutes, item.vendorAverageMinutes]),
    1
  );
  const allVisitorTotals = Array.from(visitorDailyDurationMap.values()).flatMap((visitorMap) =>
    Array.from(visitorMap.values())
  );
  const weeklyDurationTotal = allVisitorTotals.reduce((sum, value) => sum + value, 0);
  const webAverageStayMinutes =
    allVisitorTotals.length > 0 ? weeklyDurationTotal / allVisitorTotals.length / 60 : 0;

  const todayUrlMap = new Map<string, Map<string, number>>();
  for (const row of nonAdminPageAnalytics) {
    if (row.visit_date !== todayIso) continue;
    const path = row.path || "/";
    const visitors = todayUrlMap.get(path) ?? new Map<string, number>();
    visitors.set(
      row.visitor_key,
      (visitors.get(row.visitor_key) ?? 0) +
        (typeof row.duration_seconds === "number" ? row.duration_seconds : 0)
    );
    todayUrlMap.set(path, visitors);
  }

  const urlSummaries: UrlSummary[] = Array.from(todayUrlMap.entries())
    .map(([path, visitors]) => {
      const visitorDurations = Array.from(visitors.values());
      const totalSeconds = visitorDurations.reduce((sum, value) => sum + value, 0);
      return {
      path,
      visitors: visitors.size,
      averageMinutes: visitors.size > 0 ? totalSeconds / visitors.size / 60 : 0,
      totalMinutes: totalSeconds / 60,
    };
    })
    .sort((a, b) => {
      if (b.visitors !== a.visitors) return b.visitors - a.visitors;
      return b.totalMinutes - a.totalMinutes;
    })
    .slice(0, 12);

  const weeklyMax = Math.max(
    ...weeklyVisitorSeries.flatMap((item) => [item.count, item.vendorCount]),
    1
  );

  const stats = [
    { title: "登録店舗数", value: vendorsCountResult.count ?? 0, icon: "🏪", bgColor: "bg-blue-50", textColor: "text-blue-600" },
    { title: "今月の訪問者", value: monthVisitors, icon: "📊", bgColor: "bg-purple-50", textColor: "text-purple-600" },
    { title: "出店者アクセス数", value: vendorVisitorsToday, icon: "🧑‍🌾", bgColor: "bg-emerald-50", textColor: "text-emerald-600" },
    { title: "Web平均滞在時間", value: formatMinutes(webAverageStayMinutes), icon: "⏱️", bgColor: "bg-amber-50", textColor: "text-amber-600" },
  ];

  const recentActivities: ActivityItem[] = [
    ...((latestVendorsResult.data ?? []).map((row) => ({
      id: `vendor-${row.id}`,
      icon: "🏪",
      text: `店舗「${row.shop_name ?? "名称未設定"}」が登録されました`,
      timestamp: row.created_at as string | null,
    })) as ActivityItem[]),
    ...((latestContentsResult.data ?? []).map((row) => ({
      id: `content-${row.id}`,
      icon: "📝",
      text: `投稿「${row.title ?? "タイトル未設定"}」が作成されました`,
      timestamp: row.created_at as string | null,
    })) as ActivityItem[]),
    ...((latestLandmarksResult.data ?? []).map((row) => ({
      id: `landmark-${row.key}`,
      icon: "🏛️",
      text: `建物オブジェクト「${row.name ?? row.key}」が追加されました`,
      timestamp: row.created_at as string | null,
    })) as ActivityItem[]),
  ]
    .sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 6);

  return (
    <AdminLayout>
      <AdminPageHeader eyebrow="Admin Dashboard" title="管理者ダッシュボード" />

      <div className="mx-auto max-w-7xl px-4 py-8 pb-20">
        <p className="mb-6 pl-14 text-sm text-slate-600">ようこそ、{getDisplayName(user)}さん</p>
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              bgColor={stat.bgColor}
              textColor={stat.textColor}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow" aria-labelledby="visitor-chart">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-600">
                  Traffic
                </p>
                <h2 id="visitor-chart" className="mt-2 text-xl font-bold text-gray-900">
                  直近7日間の訪問者推移
                </h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">最大 {weeklyMax} 人/日</p>
                <div className="mt-2 flex items-center justify-end gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                    全体
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    出店者のみ
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-8 flex h-72 items-end gap-3">
              {weeklyVisitorSeries.map((item) => (
                <div key={item.date} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-56 w-full items-end gap-2 rounded-2xl bg-gradient-to-b from-purple-50 to-white px-2 pb-2">
                    <div
                      className="w-1/2 rounded-xl bg-gradient-to-t from-purple-600 via-fuchsia-500 to-violet-400 shadow-[0_10px_24px_rgba(139,92,246,0.22)]"
                      style={{ height: `${Math.max((item.count / weeklyMax) * 100, item.count > 0 ? 10 : 0)}%` }}
                    />
                    <div
                      className="w-1/2 rounded-xl bg-gradient-to-t from-emerald-600 via-green-500 to-lime-400 shadow-[0_10px_24px_rgba(16,185,129,0.22)]"
                      style={{
                        height: `${Math.max((item.vendorCount / weeklyMax) * 100, item.vendorCount > 0 ? 10 : 0)}%`,
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900">
                      {item.count} / {item.vendorCount}
                    </p>
                    <p className="text-xs text-gray-500">{formatShortDate(item.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow" aria-labelledby="duration-chart">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
                  Stay Time
                </p>
                <h2 id="duration-chart" className="mt-2 text-xl font-bold text-gray-900">
                  日別の平均滞在時間
                </h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">平均 {formatMinutes(webAverageStayMinutes)}</p>
                <div className="mt-2 flex items-center justify-end gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                    全体
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    出店者のみ
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-8 flex h-72 items-end gap-3">
              {durationSeries.map((item) => (
                <div key={item.date} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-56 w-full items-end gap-2 rounded-2xl bg-gradient-to-b from-sky-50 to-white px-2 pb-2">
                    <div
                      className="w-1/2 rounded-xl bg-gradient-to-t from-sky-600 via-cyan-500 to-teal-400 shadow-[0_10px_24px_rgba(14,165,233,0.22)]"
                      style={{
                        height: `${Math.max((item.averageMinutes / durationMax) * 100, item.averageMinutes > 0 ? 10 : 0)}%`,
                      }}
                    />
                    <div
                      className="w-1/2 rounded-xl bg-gradient-to-t from-emerald-600 via-green-500 to-lime-400 shadow-[0_10px_24px_rgba(16,185,129,0.22)]"
                      style={{
                        height: `${Math.max((item.vendorAverageMinutes / durationMax) * 100, item.vendorAverageMinutes > 0 ? 10 : 0)}%`,
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatMinutes(item.averageMinutes)} / {formatMinutes(item.vendorAverageMinutes)}
                    </p>
                    <p className="text-xs text-gray-500">{formatShortDate(item.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl bg-white p-6 shadow" aria-labelledby="url-summary">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                  URL Analytics
                </p>
                <h2 id="url-summary" className="mt-2 text-xl font-bold text-gray-900">
                  URL別の来訪者数と滞在時間
                </h2>
              </div>
              <p className="text-sm text-gray-500">対象日: {formatShortDate(todayIso)}</p>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
              <div className="grid grid-cols-[1.8fr_0.6fr_0.8fr_0.8fr] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>URL</span>
                <span className="text-right">来訪者数</span>
                <span className="text-right">平均滞在</span>
                <span className="text-right">合計滞在</span>
              </div>
              {urlSummaries.length === 0 ? (
                <div className="px-4 py-8 text-sm text-slate-500">まだ URL 別の滞在データはありません。</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {urlSummaries.map((item) => (
                    <div
                      key={item.path}
                      className="grid grid-cols-[1.8fr_0.6fr_0.8fr_0.8fr] items-center gap-3 px-4 py-3 text-sm text-slate-700"
                    >
                      <span className="truncate font-medium text-slate-900">{item.path}</span>
                      <span className="text-right">{item.visitors}</span>
                      <span className="text-right">{formatMinutes(item.averageMinutes)}</span>
                      <span className="text-right">{formatMinutes(item.totalMinutes)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow" role="region" aria-labelledby="recent-activity">
            <h2 id="recent-activity" className="mb-4 text-xl font-bold text-gray-900">
              最近のアクティビティ
            </h2>
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-500">表示できる最新アクティビティはまだありません。</p>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 border-b border-gray-100 pb-3 last:border-0">
                    <span className="text-2xl" aria-hidden="true">
                      {activity.icon}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.text}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatDateTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="mt-4 text-xs text-slate-400">
          滞在時間と URL 別集計は、ページ離脱時に記録されるアクセスログをもとに集計しています。
        </div>
      </div>
    </AdminLayout>
  );
}
