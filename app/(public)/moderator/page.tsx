"use client";

import React, { useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatCard, MenuCard, ErrorBoundary } from "@/components/admin";

// アクティビティアイテムコンポーネント（メモ化）
const ActivityItem = React.memo(function ActivityItem({
  icon,
  text,
  time,
  actionColor,
}: {
  icon: string;
  text: string;
  time: string;
  actionColor: string;
}) {
  return (
    <div className="flex items-start space-x-3 border-b border-gray-100 pb-3 last:border-0">
      <span className="text-2xl" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1">
        <p className={`text-sm font-medium ${actionColor}`}>{text}</p>
        <p className="mt-1 text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
});

function ModeratorDashboardContent() {
  const { user, permissions } = useAuth();
  const router = useRouter();

  // 統計データ（メモ化） - フックは早期リターンの前に配置
  const stats = useMemo(
    () => [
      { title: "総ことづて数", value: "248", icon: "💌", bgColor: "bg-purple-50", textColor: "text-purple-600" },
      { title: "未承認", value: "15", icon: "⏳", bgColor: "bg-orange-50", textColor: "text-orange-600" },
      { title: "今日の投稿", value: "12", icon: "📝", bgColor: "bg-blue-50", textColor: "text-blue-600" },
      { title: "報告済み", value: "3", icon: "🚨", bgColor: "bg-red-50", textColor: "text-red-600" },
    ],
    []
  );

  // モデレーションメニュー（メモ化）
  const menuItems = useMemo(
    () => [
      { title: "ことづて管理", description: "投稿の承認・削除・編集", icon: "💌", href: "/moderator/kotodute", bgColor: "bg-purple-500" },
      { title: "報告された投稿", description: "ユーザー報告の確認", icon: "🚨", href: "/moderator/reports", bgColor: "bg-red-500" },
      { title: "スパムフィルター", description: "自動フィルター設定", icon: "🛡️", href: "/moderator/spam-filter", bgColor: "bg-orange-500" },
      { title: "統計・分析", description: "投稿の傾向分析", icon: "📊", href: "/moderator/analytics", bgColor: "bg-blue-500" },
      { title: "NGワード管理", description: "禁止ワード設定", icon: "🚫", href: "/moderator/ng-words", bgColor: "bg-gray-500" },
      { title: "設定", description: "モデレーション設定", icon: "⚙️", href: "/moderator/settings", bgColor: "bg-green-500" },
    ],
    []
  );

  // 最近のモデレーション（メモ化）
  const recentActivities = useMemo(
    () => [
      { icon: "✅", text: "「高知の日曜市、最高でした！」を承認しました", time: "5分前", actionColor: "text-green-600" },
      { icon: "🚨", text: "不適切な投稿を削除しました", time: "15分前", actionColor: "text-red-600" },
      { icon: "✏️", text: "「野菜が新鮮」のタグを修正しました", time: "1時間前", actionColor: "text-blue-600" },
      { icon: "⏳", text: "新規投稿5件が承認待ちです", time: "2時間前", actionColor: "text-orange-600" },
    ],
    []
  );

  // モデレーター権限チェック - フックの後に配置
  useEffect(() => {
    if (!permissions.canModerateContent) {
      router.push("/");
    }
  }, [permissions.canModerateContent, router]);

  if (!permissions.canModerateContent) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Link href="/map" className="text-sm text-purple-600 hover:text-purple-800">
            ← マップに戻る
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-purple-900">モデレーターダッシュボード</h1>
          <p className="mt-2 text-sm text-gray-600">ようこそ、{user?.name}さん</p>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="mx-auto max-w-7xl px-4 py-8">
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

        {/* モデレーションメニュー */}
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

        {/* 最近のモデレーション */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow" role="region" aria-labelledby="recent-moderation">
          <h2 id="recent-moderation" className="text-xl font-bold text-gray-900 mb-4">
            最近のモデレーション
          </h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <ActivityItem
                key={index}
                icon={activity.icon}
                text={activity.text}
                time={activity.time}
                actionColor={activity.actionColor}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModeratorDashboard() {
  return (
    <ErrorBoundary>
      <ModeratorDashboardContent />
    </ErrorBoundary>
  );
}
