import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { AdminLayout, AdminPageHeader, StatCard } from "@/components/admin";

function getRole(user: unknown) {
  if (!user || typeof user !== "object") return null;
  const record = user as {
    app_metadata?: { role?: string };
    user_metadata?: { role?: string };
  };
  return record.app_metadata?.role ?? record.user_metadata?.role ?? null;
}

function isAdminRole(role: string | null) {
  return role === "super_admin" || role === "admin";
}

type CouponSummary = {
  market_date: string;
  total_issued: number;
  total_redeemed: number;
  unique_visitors: number;
};

type CouponTypeStat = {
  coupon_type_id: string;
  name: string;
  emoji: string;
  issued: number;
  redeemed: number;
};

type CouponSettings = {
  enabled: boolean;
  amount: number;
  maxDailyIssuance: number;
};

export default async function AdminCouponsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminRole(getRole(user))) {
    redirect("/login");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const serviceClient = createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ─ クーポン設定の取得 ────────────────────────────────────────────────────
  const { data: settingsRow } = await serviceClient
    .from("system_settings")
    .select("value")
    .eq("key", "coupon")
    .single();

  const couponSettings = (settingsRow?.value ?? {
    enabled: false,
    amount: 50,
    maxDailyIssuance: 300,
  }) as CouponSettings;

  // ─ 直近7開催日の集計 ──────────────────────────────────────────────────────
  const { data: issuanceRows } = await serviceClient
    .from("coupon_issuances")
    .select("market_date, is_used, visitor_key")
    .order("market_date", { ascending: false })
    .limit(2000);

  const summaryMap = new Map<
    string,
    { total_issued: number; total_redeemed: number; visitors: Set<string> }
  >();

  for (const row of issuanceRows ?? []) {
    const date = row.market_date as string;
    if (!summaryMap.has(date)) {
      summaryMap.set(date, { total_issued: 0, total_redeemed: 0, visitors: new Set() });
    }
    const entry = summaryMap.get(date)!;
    entry.total_issued += 1;
    if (row.is_used) entry.total_redeemed += 1;
    entry.visitors.add(row.visitor_key as string);
  }

  const summaries: CouponSummary[] = Array.from(summaryMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)
    .map(([date, val]) => ({
      market_date: date,
      total_issued: val.total_issued,
      total_redeemed: val.total_redeemed,
      unique_visitors: val.visitors.size,
    }));

  // ─ クーポン種類別統計 ─────────────────────────────────────────────────────
  const { data: typeRows } = await serviceClient
    .from("coupon_issuances")
    .select("coupon_type_id, is_used, coupon_types(name, emoji)");

  const typeStatsMap = new Map<string, CouponTypeStat>();
  for (const row of typeRows ?? []) {
    const typeId = row.coupon_type_id as string;
    const rawType = row.coupon_types;
    const typeData =
      rawType && !Array.isArray(rawType) && typeof rawType === "object"
        ? (rawType as { name: string; emoji: string })
        : null;
    if (!typeStatsMap.has(typeId)) {
      typeStatsMap.set(typeId, {
        coupon_type_id: typeId,
        name: typeData?.name ?? typeId,
        emoji: typeData?.emoji ?? "🎟️",
        issued: 0,
        redeemed: 0,
      });
    }
    const stat = typeStatsMap.get(typeId)!;
    stat.issued += 1;
    if (row.is_used) stat.redeemed += 1;
  }
  const typeStats = Array.from(typeStatsMap.values());

  // ─ 参加店数 ───────────────────────────────────────────────────────────────
  const { count: participatingCount } = await serviceClient
    .from("vendor_coupon_settings")
    .select("vendor_id", { count: "exact", head: true })
    .eq("is_participating", true);

  const totalIssued = summaries.reduce((s, r) => s + r.total_issued, 0);
  const totalRedeemed = summaries.reduce((s, r) => s + r.total_redeemed, 0);

  return (
    <AdminLayout>
      <AdminPageHeader
        eyebrow="Admin"
        title="クーポン管理"
      />

      {/* ─ 現在の設定 ─ */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-bold text-gray-800">現在の設定</h2>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-gray-500">機能ステータス</dt>
              <dd className="mt-1 font-bold">
                {couponSettings.enabled ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                    ✅ 有効
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                    ⏸️ 無効
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">クーポン額面</dt>
              <dd className="mt-1 text-xl font-bold text-gray-900">
                ¥{couponSettings.amount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">1日の最大発行枚数</dt>
              <dd className="mt-1 text-xl font-bold text-gray-900">
                {couponSettings.maxDailyIssuance.toLocaleString()} 枚
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-gray-400">
            ※ 設定変更はSupabaseの system_settings テーブル（key: &apos;coupon&apos;）から直接行ってください。
            設定変更UIは今後追加予定です。
          </p>
        </div>
      </section>

      {/* ─ サマリー統計 ─ */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-bold text-gray-800">全期間サマリー（直近データ）</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="総発行枚数" value={`${totalIssued.toLocaleString()} 枚`} icon="🎟️" bgColor="bg-green-50" textColor="text-green-700" />
          <StatCard title="総利用枚数" value={`${totalRedeemed.toLocaleString()} 枚`} icon="✅" bgColor="bg-blue-50" textColor="text-blue-700" />
          <StatCard title="参加店舗数" value={`${(participatingCount ?? 0).toLocaleString()} 店`} icon="🏪" bgColor="bg-amber-50" textColor="text-amber-700" />
        </div>
      </section>

      {/* ─ 開催日別集計 ─ */}
      {summaries.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-base font-bold text-gray-800">開催日別集計（直近7日）</h2>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">開催日</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">発行枚数</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">利用枚数</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">利用率</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">ユニーク訪問者</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summaries.map((row) => {
                  const rate =
                    row.total_issued > 0
                      ? Math.round((row.total_redeemed / row.total_issued) * 100)
                      : 0;
                  return (
                    <tr key={row.market_date} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{row.market_date}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{row.total_issued}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{row.total_redeemed}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-semibold ${rate >= 30 ? "text-green-600" : "text-gray-500"}`}
                        >
                          {rate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {row.unique_visitors}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ─ クーポン種類別統計 ─ */}
      {typeStats.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-base font-bold text-gray-800">クーポン種類別統計</h2>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">種類</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">発行</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">利用</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">利用率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {typeStats.map((t) => {
                  const rate =
                    t.issued > 0 ? Math.round((t.redeemed / t.issued) * 100) : 0;
                  return (
                    <tr key={t.coupon_type_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="mr-1.5">{t.emoji}</span>
                        <span className="font-medium text-gray-800">{t.name}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{t.issued}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{t.redeemed}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        <span className={rate >= 30 ? "text-green-600" : "text-gray-500"}>
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {summaries.length === 0 && typeStats.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
          <p className="text-gray-400">まだクーポンの発行データがありません</p>
          <p className="mt-1 text-sm text-gray-400">
            system_settings の coupon.enabled を true にするとクーポン機能が有効になります
          </p>
        </div>
      )}
    </AdminLayout>
  );
}
