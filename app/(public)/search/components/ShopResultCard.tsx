'use client';

import Link from 'next/link';
import { Shop } from '../../map/data/shops';
import { memo } from 'react';

interface ShopResultCardProps {
  shop: Shop;
  isFavorite: boolean;
  onToggleFavorite?: (shopId: number) => void;
}

/**
 * 店舗検索結果カードコンポーネント
 * 店舗情報と「地図で見る」リンクを表示
 */
function ShopResultCard({ shop, isFavorite, onToggleFavorite }: ShopResultCardProps) {
  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3 shadow-sm">
      {/* ヘッダー: アイコン、店舗名、ブロック番号 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">
            {shop.icon}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">{shop.name}</h3>
            <p className="text-xs text-gray-600">{shop.ownerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite?.(shop.id)}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold shadow-sm transition ${isFavorite ? 'border-pink-300 bg-pink-500 text-white' : 'border-pink-200 bg-white text-pink-500 hover:bg-pink-50'}`}
          >
            {"\u2665"}
          </button>
          <span className="rounded-full bg-amber-600 px-2 py-1 text-xs font-semibold text-white">
            #{shop.id}
          </span>
        </div>
      </div>

      {/* カテゴリー */}
      <p className="mt-2 text-xs text-amber-700">{shop.category}</p>

      {/* 取り扱い商品 */}
      <p className="mt-1 text-sm text-gray-700">
        取り扱い: {shop.products.slice(0, 4).join('・')}
        {shop.products.length > 4 && '...'}
      </p>

      {/* 地図で見るリンク */}
      <Link
        href={`/map?shop=${shop.id}`}
        className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50"
      >
        地図で見る →
      </Link>
    </div>
  );
}

// パフォーマンス最適化: メモ化
export default memo(ShopResultCard);
