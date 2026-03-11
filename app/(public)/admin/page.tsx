"use client";

import React, { useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { StatCard, MenuCard, ErrorBoundary, AdminLayout } from "@/components/admin";

// アクティビティアイテムコンポーネント（メモ化）
const ActivityItem = React.memo(function ActivityItem({
  icon,
  text,
  time,
}: {
  icon: string;
  text: string;
  time: string;
}) {
  return (
    <div className="flex items-start space-x-3 border-b border-gray-100 pb-3 last:border-0">
      <span className="text-2xl" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{text}</p>
        <p className="mt-1 text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
});

function AdminDashboardContent() {
  const { user, permissions, isLoading } = useAuth();
  const router = useRouter();

  // 統計データ（メモ化） - フックは早期リターンの前に配置
  const stats = useMemo(
    () => [
      { title: "総店舗数", value: "300", icon: "🏪", bgColor: "bg-blue-50", textColor: "text-blue-600" },
      { title: "総ユーザー数", value: "1,234", icon: "👥", bgColor: "bg-green-50", textColor: "text-green-600" },
      { title: "今月の訪問者", value: "5,678", icon: "📊", bgColor: "bg-purple-50", textColor: "text-purple-600" },
      { title: "承認待ち", value: "12", icon: "⏳", bgColor: "bg-orange-50", textColor: "text-orange-600" },
    ],
    []
  );

  // 管理メニュー（メモ化）
  const menuItems = useMemo(
    () => [
      { title: "店舗管理", description: "店舗情報の確認・編集・承認", icon: "🏪", href: "/admin/shops", bgColor: "bg-blue-500" },
      { title: "ユーザー管理", description: "ユーザーアカウントの管理", icon: "👥", href: "/admin/users", bgColor: "bg-green-500" },
      { title: "イベント管理", description: "日曜市イベントの管理", icon: "📅", href: "/admin/events", bgColor: "bg-purple-500" },
      { title: "コンテンツ管理", description: "レシピ・お知らせの管理", icon: "📝", href: "/admin/content", bgColor: "bg-orange-500" },
      { title: "統計・分析", description: "アクセス解析とレポート", icon: "📊", href: "/admin/analytics", bgColor: "bg-pink-500" },
      { title: "設定", description: "システム設定と管理", icon: "⚙️", href: "/admin/settings", bgColor: "bg-gray-500" },
      { title: "監査ログ", description: "管理者操作の履歴確認", icon: "📋", href: "/admin/audit-logs", bgColor: "bg-red-500" },
      { title: "モデレーション", description: "ことづての承認・管理", icon: "🛡️", href: "/moderator", bgColor: "bg-purple-500" },
    ],
    []
  );

  // 最近のアクティビティ（メモ化）
  const recentActivities = useMemo(
    () => [
      { icon: "🏪", text: "新しい店舗「野菜の鈴木」が登録されました", time: "5分前" },
      { icon: "👤", text: "ユーザー「田中太郎」が登録しました", time: "15分前" },
      { icon: "✏️", text: "店舗「果物の山田」の情報が更新されました", time: "1時間前" },
      { icon: "📅", text: "新しいイベント「春の日曜市」が作成されました", time: "2時間前" },
    ],
    []
  );

  // 管理者権限チェック - フックの後に配置
  useEffect(() => {
    if (isLoading) return;
    if (!permissions.isSuperAdmin) {
      router.push("/");
    }
  }, [isLoading, permissions.isSuperAdmin, router]);

  if (isLoading || !permissions.isSuperAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
          <p className="mt-2 text-sm text-gray-600">ようこそ、{user?.name}さん</p>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="mx-auto max-w-7xl px-4 py-8 pb-20">
        {/* 統計カード */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
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

        {/* 管理メニュー */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => (
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

        {/* 最近のアクティビティ */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow" role="region" aria-labelledby="recent-activity">
          <h2 id="recent-activity" className="text-xl font-bold text-gray-900 mb-4">
            最近のアクティビティ
          </h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <ActivityItem
                key={index}
                icon={activity.icon}
                text={activity.text}
                time={activity.time}
              />
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminDashboard() {
  return (
    <ErrorBoundary>
      <AdminDashboardContent />
    </ErrorBoundary>
  );
}
