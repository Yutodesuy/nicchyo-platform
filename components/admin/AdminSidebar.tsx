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
import { useAdminNotifications } from "@/lib/hooks/useAdminNotifications";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
  show?: boolean;
}

export const AdminSidebar = React.memo(function AdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, permissions } = useAuth();
  const pathname = usePathname();
  const theme = getRoleTheme(user?.role);
  const { unreadCount } = useAdminNotifications(permissions.isSuperAdmin || permissions.canModerateContent);

  const navItems: NavItem[] = [
    {
      label: "ダッシュボード",
      href: "/admin/dashboard",
      icon: "📊",
      show: permissions.isSuperAdmin,
    },
    {
      label: "マップ編集",
      href: "/admin/map-edit",
      icon: "🗺️",
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
      href: "/admin/kotodute",
      icon: "💬",
      show: permissions.canModerateContent,
    },
    {
      label: "通知",
      href: "/admin/notifications",
      icon: "🔔",
      badge: unreadCount > 0 ? unreadCount : undefined,
      show: permissions.isSuperAdmin || permissions.canModerateContent,
    },
    {
      label: "設定",
      href: "/admin/settings",
      icon: "⚙️",
      show: permissions.isSuperAdmin,
    },
  ].filter((item) => item.show !== false);

  return (
    <>
      {isOpen && (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 z-[9998] bg-slate-950/30 backdrop-blur-[1px] lg:hidden"
          aria-label="サイドバーを閉じる"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-[9999] flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      {/* ロゴ・ヘッダー */}
      <div className={`flex h-16 items-center justify-between px-6 ${theme.headerBg}`}>
        <button
          type="button"
          onClick={onClose}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${theme.headerText} transition hover:bg-white/20`}
          aria-label="サイドバーを閉じる"
        >
          ✕
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">🗺️</span>
          <span className={`text-lg font-bold ${theme.headerText}`}>
            管理者ページ
          </span>
        </div>
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
          const isDashboard = item.href === "/admin/dashboard";
          const isActive = isDashboard
            ? pathname === "/admin/dashboard" || pathname === "/admin"
            : pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
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
      </aside>
    </>
  );
});
