"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { UserRole } from "@/lib/auth/types";
import { exportToCSV, exportToJSON, formatDateForFilename } from "@/lib/admin/exportUtils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  vendorId?: number;
  registeredDate: string;
  lastLogin: string;
  status: "active" | "suspended";
}

export default function AdminUsersPage() {
  const { permissions } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | UserRole | "suspended">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [roleChangeUser, setRoleChangeUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("general_user");

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
  const dummyUsers: AdminUser[] = [
    {
      id: "1",
      name: "高知市管理者",
      email: "admin@kochi-city.jp",
      role: "super_admin",
      registeredDate: "2024-01-01",
      lastLogin: "2024-12-30 10:30",
      status: "active",
    },
    {
      id: "2",
      name: "食材のお店1",
      email: "nicchyo-owner-001@example.com",
      role: "vendor",
      vendorId: 1,
      registeredDate: "2024-01-15",
      lastLogin: "2024-12-29 14:20",
      status: "active",
    },
    {
      id: "3",
      name: "果物の山田",
      email: "yamada@example.com",
      role: "vendor",
      vendorId: 2,
      registeredDate: "2024-02-01",
      lastLogin: "2024-12-28 09:15",
      status: "active",
    },
    {
      id: "4",
      name: "観光客ユーザー",
      email: "user@example.com",
      role: "general_user",
      registeredDate: "2024-03-10",
      lastLogin: "2024-12-30 08:45",
      status: "active",
    },
    {
      id: "5",
      name: "田中太郎",
      email: "tanaka@example.com",
      role: "general_user",
      registeredDate: "2024-04-15",
      lastLogin: "2024-12-25 16:30",
      status: "active",
    },
    {
      id: "6",
      name: "鈴木花子",
      email: "suzuki@example.com",
      role: "vendor",
      vendorId: 3,
      registeredDate: "2024-05-20",
      lastLogin: "2024-11-30 11:00",
      status: "suspended",
    },
  ];

  // フィルタリング
  const filteredUsers = dummyUsers.filter((user) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "suspended" && user.status === "suspended") ||
      (filter !== "suspended" && user.role === filter);
    const matchesSearch =
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: dummyUsers.length,
    admins: dummyUsers.filter((u) => u.role === "super_admin").length,
    vendors: dummyUsers.filter((u) => u.role === "vendor").length,
    users: dummyUsers.filter((u) => u.role === "general_user").length,
    suspended: dummyUsers.filter((u) => u.status === "suspended").length,
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800";
      case "vendor":
        return "bg-blue-100 text-blue-800";
      case "general_user":
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "管理者";
      case "vendor":
        return "出店者";
      case "general_user":
        return "一般";
      case "moderator":
        return "モデレーター";
    }
  };

  // チェックボックス操作
  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((user) => user.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  // 一括操作
  const handleBulkActivate = () => {
    if (selectedUserIds.length === 0) return;
    if (confirm(`${selectedUserIds.length}人のユーザーを一括アクティブ化しますか？`)) {
      alert(`${selectedUserIds.length}人のユーザーをアクティブ化しました`);
      setSelectedUserIds([]);
    }
  };

  const handleBulkSuspend = () => {
    if (selectedUserIds.length === 0) return;
    if (confirm(`${selectedUserIds.length}人のユーザーを一括停止しますか？`)) {
      alert(`${selectedUserIds.length}人のユーザーを停止しました`);
      setSelectedUserIds([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedUserIds.length === 0) return;
    if (confirm(`${selectedUserIds.length}人のユーザーを一括削除しますか？この操作は取り消せません。`)) {
      alert(`${selectedUserIds.length}人のユーザーを削除しました`);
      setSelectedUserIds([]);
    }
  };

  // エクスポート
  const handleExportCSV = () => {
    const dataToExport = filteredUsers.map((user) => ({
      ID: user.id,
      名前: user.name,
      メールアドレス: user.email,
      ロール: getRoleLabel(user.role),
      店舗ID: user.vendorId || "",
      登録日: user.registeredDate,
      最終ログイン: user.lastLogin,
      ステータス: user.status === "active" ? "アクティブ" : "停止中",
    }));
    const filename = `users_${formatDateForFilename()}.csv`;
    exportToCSV(dataToExport, filename);
  };

  const handleExportJSON = () => {
    const filename = `users_${formatDateForFilename()}.json`;
    exportToJSON(filteredUsers, filename);
  };

  // 権限変更
  const handleOpenRoleChange = (user: AdminUser) => {
    setRoleChangeUser(user);
    setNewRole(user.role);
  };

  const handleRoleChange = () => {
    if (!roleChangeUser) return;
    if (roleChangeUser.role === newRole) {
      alert("同じロールが選択されています");
      return;
    }
    if (confirm(`${roleChangeUser.name}のロールを「${getRoleLabel(roleChangeUser.role)}」から「${getRoleLabel(newRole)}」に変更しますか？`)) {
      alert(`${roleChangeUser.name}のロールを「${getRoleLabel(newRole)}」に変更しました`);
      setRoleChangeUser(null);
    }
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
              <h1 className="mt-2 text-3xl font-bold text-gray-900">ユーザー管理</h1>
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
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                + 新規ユーザー追加
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5 mb-6">
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-600">総ユーザー数</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 shadow">
            <p className="text-sm text-red-600">管理者</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{stats.admins}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 shadow">
            <p className="text-sm text-blue-600">出店者</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{stats.vendors}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 shadow">
            <p className="text-sm text-gray-600">一般ユーザー</p>
            <p className="mt-1 text-2xl font-bold text-gray-600">{stats.users}</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-4 shadow">
            <p className="text-sm text-orange-600">停止中</p>
            <p className="mt-1 text-2xl font-bold text-orange-600">{stats.suspended}</p>
          </div>
        </div>

        {/* フィルターと検索 */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                すべて ({stats.total})
              </button>
              <button
                onClick={() => setFilter("super_admin")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "super_admin"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                管理者 ({stats.admins})
              </button>
              <button
                onClick={() => setFilter("vendor")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "vendor"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                出店者 ({stats.vendors})
              </button>
              <button
                onClick={() => setFilter("general_user")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "general_user"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                一般 ({stats.users})
              </button>
              <button
                onClick={() => setFilter("suspended")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "suspended"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                停止中 ({stats.suspended})
              </button>
            </div>
            <input
              type="text"
              placeholder="名前・メールアドレスで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 一括操作ツールバー */}
        {selectedUserIds.length > 0 && (
          <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4 shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedUserIds.length}人選択中
                </span>
                <button
                  onClick={() => setSelectedUserIds([])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  選択解除
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkActivate}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  一括アクティブ化
                </button>
                <button
                  onClick={handleBulkSuspend}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                >
                  一括停止
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  一括削除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ユーザーリスト */}
        <div className="rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ロール
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終ログイン
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <span className="text-gray-500 text-xl">👤</span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getRoleBadge(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                      {user.vendorId && (
                        <div className="mt-1 text-xs text-gray-500">
                          店舗ID: {user.vendorId}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.registeredDate}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.lastLogin}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.status === "active" ? "アクティブ" : "停止中"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => handleOpenRoleChange(user)}
                        className="text-purple-600 hover:text-purple-900 mr-3"
                      >
                        権限変更
                      </button>
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        編集
                      </button>
                      {user.status === "active" ? (
                        <button className="text-orange-600 hover:text-orange-900">
                          停止
                        </button>
                      ) : (
                        <button className="text-green-600 hover:text-green-900">
                          復帰
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 権限変更モーダル */}
      {roleChangeUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setRoleChangeUser(null)}
        >
          <div
            className="max-w-md w-full rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">権限変更</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">ユーザー</p>
                <p className="text-gray-900 font-medium">{roleChangeUser.name}</p>
                <p className="text-sm text-gray-500">{roleChangeUser.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">現在のロール</p>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getRoleBadge(
                    roleChangeUser.role
                  )}`}
                >
                  {getRoleLabel(roleChangeUser.role)}
                </span>
              </div>
              <div>
                <label htmlFor="newRole" className="block text-sm font-medium text-gray-700 mb-2">
                  新しいロール
                </label>
                <select
                  id="newRole"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="general_user">一般ユーザー</option>
                  <option value="vendor">出店者</option>
                  <option value="moderator">モデレーター</option>
                  <option value="super_admin">管理者</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={handleRoleChange}
                className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                変更する
              </button>
              <button
                onClick={() => setRoleChangeUser(null)}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
