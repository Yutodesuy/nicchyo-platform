"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminAnalyticsPage() {
  const { permissions, isLoading } = useAuth();
  const router = useRouter();

  // 管理者権限チェック
  useEffect(() => {
    if (isLoading) return;
    if (!permissions.isSuperAdmin) {
      router.push("/");
    }
  }, [isLoading, permissions.isSuperAdmin, router]);

  if (isLoading || !permissions.isSuperAdmin) {
    return null;
  }

  // ダミーデータ
  const stats = {
    today: {
      visitors: 456,
      pageViews: 1234,
      newUsers: 23,
      averageTime: "3:24",
    },
    thisWeek: {
      visitors: 3456,
      pageViews: 9876,
      newUsers: 156,
      averageTime: "3:45",
    },
    thisMonth: {
      visitors: 12345,
      pageViews: 34567,
      newUsers: 678,
      averageTime: "3:32",
    },
  };

  const topPages = [
    { path: "/map", views: 8456, percentage: 45 },
    { path: "/", views: 3234, percentage: 17 },
    { path: "/recipes", views: 2345, percentage: 12 },
    { path: "/search", views: 1876, percentage: 10 },
    { path: "/about", views: 1543, percentage: 8 },
  ];

  const topShops = [
    { id: 1, name: "野菜の鈴木", views: 456, clicks: 234 },
    { id: 2, name: "果物の山田", views: 423, clicks: 211 },
    { id: 3, name: "魚の佐藤", views: 398, clicks: 198 },
    { id: 4, name: "肉の田中", views: 376, clicks: 187 },
    { id: 5, name: "花の高橋", views: 345, clicks: 172 },
  ];

  const categoryStats = [
    { category: "食材", count: 120, percentage: 40 },
    { category: "食べ物", count: 90, percentage: 30 },
    { category: "生活雑貨", count: 45, percentage: 15 },
    { category: "植物・苗", count: 30, percentage: 10 },
    { category: "その他", count: 15, percentage: 5 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Link
            href="/admin"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← ダッシュボードに戻る
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">統計・分析</h1>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* 期間別統計 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">アクセス統計</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* 今日 */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">今日</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">訪問者数</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.today.visitors}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ページビュー</p>
                  <p className="text-2xl font-bold text-green-600">{stats.today.pageViews}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">新規ユーザー</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.today.newUsers}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">平均滞在時間</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.today.averageTime}</p>
                </div>
              </div>
            </div>

            {/* 今週 */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">今週</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">訪問者数</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.thisWeek.visitors}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ページビュー</p>
                  <p className="text-2xl font-bold text-green-600">{stats.thisWeek.pageViews}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">新規ユーザー</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.thisWeek.newUsers}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">平均滞在時間</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.thisWeek.averageTime}</p>
                </div>
              </div>
            </div>

            {/* 今月 */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">今月</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">訪問者数</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.thisMonth.visitors}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ページビュー</p>
                  <p className="text-2xl font-bold text-green-600">{stats.thisMonth.pageViews}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">新規ユーザー</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.thisMonth.newUsers}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">平均滞在時間</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.thisMonth.averageTime}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 人気ページ */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">人気ページ</h2>
            <div className="space-y-4">
              {topPages.map((page, index) => (
                <div key={page.path}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {index + 1}.
                      </span>
                      <span className="text-sm font-medium text-gray-900">{page.path}</span>
                    </div>
                    <span className="text-sm text-gray-600">{page.views.toLocaleString()} PV</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${page.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 人気店舗 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">人気店舗（今月）</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">順位</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">店舗名</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">表示数</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">クリック数</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topShops.map((shop, index) => (
                    <tr key={shop.id}>
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{shop.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{shop.views}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{shop.clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* カテゴリー別統計 */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">カテゴリー別店舗数</h2>
          <div className="space-y-4">
            {categoryStats.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{cat.category}</span>
                  <span className="text-sm text-gray-600">
                    {cat.count}店舗 ({cat.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* グラフプレースホルダー */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">アクセス推移</h2>
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <p className="text-gray-500">
              📊 グラフコンポーネント（Chart.js、Recharts等）を実装予定
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
