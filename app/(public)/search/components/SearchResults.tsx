'use client';

import { Shop } from '../../map/data/shops';
import ShopResultCard from './ShopResultCard';
import EmptyState from './EmptyState';

interface SearchResultsProps {
  shops: Shop[];
  hasQuery: boolean;
  categories: string[];
  favoriteShopIds: number[];
  onCategoryClick?: (category: string) => void;
  onToggleFavorite?: (shopId: number) => void;
  onSelectShop?: (shop: Shop) => void;
}

/**
 * 検索結果コンテナコンポーネント
 * 結果件数バッジ、グリッドレイアウト、空状態を管理
 */
export default function SearchResults({
  shops,
  hasQuery,
  categories,
  favoriteShopIds,
  onCategoryClick,
  onToggleFavorite,
  onSelectShop,
}: SearchResultsProps) {
  // 結果がない場合は空状態を表示
  if (shops.length === 0) {
    return <EmptyState hasQuery={hasQuery} categories={categories} onCategoryClick={onCategoryClick} />;
  }

  return (
    <div className="rounded-2xl border-2 border-orange-300 bg-white/95 p-4 shadow-sm">
      {/* ヘッダー: タイトルと結果件数 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
            検索結果
          </p>
          <h2 className="text-lg font-bold text-gray-900">お店一覧</h2>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-100">
          {shops.length}件
        </span>
      </div>

      {/* 検索結果グリッド */}
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {shops.map((shop) => (
          <ShopResultCard
            key={shop.id}
            shop={shop}
            isFavorite={favoriteShopIds.includes(shop.id)}
            onToggleFavorite={onToggleFavorite}
            onSelectShop={onSelectShop}
          />
        ))}
      </div>
    </div>
  );
}
