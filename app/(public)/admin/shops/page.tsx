"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebounce } from "use-debounce";
import { shops as allShops } from "@/app/(public)/map/data/shops";
import { exportToCSV, exportToJSON, formatDateForFilename } from "@/lib/admin/exportUtils";
import { showToast } from "@/lib/admin/toast";
import { StatusBadge, LoadingButton, EmptyState, ErrorBoundary, AdminLayout } from "@/components/admin";
import { useKeyboardShortcuts, ShortcutHelp } from "@/lib/hooks/useKeyboardShortcuts";
import { SortableTableHeader, useSortableData } from "@/components/admin/desktop/SortableTableHeader";
import { Tooltip } from "@/components/admin/desktop/Tooltip";
import { DataDensityToggle, DENSITY_CONFIG, type DataDensity } from "@/components/admin/desktop/DataDensityToggle";

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
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [dataDensity, setDataDensity] = useState<DataDensity>("standard");

  const parentRef = useRef<HTMLTableSectionElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // ソート機能
  const { sortedData, sortKey, sortDirection, handleSort } = useSortableData(filteredShops, "name");

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
    count: sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => DENSITY_CONFIG[dataDensity].rowHeight,
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

  const handleSelectShop = useCallback((shopId: number, index: number, shiftKey: boolean) => {
    if (shiftKey && lastSelectedIndex !== null) {
      // Shift+クリックで範囲選択
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = sortedData.slice(start, end + 1).map((shop) => shop.id);

      setSelectedShopIds((prev) => {
        const newSet = new Set(prev);
        rangeIds.forEach((id) => newSet.add(id));
        return Array.from(newSet);
      });
    } else {
      // 通常のクリックでトグル
      setSelectedShopIds((prev) =>
        prev.includes(shopId) ? prev.filter((id) => id !== shopId) : [...prev, shopId]
      );
      setLastSelectedIndex(index);
    }
  }, [lastSelectedIndex, sortedData]);

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

  // キーボードショートカット
  useKeyboardShortcuts([
    {
      key: "a",
      ctrl: true,
      description: "全選択",
      action: handleSelectAll,
    },
    {
      key: "f",
      ctrl: true,
      description: "検索フォーカス",
      action: () => searchInputRef.current?.focus(),
    },
    {
      key: "/",
      description: "検索フォーカス",
      action: () => searchInputRef.current?.focus(),
    },
    {
      key: "e",
      ctrl: true,
      description: "CSV出力",
      action: handleExportCSV,
    },
    {
      key: "Delete",
      description: "選択した店舗を削除",
      action: () => {
        if (selectedShopIds.length > 0) {
          handleBulkDelete();
        }
      },
    },
    {
      key: "?",
      description: "ショートカット一覧を表示",
      action: () => setShowShortcutHelp(true),
    },
  ]);

  return (
    <AdminLayout>
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">店舗管理</h1>
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
            <div className="flex items-center gap-4">
              <DataDensityToggle density={dataDensity} onChange={setDataDensity} />
              <div>
                <label htmlFor="shop-search" className="sr-only">
                  店舗を検索
                </label>
                <input
                  ref={searchInputRef}
                  id="shop-search"
                  type="text"
                  placeholder="店舗名・カテゴリーで検索... (Ctrl+F または /)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none w-80"
                  aria-label="店舗名またはカテゴリーで検索"
                />
              </div>
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
                      <Tooltip content="すべての店舗を選択/解除 (Ctrl+A)" position="top">
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
                      </Tooltip>
                    </th>
                    <SortableTableHeader
                      label="店舗"
                      sortKey="name"
                      currentSortKey={sortKey}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      label="カテゴリー"
                      sortKey="category"
                      currentSortKey={sortKey}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      label="店主"
                      sortKey="owner"
                      currentSortKey={sortKey}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      label="ステータス"
                      sortKey="status"
                      currentSortKey={sortKey}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      label="登録日"
                      sortKey="registeredDate"
                      currentSortKey={sortKey}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                    />
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
                      const shop = sortedData[virtualRow.index];
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
                              onChange={(e) => handleSelectShop(shop.id, virtualRow.index, (e.nativeEvent as MouseEvent).shiftKey)}
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
                            <Tooltip content="店舗情報を編集" position="top">
                              <button className="text-blue-600 hover:text-blue-900 mr-3">
                                編集
                              </button>
                            </Tooltip>
                            {shop.status === "pending" && (
                              <Tooltip content="店舗を承認" position="top">
                                <button className="text-green-600 hover:text-green-900 mr-3">
                                  承認
                                </button>
                              </Tooltip>
                            )}
                            <Tooltip content="店舗を削除" position="top">
                              <button className="text-red-600 hover:text-red-900">削除</button>
                            </Tooltip>
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

      {/* キーボードショートカットヘルプボタン */}
      <Tooltip content="キーボードショートカット (?)">
        <button
          onClick={() => setShowShortcutHelp(true)}
          className="fixed bottom-8 right-8 w-12 h-12 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition"
          aria-label="キーボードショートカット一覧を表示"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </Tooltip>

      {/* キーボードショートカットヘルプモーダル */}
      {showShortcutHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowShortcutHelp(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">キーボードショートカット</h3>
              <button
                onClick={() => setShowShortcutHelp(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="閉じる"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ShortcutHelp
              shortcuts={[
                { key: "a", ctrl: true, description: "全選択" },
                { key: "f", ctrl: true, description: "検索フォーカス" },
                { key: "/", description: "検索フォーカス" },
                { key: "e", ctrl: true, description: "CSV出力" },
                { key: "Delete", description: "選択した店舗を削除" },
                { key: "?", description: "このヘルプを表示" },
              ].map(s => ({ ...s, action: () => {} }))}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminShopsPage() {
  return (
    <ErrorBoundary>
      <AdminShopsContent />
    </ErrorBoundary>
  );
}
