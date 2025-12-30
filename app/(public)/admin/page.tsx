"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, permissions } = useAuth();
  const router = useRouter();

  // 管理者権限チェック
  useEffect(() => {
    if (!permissions.isSuperAdmin) {
      router.push("/");
    }
  }, [permissions.isSuperAdmin, router]);

  if (!permissions.isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
          <p className="mt-2 text-sm text-gray-600">
            ようこそ、{user?.name}さん
          </p>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="総店舗数"
            value="300"
            icon="🏪"
            bgColor="bg-blue-50"
            textColor="text-blue-600"
          />
          <StatCard
            title="総ユーザー数"
            value="1,234"
            icon="👥"
            bgColor="bg-green-50"
            textColor="text-green-600"
          />
          <StatCard
            title="今月の訪問者"
            value="5,678"
            icon="📊"
            bgColor="bg-purple-50"
            textColor="text-purple-600"
          />
          <StatCard
            title="承認待ち"
            value="12"
            icon="⏳"
            bgColor="bg-orange-50"
            textColor="text-orange-600"
          />
        </div>

        {/* 管理メニュー */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AdminMenuCard
            title="店舗管理"
            description="店舗情報の確認・編集・承認"
            icon="🏪"
            href="/admin/shops"
            bgColor="bg-blue-500"
          />
          <AdminMenuCard
            title="ユーザー管理"
            description="ユーザーアカウントの管理"
            icon="👥"
            href="/admin/users"
            bgColor="bg-green-500"
          />
          <AdminMenuCard
            title="イベント管理"
            description="日曜市イベントの管理"
            icon="📅"
            href="/admin/events"
            bgColor="bg-purple-500"
          />
          <AdminMenuCard
            title="コンテンツ管理"
            description="レシピ・お知らせの管理"
            icon="📝"
            href="/admin/content"
            bgColor="bg-orange-500"
          />
          <AdminMenuCard
            title="統計・分析"
            description="アクセス解析とレポート"
            icon="📊"
            href="/admin/analytics"
            bgColor="bg-pink-500"
          />
          <AdminMenuCard
            title="設定"
            description="システム設定と管理"
            icon="⚙️"
            href="/admin/settings"
            bgColor="bg-gray-500"
          />
          <AdminMenuCard
            title="監査ログ"
            description="管理者操作の履歴確認"
            icon="📋"
            href="/admin/audit-logs"
            bgColor="bg-red-500"
          />
        </div>

        {/* 最近のアクティビティ */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">最近のアクティビティ</h2>
          <div className="space-y-4">
            <ActivityItem
              icon="🏪"
              text="新しい店舗「野菜の鈴木」が登録されました"
              time="5分前"
            />
            <ActivityItem
              icon="👤"
              text="ユーザー「田中太郎」が登録しました"
              time="15分前"
            />
            <ActivityItem
              icon="✏️"
              text="店舗「果物の山田」の情報が更新されました"
              time="1時間前"
            />
            <ActivityItem
              icon="📅"
              text="新しいイベント「春の日曜市」が作成されました"
              time="2時間前"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// 統計カードコンポーネント
function StatCard({
  title,
  value,
  icon,
  bgColor,
  textColor,
}: {
  title: string;
  value: string;
  icon: string;
  bgColor: string;
  textColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-lg p-6 shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`mt-2 text-3xl font-bold ${textColor}`}>{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

// 管理メニューカードコンポーネント
function AdminMenuCard({
  title,
  description,
  icon,
  href,
  bgColor,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
  bgColor: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
    >
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${bgColor} mb-4`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </Link>
  );
}

// アクティビティアイテムコンポーネント
function ActivityItem({
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
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{text}</p>
        <p className="mt-1 text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
}
