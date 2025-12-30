"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebounce } from "use-debounce";
import { shops as allShops } from "@/app/(public)/map/data/shops";
import { exportToCSV, exportToJSON, formatDateForFilename } from "@/lib/admin/exportUtils";
import { showToast } from "@/lib/admin/toast";
import { StatusBadge, LoadingButton, EmptyState, ErrorBoundary } from "@/components/admin";

type ShopStatus = "active" | "pending" | "suspended";

interface ShopWithStatus {
  id: number;
  name: string;
  category: string;
  icon: string;
  status: ShopStatus;
  owner?: string;
  registeredDate?: string;
}

function AdminShopsContent() {
  const { permissions } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | ShopStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [selectedShopIds, setSelectedShopIds] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const parentRef = React.useRef<HTMLTableSectionElement>(null);

  // 管理者権限チェック
  useEffect(() => {
    if (!permissions.isSuperAdmin) {
      router.push("/");
    }
  }, [permissions.isSuperAdmin, router]);

  if (!permissions.isSuperAdmin) {
    return null;
  }

  // ダミーデータ: 実際のshopsデータにステータスを追加
  const shopsWithStatus: ShopWithStatus[] = useMemo(
    () =>
      allShops.map((shop, index) => ({
        id: shop.id,
        name: shop.name,
        category: shop.category,
        icon: shop.icon,
        status: index % 10 === 0 ? "pending" : index % 20 === 0 ? "suspended" : "active",
        owner: `店主${shop.id}`,
        registeredDate: "2024-01-15",
      })),
    []
  );

  // フィルタリング（メモ化）
  const filteredShops = useMemo(() => {
    return shopsWithStatus.filter((shop) => {
      const matchesFilter = filter === "all" || shop.status === filter;
      const matchesSearch =
        debouncedSearchQuery === "" ||
        shop.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        shop.category.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [shopsWithStatus, filter, debouncedSearchQuery]);

  // 統計（メモ化）
  const stats = useMemo(
    () => ({
      total: shopsWithStatus.length,
      active: shopsWithStatus.filter((s) => s.status === "active").length,
      pending: shopsWithStatus.filter((s) => s.status === "pending").length,
      suspended: shopsWithStatus.filter((s) => s.status === "suspended").length,
    }),
    [shopsWithStatus]
  );

  // 仮想化
  const rowVirtualizer = useVirtualizer({
    count: filteredShops.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 73,
    overscan: 5,
  });

  // チェックボックス操作
  const handleSelectAll = useCallback(() => {
    if (selectedShopIds.length === filteredShops.length) {
      setSelectedShopIds([]);
    } else {
      setSelectedShopIds(filteredShops.map((shop) => shop.id));
    }
  }, [selectedShopIds.length, filteredShops]);

  const handleSelectShop = useCallback((shopId: number) => {
    setSelectedShopIds((prev) =>
      prev.includes(shopId) ? prev.filter((id) => id !== shopId) : [...prev, shopId]
    );
  }, []);

  // 一括操作
  const handleBulkApprove = useCallback(async () => {
    if (selectedShopIds.length === 0) return;
    if (!confirm(`${selectedShopIds.length}件の店舗を一括承認しますか？`)) return;

    setBulkLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast.success(`${selectedShopIds.length}件の店舗を承認しました`);
      setSelectedShopIds([]);
    } catch (error) {
      showToast.error("一括承認に失敗しました");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedShopIds]);

  const handleBulkSuspend = useCallback(async () => {
    if (selectedShopIds.length === 0) return;
    if (!confirm(`${selectedShopIds.length}件の店舗を一括停止しますか？`)) return;

    setBulkLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast.success(`${selectedShopIds.length}件の店舗を停止しました`);
      setSelectedShopIds([]);
    } catch (error) {
      showToast.error("一括停止に失敗しました");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedShopIds]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedShopIds.length === 0) return;
    if (
      !confirm(
        `${selectedShopIds.length}件の店舗を一括削除しますか？この操作は取り消せません。`
      )
    )
      return;

    setBulkLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast.success(`${selectedShopIds.length}件の店舗を削除しました`);
      setSelectedShopIds([]);
    } catch (error) {
      showToast.error("一括削除に失敗しました");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedShopIds]);

  // エクスポート
  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const dataToExport = filteredShops.map((shop) => ({
        ID: shop.id,
        店舗名: shop.name,
        カテゴリー: shop.category,
        店主: shop.owner || "",
        ステータス:
          shop.status === "active" ? "稼働中" : shop.status === "pending" ? "承認待ち" : "停止中",
        登録日: shop.registeredDate || "",
      }));
      const filename = `shops_${formatDateForFilename()}.csv`;
      const result = exportToCSV(dataToExport, filename);

      if (result.success) {
        showToast.success("CSVファイルをエクスポートしました");
      } else {
        showToast.error(result.error || "エクスポートに失敗しました");
      }
    } catch (error) {
      showToast.error("エクスポートに失敗しました");
    } finally {
      setIsExporting(false);
    }
  }, [filteredShops]);

  const handleExportJSON = useCallback(async () => {
    setIsExporting(true);
    try {
      const filename = `shops_${formatDateForFilename()}.json`;
      const result = exportToJSON(filteredShops, filename);

      if (result.success) {
        showToast.success("JSONファイルをエクスポートしました");
      } else {
        showToast.error(result.error || "エクスポートに失敗しました");
      }
    } catch (error) {
      showToast.error("エクスポートに失敗しました");
    } finally {
      setIsExporting(false);
    }
  }, [filteredShops]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800">
                ← ダッシュボードに戻る
              </Link>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">店舗管理</h1>
            </div>
            <div className="flex gap-2">
              <LoadingButton
                onClick={handleExportCSV}
                isLoading={isExporting}
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 text-sm"
              >
                CSV出力
              </LoadingButton>
              <LoadingButton
                onClick={handleExportJSON}
                isLoading={isExporting}
                className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 text-sm"
              >
                JSON出力
              </LoadingButton>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                + 新規店舗追加
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
            <p className="text-sm text-gray-600">総店舗数</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-4 shadow">
            <p className="text-sm text-green-600">稼働中</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-4 shadow">
            <p className="text-sm text-orange-600">承認待ち</p>
            <p className="mt-1 text-2xl font-bold text-orange-600">{stats.pending}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 shadow">
            <p className="text-sm text-red-600">停止中</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{stats.suspended}</p>
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
                onClick={() => setFilter("active")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "active"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                稼働中 ({stats.active})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "pending"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                承認待ち ({stats.pending})
              </button>
              <button
                onClick={() => setFilter("suspended")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "suspended"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                停止中 ({stats.suspended})
              </button>
            </div>
            <div>
              <label htmlFor="shop-search" className="sr-only">
                店舗を検索
              </label>
              <input
                id="shop-search"
                type="text"
                placeholder="店舗名・カテゴリーで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                aria-label="店舗名またはカテゴリーで検索"
              />
            </div>
          </div>
        </div>

        {/* 一括操作ツールバー */}
        {selectedShopIds.length > 0 && (
          <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4 shadow" role="status">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedShopIds.length}件選択中
                </span>
                <button
                  onClick={() => setSelectedShopIds([])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  aria-label="選択を解除"
                >
                  選択解除
                </button>
              </div>
              <div className="flex gap-2">
                <LoadingButton
                  onClick={handleBulkApprove}
                  isLoading={bulkLoading}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  一括承認
                </LoadingButton>
                <LoadingButton
                  onClick={handleBulkSuspend}
                  isLoading={bulkLoading}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                >
                  一括停止
                </LoadingButton>
                <LoadingButton
                  onClick={handleBulkDelete}
                  isLoading={bulkLoading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  一括削除
                </LoadingButton>
              </div>
            </div>
          </div>
        )}

        {/* 店舗リスト */}
        {filteredShops.length === 0 ? (
          <EmptyState
            icon="🏪"
            title="店舗が見つかりません"
            description="検索条件に一致する店舗がありません。フィルターや検索キーワードを変更してください。"
          />
        ) : (
          <div className="rounded-lg bg-white shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedShopIds.length === filteredShops.length &&
                          filteredShops.length > 0
                        }
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label="すべての店舗を選択"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      店舗
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      カテゴリー
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      店主
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      登録日
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody
                  ref={parentRef}
                  className="divide-y divide-gray-200 bg-white"
                  style={{ height: "600px", overflow: "auto" }}
                >
                  <div
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const shop = filteredShops[virtualRow.index];
                      return (
                        <tr
                          key={shop.id}
                          className="hover:bg-gray-50"
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <td className="whitespace-nowrap px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedShopIds.includes(shop.id)}
                              onChange={() => handleSelectShop(shop.id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              aria-label={`店舗「${shop.name}」を選択`}
                            />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center">
                              <span className="mr-3 text-2xl" aria-hidden="true">
                                {shop.icon}
                              </span>
                              <div>
                                <div className="font-medium text-gray-900">{shop.name}</div>
                                <div className="text-sm text-gray-500">ID: {shop.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {shop.category}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {shop.owner}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <StatusBadge status={shop.status} />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {shop.registeredDate}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">
                              編集
                            </button>
                            {shop.status === "pending" && (
                              <button className="text-green-600 hover:text-green-900 mr-3">
                                承認
                              </button>
                            )}
                            <button className="text-red-600 hover:text-red-900">削除</button>
                          </td>
                        </tr>
                      );
                    })}
                  </div>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminShopsPage() {
  return (
    <ErrorBoundary>
      <AdminShopsContent />
    </ErrorBoundary>
  );
}
