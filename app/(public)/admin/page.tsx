import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLayout, MenuCard, StatCard } from "@/components/admin";
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

const MENU_ITEMS = [
  { title: "マップ管理", description: "建物や店舗マーカの位置を編集", icon: "🗺️", href: "/admin/map-edit", bgColor: "bg-sky-500" },
  { title: "店舗管理", description: "店舗情報の確認・編集・承認", icon: "🏪", href: "/admin/shops", bgColor: "bg-blue-500" },
  { title: "ユーザー管理", description: "ユーザーアカウントの管理", icon: "👥", href: "/admin/users", bgColor: "bg-green-500" },
  { title: "イベント管理", description: "日曜市イベントの管理", icon: "📅", href: "/admin/events", bgColor: "bg-purple-500" },
  { title: "コンテンツ管理", description: "レシピ・お知らせの管理", icon: "📝", href: "/admin/content", bgColor: "bg-orange-500" },
  { title: "統計・分析", description: "アクセス解析とレポート", icon: "📊", href: "/admin/analytics", bgColor: "bg-pink-500" },
  { title: "設定", description: "システム設定と管理", icon: "⚙️", href: "/admin/settings", bgColor: "bg-gray-500" },
  { title: "監査ログ", description: "管理者操作の履歴確認", icon: "📋", href: "/admin/audit-logs", bgColor: "bg-red-500" },
  { title: "モデレーション", description: "ことづての承認・管理", icon: "🛡️", href: "/moderator", bgColor: "bg-purple-500" },
];

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
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);
  const weeklyStart = new Date(now);
  weeklyStart.setDate(now.getDate() - 6);
  const weeklyStartIso = weeklyStart.toISOString().slice(0, 10);

  const [
    vendorsCountResult,
    marketLocationsCountResult,
    activeContentsCountResult,
    landmarksCountResult,
    visitorStatsResult,
    weeklyVisitorStatsResult,
    latestVendorsResult,
    latestContentsResult,
    latestLandmarksResult,
  ] = await Promise.all([
    supabase.from("vendors").select("*", { count: "exact", head: true }),
    supabase.from("market_locations").select("*", { count: "exact", head: true }),
    supabase
      .from("vendor_contents")
      .select("*", { count: "exact", head: true })
      .gt("expires_at", now.toISOString()),
    supabase.from("map_landmarks").select("*", { count: "exact", head: true }),
    supabase
      .from("web_visitor_stats")
      .select("visitor_count")
      .gte("visit_date", monthStart)
      .lt("visit_date", monthEnd),
    supabase
      .from("web_visitor_stats")
      .select("visit_date, visitor_count")
      .gte("visit_date", weeklyStartIso)
      .lte("visit_date", monthEnd),
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
  const weeklyVisitorMap = new Map(
    (weeklyVisitorStatsResult.data ?? []).map((row) => [
      row.visit_date as string,
      typeof row.visitor_count === "number" ? row.visitor_count : 0,
    ])
  );
  const weeklyVisitorSeries: VisitorPoint[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weeklyStart);
    date.setDate(weeklyStart.getDate() + index);
    const iso = date.toISOString().slice(0, 10);
    return {
      date: iso,
      count: weeklyVisitorMap.get(iso) ?? 0,
    };
  });
  const weeklyMax = Math.max(...weeklyVisitorSeries.map((item) => item.count), 1);
  const compositionItems = [
    {
      label: "店舗",
      value: vendorsCountResult.count ?? 0,
      color: "bg-blue-500",
    },
    {
      label: "マーカ",
      value: marketLocationsCountResult.count ?? 0,
      color: "bg-emerald-500",
    },
    {
      label: "建物",
      value: landmarksCountResult.count ?? 0,
      color: "bg-amber-500",
    },
    {
      label: "公開中投稿",
      value: activeContentsCountResult.count ?? 0,
      color: "bg-rose-500",
    },
  ];
  const compositionMax = Math.max(...compositionItems.map((item) => item.value), 1);

  const stats = [
    { title: "登録店舗数", value: vendorsCountResult.count ?? 0, icon: "🏪", bgColor: "bg-blue-50", textColor: "text-blue-600" },
    { title: "配置済みマーカ数", value: marketLocationsCountResult.count ?? 0, icon: "📍", bgColor: "bg-green-50", textColor: "text-green-600" },
    { title: "今月の訪問者", value: monthVisitors, icon: "📊", bgColor: "bg-purple-50", textColor: "text-purple-600" },
    { title: "公開中のお知らせ", value: activeContentsCountResult.count ?? 0, icon: "📝", bgColor: "bg-orange-50", textColor: "text-orange-600" },
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
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
          <p className="mt-2 text-sm text-gray-600">ようこそ、{getDisplayName(user)}さん</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 pb-20">
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.95fr]">
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
              <p className="text-sm text-gray-500">最大 {weeklyMax} 人/日</p>
            </div>
            <div className="mt-8 flex h-72 items-end gap-3">
              {weeklyVisitorSeries.map((item) => (
                <div key={item.date} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-56 w-full items-end rounded-2xl bg-gradient-to-b from-purple-50 to-white px-2 pb-2">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-purple-600 via-fuchsia-500 to-violet-400 shadow-[0_10px_24px_rgba(139,92,246,0.22)]"
                      style={{ height: `${Math.max((item.count / weeklyMax) * 100, item.count > 0 ? 10 : 0)}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900">{item.count}</p>
                    <p className="text-xs text-gray-500">{formatShortDate(item.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow" aria-labelledby="composition-chart">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
              Inventory
            </p>
            <h2 id="composition-chart" className="mt-2 text-xl font-bold text-gray-900">
              運営データの構成
            </h2>
            <div className="mt-6 space-y-5">
              {compositionItems.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span className="font-semibold text-gray-900">{item.value}</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100">
                    <div
                      className={`h-3 rounded-full ${item.color}`}
                      style={{ width: `${Math.max((item.value / compositionMax) * 100, item.value > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
              <p className="text-sm font-semibold text-sky-900">クイック操作</p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {MENU_ITEMS.slice(0, 4).map((item) => (
                  <MenuCard
                    key={item.title}
                    title={item.title}
                    description={item.description}
                    icon={item.icon}
                    href={item.href}
                    bgColor={item.bgColor}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow" role="region" aria-labelledby="recent-activity">
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
        </div>
      </div>
    </AdminLayout>
  );
}
