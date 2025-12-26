'use client';

import { useState, useMemo, useEffect } from 'react';
import NavigationBar from '../../components/NavigationBar';
import { shops } from '../map/data/shops';
import { buildSearchIndex } from './lib/searchIndex';
import { useShopSearch } from './hooks/useShopSearch';
import SearchInput from './components/SearchInput';
import CategoryFilter from './components/CategoryFilter';
import BlockNumberInput from './components/BlockNumberInput';
import SearchResults from './components/SearchResults';
import { loadFavoriteShopIds, toggleFavoriteShopId } from '../../../lib/favoriteShops';

/**
 * 店舗検索メインコンポーネント
 * 日曜市の300店舗を高速検索
 */
export default function SearchClient() {
  const [textQuery, setTextQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [blockNumber, setBlockNumber] = useState('');
  const [favoriteShopIds, setFavoriteShopIds] = useState<number[]>([]);

  useEffect(() => {
    setFavoriteShopIds(loadFavoriteShopIds());
  }, []);

  const handleToggleFavorite = (shopId: number) => {
    const next = toggleFavoriteShopId(shopId);
    setFavoriteShopIds(next);
  };

  // 検索インデックスを事前構築（初回のみ）
  const searchIndex = useMemo(() => buildSearchIndex(shops), []);

  // 検索フックで店舗をフィルタリング
  const filteredShops = useShopSearch({
    shops,
    searchIndex,
    textQuery,
    category,
    blockNumber,
  });

  // カテゴリー一覧
  const categories = ['食材', '食べ物', '道具・工具', '生活雑貨', '植物・苗', 'アクセサリー', '手作り・工芸'];

  // 検索クエリが入力されているか
  const hasQuery = textQuery.trim() !== '' || category !== null || blockNumber.trim() !== '';

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-24">
      {/* メインコンテンツ */}
      <main className="flex-1 pb-32 pt-4">
        <section className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6">
          <div className="rounded-2xl border border-amber-100 bg-white/95 px-6 py-5 text-center shadow-sm">
            <p className="text-base font-semibold uppercase tracking-[0.14em] text-amber-700">Search</p>
            <h2 className="mt-1 text-4xl font-bold text-gray-900">検索ボックス</h2>
            <p className="mt-1 text-xl text-gray-700">キーワードとカテゴリからお店を探す</p>
          </div>

          {/* 検索フォーム */}
          <div className="rounded-2xl border-2 border-orange-300 bg-white/95 p-5 shadow-sm">

            {/* テキスト検索 */}
            <div className="mt-3">
              <SearchInput value={textQuery} onChange={setTextQuery} />
            </div>

            {/* カテゴリーフィルター */}
            <CategoryFilter
              selected={category}
              onChange={setCategory}
              categories={categories}
            />

            {/* ブロック番号入力 */}
            <BlockNumberInput value={blockNumber} onChange={setBlockNumber} />

            <p className="mt-3 text-[11px] text-gray-600">
              💡 ヒント: カテゴリーとキーワードを組み合わせて絞り込めます
            </p>
          </div>

          {/* 検索結果 */}
          <SearchResults
            shops={filteredShops}
            hasQuery={hasQuery}
            categories={categories}
            onCategoryClick={setCategory}
            favoriteShopIds={favoriteShopIds}
            onToggleFavorite={handleToggleFavorite}
          />
        </section>
      </main>

      {/* ナビゲーションバー */}
      <NavigationBar />
    </div>
  );
}

