/**
 * 管理者用サイドバー
 * PC操作向けの固定ナビゲーション
 */

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { getRoleTheme } from "@/lib/theme/roleTheme";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
  show?: boolean;
}

export const AdminSidebar = React.memo(function AdminSidebar() {
  const { user, permissions } = useAuth();
  const pathname = usePathname();
  const theme = getRoleTheme(user?.role);

  const navItems: NavItem[] = [
    {
      label: "ダッシュボード",
      href: permissions.isSuperAdmin ? "/admin" : "/moderator",
      icon: "📊",
      show: true,
    },
    {
      label: "店舗管理",
      href: "/admin/shops",
      icon: "🏪",
      show: permissions.isSuperAdmin,
    },
    {
      label: "ユーザー管理",
      href: "/admin/users",
      icon: "👥",
      show: permissions.isSuperAdmin,
    },
    {
      label: "ことづて管理",
      href: "/moderator/kotodute",
      icon: "💬",
      show: permissions.canModerateContent,
    },
    {
      label: "設定",
      href: permissions.isSuperAdmin ? "/admin/settings" : "/moderator/settings",
      icon: "⚙️",
      show: true,
    },
  ].filter((item) => item.show !== false);

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
      {/* ロゴ・ヘッダー */}
      <div className={`flex items-center justify-center h-16 px-6 ${theme.headerBg}`}>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">🗺️</span>
          <span className={`text-lg font-bold ${theme.headerText}`}>
            日曜市プラットフォーム
          </span>
        </Link>
      </div>

      {/* ユーザー情報 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xl" aria-hidden="true">👤</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || "管理者"}
            </p>
            <p className="text-xs text-gray-500">
              {permissions.isSuperAdmin ? "管理者" : "モデレーター"}
            </p>
          </div>
        </div>
      </div>

      {/* ナビゲーションメニュー */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition group ${
                isActive
                  ? `${theme.accent.bg} ${theme.accent.text} shadow-sm`
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-xl flex-shrink-0" aria-hidden="true">
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
              {item.badge && (
                <span
                  className={`ml-auto px-2 py-0.5 text-xs font-semibold rounded-full ${
                    isActive ? "bg-white bg-opacity-20" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* フッター */}
      <div className="px-4 py-4 border-t border-gray-200">
        <Link
          href="/map"
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          <span className="text-xl" aria-hidden="true">🗺️</span>
          <span className="font-medium text-sm">マップに戻る</span>
        </Link>
        <button
          onClick={() => {
            // ログアウト処理（実装時に追加）
            window.location.href = "/";
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition mt-1"
        >
          <span className="text-xl" aria-hidden="true">🚪</span>
          <span className="font-medium text-sm">ログアウト</span>
        </button>
      </div>
    </aside>
  );
});
