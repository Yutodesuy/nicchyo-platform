"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { exportToCSV, exportToJSON, formatDateForFilename } from "@/lib/admin/exportUtils";
import { showToast } from "@/lib/admin/toast";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebounce } from "use-debounce";
import { StatusBadge, LoadingButton, EmptyState, ErrorBoundary, AdminLayout } from "@/components/admin";

type KotoduteStatus = "approved" | "pending" | "rejected" | "reported";

interface Kotodute {
  id: number;
  author: string;
  authorId: string;
  content: string;
  createdAt: string;
  status: KotoduteStatus;
  reports?: number;
  shopId?: number;
  shopName?: string;
  tags?: string[];
}

function ModeratorKotoduteContent() {
  const { permissions } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | KotoduteStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [selectedKotodute, setSelectedKotodute] = useState<Kotodute | null>(null);
  const [selectedKotoduteIds, setSelectedKotoduteIds] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // ダミーデータ（メモ化）
  const dummyKotodute: Kotodute[] = useMemo(
    () => [
      {
        id: 1,
        author: "田中太郎",
        authorId: "user-001",
        content:
          "高知の日曜市、最高でした！新鮮な野菜がたくさんあって、店主さんも優しかったです。また来たいと思います。",
        createdAt: "2024-12-30 10:30",
        status: "pending",
        shopId: 1,
        shopName: "野菜の鈴木",
        tags: ["野菜", "新鮮", "おすすめ"],
      },
      {
        id: 2,
        author: "山田花子",
        authorId: "user-002",
        content: "果物がとても美味しかったです！",
        createdAt: "2024-12-30 09:15",
        status: "approved",
        shopId: 2,
        shopName: "果物の山田",
        tags: ["果物"],
      },
      {
        id: 3,
        author: "佐藤次郎",
        authorId: "user-003",
        content: "不適切な内容が含まれる投稿...",
        createdAt: "2024-12-29 18:45",
        status: "reported",
        reports: 5,
        shopId: 3,
        shopName: "魚の佐藤",
      },
      {
        id: 4,
        author: "鈴木一郎",
        authorId: "user-004",
        content: "スパム投稿の可能性がある内容...",
        createdAt: "2024-12-29 14:20",
        status: "rejected",
      },
      {
        id: 5,
        author: "高橋美咲",
        authorId: "user-005",
        content:
          "お花がとてもきれいでした。店主さんの説明も丁寧で、育て方のコツを教えてもらえました。",
        createdAt: "2024-12-29 11:30",
        status: "approved",
        shopId: 5,
        shopName: "花の高橋",
        tags: ["花", "植物", "丁寧"],
      },
      {
        id: 6,
        author: "伊藤健太",
        authorId: "user-006",
        content: "初めて日曜市に来ました。想像以上に賑わっていて楽しかったです！",
        createdAt: "2024-12-29 08:00",
        status: "pending",
        tags: ["初めて", "楽しい"],
      },
    ],
    []
  );

  // フィルタリング（メモ化）
  const filteredKotodute = useMemo(() => {
    return dummyKotodute.filter((k) => {
      const matchesFilter = filter === "all" || k.status === filter;
      const matchesSearch =
        debouncedSearchQuery === "" ||
        k.content.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        k.author.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        k.shopName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [dummyKotodute, filter, debouncedSearchQuery]);

  // 統計（メモ化）
  const stats = useMemo(
    () => ({
      total: dummyKotodute.length,
      approved: dummyKotodute.filter((k) => k.status === "approved").length,
      pending: dummyKotodute.filter((k) => k.status === "pending").length,
      rejected: dummyKotodute.filter((k) => k.status === "rejected").length,
      reported: dummyKotodute.filter((k) => k.status === "reported").length,
    }),
    [dummyKotodute]
  );

  const getStatusLabel = useCallback((status: KotoduteStatus) => {
    switch (status) {
      case "approved":
        return "承認済み";
      case "pending":
        return "承認待ち";
      case "rejected":
        return "却下";
      case "reported":
        return "報告あり";
    }
  }, []);

  // チェックボックス操作
  const handleSelectAll = useCallback(() => {
    if (selectedKotoduteIds.length === filteredKotodute.length) {
      setSelectedKotoduteIds([]);
    } else {
      setSelectedKotoduteIds(filteredKotodute.map((k) => k.id));
    }
  }, [selectedKotoduteIds.length, filteredKotodute]);

  const handleSelectKotodute = useCallback(
    (kotoduteId: number) => {
      if (selectedKotoduteIds.includes(kotoduteId)) {
        setSelectedKotoduteIds(selectedKotoduteIds.filter((id) => id !== kotoduteId));
      } else {
        setSelectedKotoduteIds([...selectedKotoduteIds, kotoduteId]);
      }
    },
    [selectedKotoduteIds]
  );

  // 一括操作
  const handleBulkApprove = useCallback(async () => {
    if (selectedKotoduteIds.length === 0) return;
    if (!confirm(`${selectedKotoduteIds.length}件のことづてを一括承認しますか？`)) return;

    setBulkLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast.success(`${selectedKotoduteIds.length}件のことづてを承認しました`);
      setSelectedKotoduteIds([]);
    } catch (error) {
      showToast.error("一括承認に失敗しました");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedKotoduteIds]);

  const handleBulkReject = useCallback(async () => {
    if (selectedKotoduteIds.length === 0) return;
    if (!confirm(`${selectedKotoduteIds.length}件のことづてを一括却下しますか？`)) return;

    setBulkLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast.success(`${selectedKotoduteIds.length}件のことづてを却下しました`);
      setSelectedKotoduteIds([]);
    } catch (error) {
      showToast.error("一括却下に失敗しました");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedKotoduteIds]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedKotoduteIds.length === 0) return;
    if (
      !confirm(
        `${selectedKotoduteIds.length}件のことづてを一括削除しますか？この操作は取り消せません。`
      )
    )
      return;

    setBulkLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast.success(`${selectedKotoduteIds.length}件のことづてを削除しました`);
      setSelectedKotoduteIds([]);
    } catch (error) {
      showToast.error("一括削除に失敗しました");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedKotoduteIds]);

  // エクスポート
  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const dataToExport = filteredKotodute.map((k) => ({
        ID: k.id.toString(),
        投稿者: k.author,
        投稿者ID: k.authorId,
        内容: k.content,
        店舗名: k.shopName || "",
        店舗ID: k.shopId?.toString() || "",
        タグ: k.tags?.join(", ") || "",
        ステータス: getStatusLabel(k.status),
        報告数: k.reports?.toString() || "0",
        投稿日時: k.createdAt,
      }));
      const filename = `kotodute_${formatDateForFilename()}.csv`;
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
  }, [filteredKotodute, getStatusLabel]);

  const handleExportJSON = useCallback(async () => {
    setIsExporting(true);
    try {
      const filename = `kotodute_${formatDateForFilename()}.json`;
      const result = exportToJSON(filteredKotodute, filename);
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
  }, [filteredKotodute]);

  // Virtual scrolling setup for cards
  const parentRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredKotodute.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220,
    overscan: 3,
  });

  // モデレーター権限チェック
  useEffect(() => {
    if (!permissions.canModerateContent) {
      router.push("/");
    }
  }, [permissions.canModerateContent, router]);

  if (!permissions.canModerateContent) {
    return null;
  }

  return (
    <AdminLayout>
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ことづて管理</h1>
            </div>
            <div className="flex gap-2">
              <LoadingButton
                onClick={handleExportCSV}
                isLoading={isExporting}
                loadingText="出力中..."
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 text-sm"
                aria-label="CSVファイルをエクスポート"
              >
                CSV出力
              </LoadingButton>
              <LoadingButton
                onClick={handleExportJSON}
                isLoading={isExporting}
                loadingText="出力中..."
                className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 text-sm"
                aria-label="JSONファイルをエクスポート"
              >
                JSON出力
              </LoadingButton>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5 mb-6">
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-600">総投稿数</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-4 shadow">
            <p className="text-sm text-green-600">承認済み</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-4 shadow">
            <p className="text-sm text-orange-600">承認待ち</p>
            <p className="mt-1 text-2xl font-bold text-orange-600">{stats.pending}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 shadow">
            <p className="text-sm text-red-600">却下</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 shadow">
            <p className="text-sm text-purple-600">報告あり</p>
            <p className="mt-1 text-2xl font-bold text-purple-600">{stats.reported}</p>
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
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                aria-label="すべてのことづてを表示"
              >
                すべて ({stats.total})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "pending"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                aria-label="承認待ちのことづてを表示"
              >
                承認待ち ({stats.pending})
              </button>
              <button
                onClick={() => setFilter("reported")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "reported"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                aria-label="報告ありのことづてを表示"
              >
                報告あり ({stats.reported})
              </button>
              <button
                onClick={() => setFilter("approved")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "approved"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                aria-label="承認済みのことづてを表示"
              >
                承認済み ({stats.approved})
              </button>
              <button
                onClick={() => setFilter("rejected")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "rejected"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                aria-label="却下されたことづてを表示"
              >
                却下 ({stats.rejected})
              </button>
            </div>
            <input
              id="kotodute-search"
              type="text"
              placeholder="内容・投稿者・店舗名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
              aria-label="内容、投稿者、または店舗名で検索"
            />
          </div>
        </div>

        {/* 一括操作ツールバー */}
        {selectedKotoduteIds.length > 0 && (
          <div className="mb-6 rounded-lg bg-purple-50 border border-purple-200 p-4 shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-purple-900">
                  {selectedKotoduteIds.length}件選択中
                </span>
                <button
                  onClick={() => setSelectedKotoduteIds([])}
                  className="text-sm text-purple-600 hover:text-purple-800"
                  aria-label="選択を解除"
                >
                  選択解除
                </button>
              </div>
              <div className="flex gap-2">
                <LoadingButton
                  onClick={handleBulkApprove}
                  isLoading={bulkLoading}
                  loadingText="処理中..."
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  aria-label="選択したことづてを一括承認"
                >
                  一括承認
                </LoadingButton>
                <LoadingButton
                  onClick={handleBulkReject}
                  isLoading={bulkLoading}
                  loadingText="処理中..."
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                  aria-label="選択したことづてを一括却下"
                >
                  一括却下
                </LoadingButton>
                <LoadingButton
                  onClick={handleBulkDelete}
                  isLoading={bulkLoading}
                  loadingText="削除中..."
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  aria-label="選択したことづてを一括削除"
                >
                  一括削除
                </LoadingButton>
              </div>
            </div>
          </div>
        )}

        {/* ことづてリスト */}
        {filteredKotodute.length === 0 ? (
          <EmptyState
            icon="💬"
            title="ことづてが見つかりません"
            description={
              debouncedSearchQuery
                ? "検索条件に一致することづてがありません。別のキーワードで検索してください。"
                : "現在、この条件に該当することづてはありません。"
            }
          />
        ) : (
          <div
            ref={parentRef}
            className="space-y-4"
            style={{ height: "800px", overflow: "auto" }}
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const kotodute = filteredKotodute[virtualRow.index];
                return (
                  <div
                    key={kotodute.id}
                    className="rounded-lg bg-white p-6 shadow hover:shadow-md transition"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* チェックボックス */}
                        <input
                          type="checkbox"
                          checked={selectedKotoduteIds.includes(kotodute.id)}
                          onChange={() => handleSelectKotodute(kotodute.id)}
                          className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 flex-shrink-0 mt-1"
                          aria-label={`投稿「${kotodute.content.substring(0, 20)}...」を選択`}
                        />

                        {/* コンテンツ */}
                        <div className="flex-1">
                          {/* ヘッダー情報 */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-600 text-xl" aria-hidden="true">
                                👤
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{kotodute.author}</p>
                              <p className="text-xs text-gray-500">{kotodute.createdAt}</p>
                            </div>
                            <StatusBadge status={kotodute.status} />
                            {kotodute.reports && kotodute.reports > 0 && (
                              <span
                                className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800"
                                role="status"
                                aria-label={`${kotodute.reports}件の報告`}
                              >
                                <span aria-hidden="true">🚨</span> {kotodute.reports}件の報告
                              </span>
                            )}
                          </div>

                          {/* 本文 */}
                          <p className="text-gray-700 mb-3 leading-relaxed">{kotodute.content}</p>

                          {/* 関連店舗 */}
                          {kotodute.shopName && (
                            <div className="mb-3">
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                <span aria-hidden="true">🏪</span> {kotodute.shopName}
                              </span>
                            </div>
                          )}

                          {/* タグ */}
                          {kotodute.tags && kotodute.tags.length > 0 && (
                            <div className="flex gap-2 mb-3">
                              {kotodute.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="mt-4 flex gap-2 border-t pt-4">
                      {kotodute.status === "pending" && (
                        <>
                          <button
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                            aria-label={`投稿「${kotodute.content.substring(0, 20)}...」を承認`}
                          >
                            ✓ 承認
                          </button>
                          <button
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            aria-label={`投稿「${kotodute.content.substring(0, 20)}...」を却下`}
                          >
                            ✕ 却下
                          </button>
                        </>
                      )}
                      {kotodute.status === "reported" && (
                        <>
                          <button
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                            aria-label="問題なしとして承認"
                          >
                            ✓ 問題なし
                          </button>
                          <button
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            aria-label="投稿を削除"
                          >
                            🗑️ 削除
                          </button>
                        </>
                      )}
                      {kotodute.status === "approved" && (
                        <button
                          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                          aria-label="投稿を非公開にする"
                        >
                          🔒 非公開にする
                        </button>
                      )}
                      <button
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        aria-label="投稿を編集"
                      >
                        ✏️ 編集
                      </button>
                      <button
                        onClick={() => setSelectedKotodute(kotodute)}
                        className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                        aria-label="投稿の詳細を表示"
                      >
                        詳細
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 詳細モーダル */}
      {selectedKotodute && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setSelectedKotodute(null)}
          role="dialog"
          aria-labelledby="kotodute-detail-title"
          aria-modal="true"
        >
          <div
            className="max-w-2xl w-full rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="kotodute-detail-title" className="text-xl font-bold text-gray-900 mb-4">
              投稿詳細
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">投稿者</p>
                <p className="text-gray-900">{selectedKotodute.author}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">投稿日時</p>
                <p className="text-gray-900">{selectedKotodute.createdAt}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">内容</p>
                <p className="text-gray-900">{selectedKotodute.content}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ステータス</p>
                <p className="text-gray-900">{getStatusLabel(selectedKotodute.status)}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedKotodute(null)}
              className="mt-6 w-full rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              aria-label="モーダルを閉じる"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function ModeratorKotodutePage() {
  return (
    <ErrorBoundary>
      <ModeratorKotoduteContent />
    </ErrorBoundary>
  );
}
