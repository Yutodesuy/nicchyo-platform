'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import NavigationBar from '../../components/NavigationBar';
import { shops } from '../map/data/shops';
import { buildSearchIndex } from './lib/searchIndex';
import { useShopSearch } from './hooks/useShopSearch';
import SearchInput from './components/SearchInput';
import CategoryFilter from './components/CategoryFilter';
import BlockNumberInput from './components/BlockNumberInput';
import SearchResults from './components/SearchResults';

/**
 * 店舗検索メインコンポーネント
 * 日曜市の300店舗を高速検索
 */
export default function SearchClient() {
  const [textQuery, setTextQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [blockNumber, setBlockNumber] = useState('');

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
  const categories = ['野菜・果物', '食べ物・おやつ', '刃物・工具', '生活雑貨', '植物・苗', '手作り品'];

  // 検索クエリが入力されているか
  const hasQuery = textQuery.trim() !== '' || category !== null || blockNumber.trim() !== '';

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-16">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 px-4 py-3 text-white shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">nicchyo search</p>
            <h1 className="text-xl font-bold">店舗検索</h1>
            <p className="text-[11px] text-amber-100">
              日曜市の300店舗から、お店を検索できます
            </p>
          </div>
          <Link
            href="/map"
            className="rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-amber-800 shadow-md border border-amber-200 hover:bg-amber-50 transition"
          >
            マップへ戻る
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 pb-24">
        <section className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6">
          {/* 検索フォーム */}
          <div className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">検索</p>

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
          />
        </section>
      </main>

      {/* ナビゲーションバー */}
      <NavigationBar />
    </div>
  );
}
