"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { exportToCSV, exportToJSON, formatDateForFilename } from "@/lib/admin/exportUtils";
import { showToast } from "@/lib/admin/toast";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebounce } from "use-debounce";
import { StatusBadge, LoadingButton, EmptyState, ErrorBoundary, AdminLayout, AdminPageHeader } from "@/components/admin";

type KotoduteStatus = "published" | "flagged" | "hidden" | "deleted";

interface Kotodute {
  id: number;
  author: string;
  authorId: string;
  content: string;
  createdAt: string;
  status: KotoduteStatus;
  reports?: number; // ユーザーからの通報数
  shopId?: number;
  shopName?: string;
  tags?: string[];
  isReported?: boolean; // ユーザーから通報されているか
}

function ModeratorKotoduteContent() {
  const { permissions, isLoading } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | KotoduteStatus>("all");
  const [shopFilter, setShopFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [selectedKotodute, setSelectedKotodute] = useState<Kotodute | null>(null);
  const [selectedKotoduteIds, setSelectedKotoduteIds] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!permissions.canModerateContent) {
      router.push("/");
    }
  }, [isLoading, permissions.canModerateContent, router]);

  if (isLoading || !permissions.canModerateContent) {
    return null;
  }

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
        status: "published",
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
        status: "published",
        shopId: 2,
        shopName: "果物の山田",
        tags: ["果物"],
      },
      {
        id: 3,
        author: "佐藤次郎",
        authorId: "user-003",
        content: "不適切な内容が含まれる投稿です。攻撃的な言葉や誹謗中傷が含まれています。",
        createdAt: "2024-12-29 18:45",
        status: "flagged",
        reports: 5,
        isReported: true,
        shopId: 3,
        shopName: "魚の佐藤",
      },
      {
        id: 4,
        author: "鈴木一郎",
        authorId: "user-004",
        content: "スパム投稿の可能性がある内容。外部サイトへの誘導リンクが含まれています。",
        createdAt: "2024-12-29 14:20",
        status: "hidden",
      },
      {
        id: 5,
        author: "高橋美咲",
        authorId: "user-005",
        content:
          "お花がとてもきれいでした。店主さんの説明も丁寧で、育て方のコツを教えてもらえました。",
        createdAt: "2024-12-29 11:30",
        status: "published",
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
        status: "published",
        tags: ["初めて", "楽しい"],
      },
      {
        id: 7,
        author: "中村さくら",
        authorId: "user-007",
        content: "こちらの店舗、態度が悪すぎる。二度と行きたくない。",
        createdAt: "2024-12-28 16:20",
        status: "flagged",
        reports: 2,
        isReported: true,
        shopId: 3,
        shopName: "魚の佐藤",
      },
      {
        id: 8,
        author: "小林太一",
        authorId: "user-008",
        content: "朝早くから新鮮な魚が並んでいて、活気があって良かったです。",
        createdAt: "2024-12-28 12:10",
        status: "published",
        shopId: 3,
        shopName: "魚の佐藤",
        tags: ["魚", "新鮮"],
      },
    ],
    []
  );

  // ユニークな店舗を抽出
  const uniqueShops = useMemo(() => {
    const shops = new Set(dummyKotodute.filter((k) => k.shopName).map((k) => k.shopName!));
    return Array.from(shops).sort();
  }, [dummyKotodute]);

  // ユニークなタグを抽出
  const uniqueTags = useMemo(() => {
    const tags = new Set(dummyKotodute.flatMap((k) => k.tags || []));
    return Array.from(tags).sort();
  }, [dummyKotodute]);

  // フィルタリング（メモ化）
  const filteredKotodute = useMemo(() => {
    return dummyKotodute.filter((k) => {
      const matchesStatusFilter = filter === "all" || k.status === filter;
      const matchesShopFilter = shopFilter === "all" || k.shopName === shopFilter;
      const matchesTagFilter = tagFilter === "all" || (k.tags && k.tags.includes(tagFilter));
      const matchesSearch =
        debouncedSearchQuery === "" ||
        k.content.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        k.author.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        k.shopName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      return matchesStatusFilter && matchesShopFilter && matchesTagFilter && matchesSearch;
    });
  }, [dummyKotodute, filter, shopFilter, tagFilter, debouncedSearchQuery]);

  // 統計（メモ化）
  const stats = useMemo(
    () => ({
      total: dummyKotodute.length,
      published: dummyKotodute.filter((k) => k.status === "published").length,
      flagged: dummyKotodute.filter((k) => k.status === "flagged").length,
      hidden: dummyKotodute.filter((k) => k.status === "hidden").length,
      deleted: dummyKotodute.filter((k) => k.status === "deleted").length,
      needsReview: dummyKotodute.filter((k) => k.isReported || k.reports && k.reports > 0).length,
    }),
    [dummyKotodute]
  );

  // 店舗別の統計
  const shopStats = useMemo(() => {
    const stats: Record<string, number> = {};
    dummyKotodute.forEach((k) => {
      if (k.shopName) {
        stats[k.shopName] = (stats[k.shopName] || 0) + 1;
      }
    });
    return stats;
  }, [dummyKotodute]);

  // タグ別の統計
  const tagStats = useMemo(() => {
    const stats: Record<string, number> = {};
    dummyKotodute.forEach((k) => {
      k.tags?.forEach((tag) => {
        stats[tag] = (stats[tag] || 0) + 1;
      });
    });
    return stats;
  }, [dummyKotodute]);

  const getStatusLabel = useCallback((status: KotoduteStatus) => {
    switch (status) {
      case "published":
        return "公開中";
      case "flagged":
        return "要確認";
      case "hidden":
        return "非公開";
      case "deleted":
        return "削除済み";
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
  const handleBulkHide = useCallback(async () => {
    if (selectedKotoduteIds.length === 0) return;
    if (!confirm(`${selectedKotoduteIds.length}件のことづてを非公開にしますか？`)) return;

    setBulkLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast.success(`${selectedKotoduteIds.length}件のことづてを非公開にしました`);
      setSelectedKotoduteIds([]);
    } catch (error) {
      showToast.error("非公開処理に失敗しました");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedKotoduteIds]);

  const handleBulkPublish = useCallback(async () => {
    if (selectedKotoduteIds.length === 0) return;
    if (!confirm(`${selectedKotoduteIds.length}件のことづてを公開しますか？`)) return;

    setBulkLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast.success(`${selectedKotoduteIds.length}件のことづてを公開しました`);
      setSelectedKotoduteIds([]);
    } catch (error) {
      showToast.error("公開処理に失敗しました");
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

  return (
    <AdminLayout>
      <AdminPageHeader
        eyebrow="Kotodute Admin"
        title="ことづて管理"
        actions={
          <>
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
          </>
        }
      />

      {/* メインコンテンツ */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5 mb-6">
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-600">総投稿数</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 shadow">
            <p className="text-sm text-blue-600">公開中</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{stats.published}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 shadow">
            <p className="text-sm text-red-600">要確認</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{stats.flagged}</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-4 shadow">
            <p className="text-sm text-orange-600">非公開</p>
            <p className="mt-1 text-2xl font-bold text-orange-600">{stats.hidden}</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 shadow">
            <p className="text-sm text-purple-600">確認が必要</p>
            <p className="mt-1 text-2xl font-bold text-purple-600">{stats.needsReview}</p>
          </div>
        </div>

        {/* フィルターと検索 */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow space-y-4">
          {/* ステータスフィルター */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 flex-wrap">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center mr-2">
                ステータス:
              </div>
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
                onClick={() => setFilter("flagged")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "flagged"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                aria-label="要確認のことづてを表示"
              >
                要確認 ({stats.flagged})
              </button>
              <button
                onClick={() => setFilter("published")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "published"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                aria-label="公開中のことづてを表示"
              >
                公開中 ({stats.published})
              </button>
              <button
                onClick={() => setFilter("hidden")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "hidden"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                aria-label="非公開のことづてを表示"
              >
                非公開 ({stats.hidden})
              </button>
              <button
                onClick={() => setFilter("deleted")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === "deleted"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                aria-label="削除済みのことづてを表示"
              >
                削除済み ({stats.deleted})
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

          {/* 店舗フィルター */}
          {uniqueShops.length > 0 && (
            <div className="flex gap-2 flex-wrap items-center pt-2 border-t border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mr-2">
                店舗:
              </div>
              <button
                onClick={() => setShopFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  shopFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                すべて ({dummyKotodute.length})
              </button>
              {uniqueShops.map((shop) => (
                <button
                  key={shop}
                  onClick={() => setShopFilter(shop)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    shopFilter === shop
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {shop} ({shopStats[shop] || 0})
                </button>
              ))}
            </div>
          )}

          {/* タグフィルター */}
          {uniqueTags.length > 0 && (
            <div className="flex gap-2 flex-wrap items-center pt-2 border-t border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mr-2">
                タグ:
              </div>
              <button
                onClick={() => setTagFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  tagFilter === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                すべて
              </button>
              {uniqueTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    tagFilter === tag
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  #{tag} ({tagStats[tag] || 0})
                </button>
              ))}
            </div>
          )}
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
                  onClick={handleBulkPublish}
                  isLoading={bulkLoading}
                  loadingText="処理中..."
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  aria-label="選択したことづてを一括公開"
                >
                  一括公開
                </LoadingButton>
                <LoadingButton
                  onClick={handleBulkHide}
                  isLoading={bulkLoading}
                  loadingText="処理中..."
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                  aria-label="選択したことづてを一括非公開"
                >
                  一括非公開
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
                      {kotodute.status === "flagged" && (
                        <>
                          <button
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            aria-label="問題なしとして公開を維持"
                          >
                            ✓ 問題なし
                          </button>
                          <button
                            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                            aria-label="投稿を非公開にする"
                          >
                            🔒 非公開
                          </button>
                          <button
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            aria-label="投稿を削除"
                          >
                            🗑️ 削除
                          </button>
                        </>
                      )}
                      {kotodute.status === "published" && (
                        <>
                          <button
                            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                            aria-label="投稿を非公開にする"
                          >
                            🔒 非公開
                          </button>
                          <button
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            aria-label="投稿を削除"
                          >
                            🗑️ 削除
                          </button>
                        </>
                      )}
                      {kotodute.status === "hidden" && (
                        <>
                          <button
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            aria-label="投稿を公開する"
                          >
                            ✓ 公開
                          </button>
                          <button
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            aria-label="投稿を削除"
                          >
                            🗑️ 削除
                          </button>
                        </>
                      )}
                      {kotodute.status === "deleted" && (
                        <button
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                          aria-label="投稿を復元"
                        >
                          ↺ 復元
                        </button>
                      )}
                      <button
                        className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
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
