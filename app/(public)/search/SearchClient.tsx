'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NavigationBar from '../../components/NavigationBar';
import type { Shop } from '../map/data/shops';
import { buildSearchIndex } from './lib/searchIndex';
import { useShopSearch } from './hooks/useShopSearch';
import SearchInput from './components/SearchInput';
import CategoryFilter from './components/CategoryFilter';
import SearchResults from './components/SearchResults';
import SearchDiscovery from './components/SearchDiscovery';
import { loadFavoriteShopIds, toggleFavoriteShopId } from '../../../lib/favoriteShops';
import ShopDetailBanner from '../map/components/ShopDetailBanner';
import { saveSearchMapPayload } from '../../../lib/searchMapStorage';

/**
 * 店舗検索メインコンポーネント
 * 日曜市の300店舗を高速検索
 */
type SearchClientProps = {
  shops: Shop[];
};

export default function SearchClient({ shops }: SearchClientProps) {
  const router = useRouter();
  const itemsPerPage = 10;
  const [textQuery, setTextQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'genre' | 'location'>('genre');
  const [category, setCategory] = useState<string | null>(null);
  const [selectedChome, setSelectedChome] = useState<string | null>(null);
  const [favoriteShopIds, setFavoriteShopIds] = useState<number[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    setFavoriteShopIds(loadFavoriteShopIds());
  }, []);

  const handleToggleFavorite = (shopId: number) => {
    const next = toggleFavoriteShopId(shopId);
    setFavoriteShopIds(next);
  };

  // 検索インデックスを事前構築（初回のみ）
  const searchIndex = useMemo(() => buildSearchIndex(shops), [shops]);

  // 検索フックで店舗をフィルタリング
  const filteredShops = useShopSearch({
    shops,
    searchIndex,
    textQuery,
    category,
    chome: selectedChome,
  });
  const visibleShops = useMemo(
    () => filteredShops.slice(0, visibleCount),
    [filteredShops, visibleCount]
  );
  const hasMore = visibleCount < filteredShops.length;

  // カテゴリー一覧
  const categories = ['食材', '食べ物', '道具・工具', '生活雑貨', '植物・苗', 'アクセサリー', '手作り・工芸'];
  const chomeOptions = useMemo(
    () => [
      { label: '1丁目', value: '一丁目' },
      { label: '2丁目', value: '二丁目' },
      { label: '3丁目', value: '三丁目' },
      { label: '4丁目', value: '四丁目' },
      { label: '5丁目', value: '五丁目' },
      { label: '6丁目', value: '六丁目' },
      { label: '7丁目', value: '七丁目' },
    ],
    []
  );

  const handleFilterModeChange = useCallback((nextMode: 'genre' | 'location') => {
    setFilterMode(nextMode);
    if (nextMode === 'genre') {
      setSelectedChome(null);
    } else {
      setCategory(null);
    }
  }, []);

  // 検索クエリが入力されているか
  const hasQuery = textQuery.trim() !== '' || category !== null || selectedChome !== null;
  const selectedIndex = useMemo(() => {
    if (!selectedShop) return -1;
    return filteredShops.findIndex((shop) => shop.id === selectedShop.id);
  }, [filteredShops, selectedShop]);

  const canNavigate = filteredShops.length > 1 && selectedIndex >= 0;

  const searchLabel = useMemo(() => {
    const trimmedText = textQuery.trim();
    if (trimmedText) return trimmedText;
    if (category) return category;
    if (selectedChome) {
      return chomeOptions.find((chome) => chome.value === selectedChome)?.label ?? selectedChome;
    }
    return '検索結果';
  }, [textQuery, category, selectedChome, chomeOptions]);

  const hasNameResults = textQuery.trim() !== '' && filteredShops.length > 0;
  const shouldShowMapButton = category !== null || selectedChome !== null || hasNameResults;

  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [itemsPerPage, textQuery, category, selectedChome]);

  useEffect(() => {
    setVisibleCount((prev) => Math.min(prev, filteredShops.length || itemsPerPage));
  }, [filteredShops.length, itemsPerPage]);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + itemsPerPage, filteredShops.length));
  }, [itemsPerPage, filteredShops.length]);

  const handleSelectByOffset = useCallback((offset: number) => {
    if (!canNavigate) return;
    const nextIndex = (selectedIndex + offset + filteredShops.length) % filteredShops.length;
    setSelectedShop(filteredShops[nextIndex]);
  }, [canNavigate, filteredShops, selectedIndex]);

  const handleOpenMap = useCallback(() => {
    if (filteredShops.length === 0) return;
    saveSearchMapPayload({
      ids: filteredShops.map((shop) => shop.id),
      label: searchLabel,
    });
    router.push(`/map?search=1&label=${encodeURIComponent(searchLabel)}`);
  }, [filteredShops, router, searchLabel]);

  // 検索結果0件時の提案クリックハンドラ：テキスト検索をクリアしてカテゴリー検索のみにする
  const handleSuggestionClick = useCallback((cat: string) => {
    setCategory(cat);
    setTextQuery('');
    setFilterMode('genre');
  }, []);

  // 検索結果0件時のキーワード提案クリックハンドラ
  const handleKeywordSuggestionClick = useCallback((keyword: string) => {
    setTextQuery(keyword);
    // カテゴリーなどの他のフィルターはクリアするか、維持するか。
    // 「シンプルな単語で検索」という文脈なので、カテゴリーフィルターはクリアする方が自然かもしれません。
    setCategory(null);
    setSelectedChome(null);
    setFilterMode('genre'); // デフォルトに戻す
  }, []);

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (!canNavigate || touchStartY.current === null) return;
    const endY = event.changedTouches[0]?.clientY ?? touchStartY.current;
    const delta = endY - touchStartY.current;
    const threshold = 40;
    if (delta <= -threshold) {
      handleSelectByOffset(1);
    } else if (delta >= threshold) {
      handleSelectByOffset(-1);
    }
    touchStartY.current = null;
  }, [canNavigate, handleSelectByOffset]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-orange-50 to-white text-gray-900 pb-24">
      {/* メインコンテンツ */}
      <main className="flex-1 pb-32 pt-4">
        <section className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6">
          <div className="rounded-2xl border border-amber-100 bg-white/95 px-6 py-5 text-center shadow-sm">
            <p className="text-base font-semibold uppercase tracking-[0.14em] text-amber-700">Find Shops</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">お店を探す</h2>
            <p className="mt-1 text-sm text-gray-700">キーワードやカテゴリーからお店を探せます</p>
          </div>

          {/* 検索フォーム */}
          <div className="rounded-2xl border-2 border-orange-300 bg-white/95 p-5 shadow-sm">

            {/* テキスト検索 */}
            <div className="mt-1">
              <SearchInput value={textQuery} onChange={setTextQuery} />
            </div>

            {/* コンテンツ切り替え: 未入力時はDiscovery、入力時はFilter+Results */}
            {!hasQuery ? (
              <SearchDiscovery
                categories={categories}
                chomeOptions={chomeOptions}
                onCategorySelect={(cat) => {
                  setFilterMode('genre');
                  setCategory(cat);
                }}
                onChomeSelect={(chome) => {
                  setFilterMode('location');
                  setSelectedChome(chome);
                }}
                onKeywordSelect={setTextQuery}
              />
            ) : (
              <div className="animate-in slide-in-from-bottom-2 duration-300">
                {/* カテゴリーフィルター */}
                <CategoryFilter
                  mode={filterMode}
                  onModeChange={handleFilterModeChange}
                  selectedCategory={category}
                  onCategoryChange={setCategory}
                  selectedChome={selectedChome}
                  onChomeChange={setSelectedChome}
                  categories={categories}
                  chomeOptions={chomeOptions}
                />

                <p className="mt-3 text-[11px] text-gray-600">
                  💡 ヒント: カテゴリーとキーワードを組み合わせて絞り込めます
                </p>

                <div className="mt-6">
                    {/* 検索結果 */}
                    <SearchResults
                        shops={visibleShops}
                        totalCount={filteredShops.length}
                        hasQuery={hasQuery}
                        categories={categories}
                        onCategoryClick={handleSuggestionClick}
                        onKeywordClick={handleKeywordSuggestionClick}
                        favoriteShopIds={favoriteShopIds}
                        hasMore={hasMore}
                        onLoadMore={handleLoadMore}
                        onToggleFavorite={handleToggleFavorite}
                        onSelectShop={setSelectedShop}
                        onOpenMap={shouldShowMapButton ? handleOpenMap : undefined}
                        mapLabel={searchLabel}
                        enableSearchMapHighlight
                    />
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {selectedShop && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <ShopDetailBanner
            shop={selectedShop}
            onClose={() => setSelectedShop(null)}
          />
        </div>
      )}

      {/* ナビゲーションバー */}
      {!selectedShop && <NavigationBar />}
    </div>
  );
}
