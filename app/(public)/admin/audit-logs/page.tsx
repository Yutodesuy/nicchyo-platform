"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { exportToCSV, exportToJSON, formatDateForFilename } from "@/lib/admin/exportUtils";

type AuditAction =
  | "user_created"
  | "user_updated"
  | "user_deleted"
  | "user_role_changed"
  | "shop_created"
  | "shop_updated"
  | "shop_deleted"
  | "shop_approved"
  | "shop_suspended"
  | "kotodute_approved"
  | "kotodute_rejected"
  | "kotodute_deleted"
  | "bulk_operation"
  | "data_export"
  | "login"
  | "logout";

interface AuditLog {
  id: number;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  targetType: string;
  targetId?: string | number;
  targetName?: string;
  details?: string;
  ipAddress?: string;
}

export default function AuditLogsPage() {
  const { permissions } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | AuditAction | "admin" | "moderator">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month" | "all">("all");

  // 管理者権限チェック
  useEffect(() => {
    if (!permissions.isSuperAdmin) {
      router.push("/");
    }
  }, [permissions.isSuperAdmin, router]);

  if (!permissions.isSuperAdmin) {
    return null;
  }

  // ダミーデータ
  const dummyLogs: AuditLog[] = [
    {
      id: 1,
      timestamp: "2024-12-30 10:30:15",
      userId: "admin-001",
      userName: "高知市管理者",
      userRole: "管理者",
      action: "user_role_changed",
      targetType: "ユーザー",
      targetId: "user-123",
      targetName: "田中太郎",
      details: "一般ユーザー → 出店者",
      ipAddress: "192.168.1.100",
    },
    {
      id: 2,
      timestamp: "2024-12-30 10:25:30",
      userId: "admin-001",
      userName: "高知市管理者",
      userRole: "管理者",
      action: "shop_approved",
      targetType: "店舗",
      targetId: 45,
      targetName: "野菜の鈴木",
      ipAddress: "192.168.1.100",
    },
    {
      id: 3,
      timestamp: "2024-12-30 10:20:00",
      userId: "moderator-001",
      userName: "モデレーター田中",
      userRole: "モデレーター",
      action: "kotodute_approved",
      targetType: "ことづて",
      targetId: 234,
      details: "承認待ち → 承認済み",
      ipAddress: "192.168.1.105",
    },
    {
      id: 4,
      timestamp: "2024-12-30 10:15:45",
      userId: "admin-001",
      userName: "高知市管理者",
      userRole: "管理者",
      action: "bulk_operation",
      targetType: "店舗",
      details: "15件の店舗を一括承認",
      ipAddress: "192.168.1.100",
    },
    {
      id: 5,
      timestamp: "2024-12-30 10:10:20",
      userId: "moderator-001",
      userName: "モデレーター田中",
      userRole: "モデレーター",
      action: "kotodute_deleted",
      targetType: "ことづて",
      targetId: 198,
      details: "不適切な内容のため削除",
      ipAddress: "192.168.1.105",
    },
    {
      id: 6,
      timestamp: "2024-12-30 10:05:00",
      userId: "admin-001",
      userName: "高知市管理者",
      userRole: "管理者",
      action: "data_export",
      targetType: "ユーザー",
      details: "CSV形式でエクスポート（全50件）",
      ipAddress: "192.168.1.100",
    },
    {
      id: 7,
      timestamp: "2024-12-30 09:45:30",
      userId: "admin-001",
      userName: "高知市管理者",
      userRole: "管理者",
      action: "shop_suspended",
      targetType: "店舗",
      targetId: 12,
      targetName: "魚の佐藤",
      details: "規約違反のため停止",
      ipAddress: "192.168.1.100",
    },
    {
      id: 8,
      timestamp: "2024-12-30 09:30:00",
      userId: "admin-001",
      userName: "高知市管理者",
      userRole: "管理者",
      action: "login",
      targetType: "システム",
      ipAddress: "192.168.1.100",
    },
  ];

  // フィルタリング
  const filteredLogs = dummyLogs.filter((log) => {
    const matchesActionFilter = filter === "all" || log.action === filter;
    const matchesRoleFilter =
      filter === "all" ||
      (filter === "admin" && log.userRole === "管理者") ||
      (filter === "moderator" && log.userRole === "モデレーター") ||
      log.action === filter;

    const matchesSearch =
      searchQuery === "" ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRoleFilter && matchesSearch;
  });

  const getActionLabel = (action: AuditAction) => {
    const labels: Record<AuditAction, string> = {
      user_created: "ユーザー作成",
      user_updated: "ユーザー更新",
      user_deleted: "ユーザー削除",
      user_role_changed: "権限変更",
      shop_created: "店舗作成",
      shop_updated: "店舗更新",
      shop_deleted: "店舗削除",
      shop_approved: "店舗承認",
      shop_suspended: "店舗停止",
      kotodute_approved: "ことづて承認",
      kotodute_rejected: "ことづて却下",
      kotodute_deleted: "ことづて削除",
      bulk_operation: "一括操作",
      data_export: "データエクスポート",
      login: "ログイン",
      logout: "ログアウト",
    };
    return labels[action];
  };

  const getActionColor = (action: AuditAction) => {
    if (action.includes("deleted") || action === "shop_suspended" || action === "kotodute_rejected") {
      return "bg-red-100 text-red-800";
    }
    if (action.includes("approved") || action.includes("created")) {
      return "bg-green-100 text-green-800";
    }
    if (action.includes("updated") || action.includes("changed")) {
      return "bg-blue-100 text-blue-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  // エクスポート
  const handleExportCSV = () => {
    const dataToExport = filteredLogs.map((log) => ({
      ID: log.id,
      日時: log.timestamp,
      実行者: log.userName,
      実行者ロール: log.userRole,
      アクション: getActionLabel(log.action),
      対象種別: log.targetType,
      対象ID: log.targetId || "",
      対象名: log.targetName || "",
      詳細: log.details || "",
      IPアドレス: log.ipAddress || "",
    }));
    const filename = `audit_logs_${formatDateForFilename()}.csv`;
    exportToCSV(dataToExport, filename);
  };

  const handleExportJSON = () => {
    const filename = `audit_logs_${formatDateForFilename()}.json`;
    exportToJSON(filteredLogs, filename);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/admin"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← ダッシュボードに戻る
              </Link>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">監査ログ</h1>
              <p className="mt-1 text-sm text-gray-600">
                管理者とモデレーターの操作履歴を確認できます
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 text-sm"
              >
                CSV出力
              </button>
              <button
                onClick={handleExportJSON}
                className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 text-sm"
              >
                JSON出力
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-600">総ログ数</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{dummyLogs.length}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 shadow">
            <p className="text-sm text-blue-600">今日のアクション</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">
              {dummyLogs.filter((log) => log.timestamp.startsWith("2024-12-30")).length}
            </p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 shadow">
            <p className="text-sm text-red-600">管理者操作</p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {dummyLogs.filter((log) => log.userRole === "管理者").length}
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 shadow">
            <p className="text-sm text-purple-600">モデレーター操作</p>
            <p className="mt-1 text-2xl font-bold text-purple-600">
              {dummyLogs.filter((log) => log.userRole === "モデレーター").length}
            </p>
          </div>
        </div>

        {/* フィルターと検索 */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setFilter("admin")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "admin"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                管理者操作
              </button>
              <button
                onClick={() => setFilter("moderator")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "moderator"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                モデレーター操作
              </button>
              <button
                onClick={() => setFilter("user_role_changed")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "user_role_changed"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                権限変更
              </button>
            </div>
            <input
              type="text"
              placeholder="実行者・対象・詳細で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* ログリスト */}
        <div className="rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    実行者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    対象
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    詳細
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IPアドレス
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {log.timestamp}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{log.userName}</div>
                        <div className="text-sm text-gray-500">{log.userRole}</div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getActionColor(
                          log.action
                        )}`}
                      >
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">{log.targetType}</div>
                        {log.targetName && (
                          <div className="text-xs text-gray-500">{log.targetName}</div>
                        )}
                        {log.targetId && (
                          <div className="text-xs text-gray-400">ID: {log.targetId}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {log.details || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {log.ipAddress || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
