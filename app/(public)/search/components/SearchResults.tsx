'use client';

import { useEffect, useRef } from 'react';
import { Shop } from '../../map/data/shops';
import ShopResultCard from './ShopResultCard';
import EmptyState from './EmptyState';
import { Map } from 'lucide-react';

interface SearchResultsProps {
  shops: Shop[];
  totalCount: number;
  hasQuery: boolean;
  categories: string[];
  favoriteShopIds: number[];
  hasMore: boolean;
  onLoadMore?: () => void;
  onCategoryClick?: (category: string) => void;
  onKeywordClick?: (keyword: string) => void;
  onToggleFavorite?: (shopId: number) => void;
  onSelectShop?: (shop: Shop) => void;
  onOpenMap?: () => void;
  mapLabel?: string;
  enableSearchMapHighlight?: boolean;
}

/**
 * 検索結果一覧コンポーネント
 * 結果件数バッジ、グリッドレイアウト、空状態を管理
 */
export default function SearchResults({
  shops,
  totalCount,
  hasQuery,
  categories,
  favoriteShopIds,
  hasMore,
  onLoadMore,
  onCategoryClick,
  onKeywordClick,
  onToggleFavorite,
  onSelectShop,
  onOpenMap,
  mapLabel,
  enableSearchMapHighlight = false,
}: SearchResultsProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || !onLoadMore || !sentinelRef.current) return;
    const target = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  // 結果がない場合は空状態を表示
  if (shops.length === 0) {
    return (
      <EmptyState
        hasQuery={hasQuery}
        categories={categories}
        onCategoryClick={onCategoryClick}
        onKeywordClick={onKeywordClick}
      />
    );
  }

  return (
    <>
      <div className="rounded-2xl border-2 border-orange-300 bg-white/95 p-4 shadow-sm pb-16 md:pb-4">
        {/* ヘッダー: タイトルと結果件数 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
              検索結果
            </p>
            <h2 className="text-lg font-bold text-gray-900">お店一覧</h2>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-100">
            {totalCount}件
          </span>
        </div>

        {/* デスクトップ向けのマップボタン（リスト上部） */}
        {onOpenMap && (
          <button
            type="button"
            onClick={onOpenMap}
            className="mt-4 hidden w-full md:block rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100"
          >
            マップで見る{mapLabel ? `（${mapLabel}）` : ''}
          </button>
        )}

        {/* 検索結果グリッド */}
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <ShopResultCard
              key={shop.id}
              shop={shop}
              isFavorite={favoriteShopIds.includes(shop.id)}
              onToggleFavorite={onToggleFavorite}
              onSelectShop={onSelectShop}
              enableSearchMapHighlight={enableSearchMapHighlight}
            />
          ))}
        </div>

        {hasMore && (
          <div
            ref={sentinelRef}
            className="mt-6 flex items-center justify-center py-6 text-xs text-gray-500"
          >
            読み込み中...
          </div>
        )}
      </div>

      {/* モバイル向けのフローティングマップボタン（画面下部固定） */}
      {onOpenMap && (
        <div className="fixed bottom-24 left-0 right-0 z-30 flex justify-center px-4 md:hidden animate-in slide-in-from-bottom-5 duration-500 pointer-events-none">
          <button
            type="button"
            onClick={onOpenMap}
            className="pointer-events-auto flex items-center gap-2 rounded-full border-2 border-white bg-amber-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-900/20 transition active:scale-95"
          >
            <Map className="h-4 w-4" />
            <span>マップで見る ({totalCount}件)</span>
          </button>
        </div>
      )}
    </>
  );
}
