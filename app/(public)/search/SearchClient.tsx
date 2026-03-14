'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NavigationBar from '../../components/NavigationBar';
import type { Shop } from '../map/data/shops';
import type { Landmark } from '../map/types/landmark';
import { buildSearchIndex } from './lib/searchIndex';
import { useShopSearch } from './hooks/useShopSearch';
import SearchInput from './components/SearchInput';
import CategoryFilter from './components/CategoryFilter';
import SearchResults from './components/SearchResults';
import SearchDiscovery from './components/SearchDiscovery';
import { loadFavoriteShopIds, toggleFavoriteShopId } from '../../../lib/favoriteShops';
import { saveSearchMapPayload } from '../../../lib/searchMapStorage';
import { recordProductSearch } from '@/app/vendor/_services/analyticsService';
import ShopDetailBanner from '../map/components/ShopDetailBanner';

const MapView = dynamic(() => import('../map/components/MapView'), {
  ssr: false,
});

/**
 * 店舗検索メインコンポーネント
 * 日曜市の300店舗を高速検索
 */
type SearchClientProps = {
  shops: Shop[];
  landmarks: Landmark[];
};

type LatestPostItem = {
  shop: Shop;
  post: NonNullable<Shop['activePosts']>[number];
};

function isSameTokyoDay(a: Date, b: Date): boolean {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(a) === new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(b);
}

function formatDeadlineLabel(expiresAt?: string): string {
  if (!expiresAt) return '';

  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();

  if (Number.isNaN(expiry.getTime()) || diffMs <= 0) {
    return '終了';
  }

  if (isSameTokyoDay(now, expiry)) {
    const remainingMinutes = Math.ceil(diffMs / 60000);
    const remainingHours = Math.ceil(diffMs / 3600000);
    const hourText = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      hour: 'numeric',
    }).format(expiry);

    if (remainingMinutes <= 60) {
      const roundedMinutes = Math.max(10, Math.ceil(remainingMinutes / 10) * 10);
      return `あと${roundedMinutes}分`;
    }

    if (remainingHours <= 5) {
      return `あと${remainingHours}時間`;
    }

    const minutes = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      minute: '2-digit',
    }).format(expiry);

    if (hourText === '23' && minutes === '59') {
      return '今日まで';
    }

    return `${hourText}まで`;
  }

  return `${new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
  }).format(expiry)}まで`;
}

function formatPostCreatedAt(createdAt?: string): string {
  if (!createdAt) return '';

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return '';

  const now = new Date();
  const sameDay = isSameTokyoDay(now, created);

  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    ...(sameDay
      ? {
          hour: 'numeric',
          minute: '2-digit',
        }
      : {
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
  }).format(created);
}

export default function SearchClient({ shops, landmarks }: SearchClientProps) {
  const router = useRouter();
  const itemsPerPage = 10;
  const [textQuery, setTextQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [favoriteShopIds, setFavoriteShopIds] = useState<number[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [openedShop, setOpenedShop] = useState<Shop | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setFavoriteShopIds(loadFavoriteShopIds());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isDesktop && openedShop) {
      document.body.classList.add('search-inline-shop-banner-open');
      return () => {
        document.body.classList.remove('search-inline-shop-banner-open');
      };
    }
    document.body.classList.remove('search-inline-shop-banner-open');
    return () => {
      document.body.classList.remove('search-inline-shop-banner-open');
    };
  }, [isDesktop, openedShop]);

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
    chome: null,
  });
  const totalPages = Math.max(1, Math.ceil(filteredShops.length / itemsPerPage));
  const pagedShops = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredShops.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredShops, itemsPerPage]);

  // カテゴリー一覧
  const categories = ['食材', '食べ物', '道具・工具', '生活雑貨', '植物・苗', 'アクセサリー', '手作り・工芸'];

  const latestPosts = useMemo<LatestPostItem[]>(
    () =>
      shops
        .flatMap((shop) =>
          (shop.activePosts ?? [])
            .filter((post) => post.text?.trim())
            .map((post) => ({ shop, post }))
        )
        .sort((a, b) => {
          const aTime = new Date(a.post.createdAt ?? 0).getTime();
          const bTime = new Date(b.post.createdAt ?? 0).getTime();
          return bTime - aTime;
        }),
    [shops]
  );
  // 検索キーワードをDBにログ（1秒デバウンス、2文字以上）
  useEffect(() => {
    const kw = textQuery.trim();
    if (kw.length < 2) return;
    const timer = setTimeout(() => {
      recordProductSearch(kw, filteredShops.length).catch(() => {/* ignore */});
    }, 1000);
    return () => clearTimeout(timer);
  }, [textQuery, filteredShops.length]);

  // 検索クエリが入力されているか
  const hasQuery = textQuery.trim() !== '' || category !== null;
  const filteredLatestPosts = useMemo(() => {
    if (!hasQuery) return [];
    const filteredIds = new Set(filteredShops.map((shop) => shop.id));
    return latestPosts.filter(({ shop }) => filteredIds.has(shop.id));
  }, [filteredShops, hasQuery, latestPosts]);
  const selectedIndex = useMemo(() => {
    if (!selectedShop) return -1;
    return filteredShops.findIndex((shop) => shop.id === selectedShop.id);
  }, [filteredShops, selectedShop]);

  const canNavigate = filteredShops.length > 1 && selectedIndex >= 0;

  const searchLabel = useMemo(() => {
    const trimmedText = textQuery.trim();
    if (trimmedText) return trimmedText;
    if (category) return category;
    return '検索結果';
  }, [textQuery, category]);

  const hasNameResults = textQuery.trim() !== '' && filteredShops.length > 0;
  const shouldShowMapButton = category !== null || hasNameResults;
  const desktopSearchShopIds = useMemo(
    () => (hasQuery ? filteredShops.map((shop) => shop.id) : undefined),
    [filteredShops, hasQuery]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, textQuery, category]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const handlePageSelect = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

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
  }, []);

  const handleFocusShop = useCallback((shop: Shop) => {
    if (isDesktop) {
      if (selectedShop?.id === shop.id) {
        setOpenedShop(shop);
        return;
      }
      setSelectedShop(shop);
      setOpenedShop(null);
      return;
    }
    saveSearchMapPayload({ ids: [shop.id], label: shop.name });
    router.push(`/map?search=1&label=${encodeURIComponent(shop.name)}&shop=${shop.id}`);
  }, [isDesktop, router, selectedShop]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-orange-50 to-white pb-24 text-gray-900">
      {/* メインコンテンツ */}
      <main className="flex-1 pb-32 pt-4 lg:pb-0 lg:pt-0">
        <section className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-6 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)] lg:items-start lg:gap-6 lg:px-4 lg:py-4">
          <div className="hidden lg:sticky lg:top-4 lg:block">
            <div className="flex h-[calc(100vh-6.875rem)] flex-col overflow-hidden rounded-[2rem] border border-amber-200 bg-white/80 p-3 shadow-sm">
              <div className="mb-3 shrink-0 rounded-2xl border border-amber-100 bg-white/95 px-5 py-3 text-center shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">Find Shops</p>
                <h2 className="mt-0.5 text-xl font-bold text-gray-900">お店を探す</h2>
                <p className="mt-0.5 text-xs text-gray-700">マップを見ながらお店を探せます</p>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden rounded-[1.6rem] border border-amber-100">
                <MapView
                  shops={shops}
                  landmarks={landmarks}
                  initialShopId={selectedShop?.id}
                  openInitialShopBanner={false}
                  onShopSelect={isDesktop ? setOpenedShop : undefined}
                  searchShopIds={desktopSearchShopIds}
                  searchLabel={searchLabel}
                  suppressInitialLocationFocus
                />
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            {isDesktop && openedShop ? (
              <ShopDetailBanner
                shop={openedShop}
                onClose={() => setOpenedShop(null)}
                layout="inline"
              />
            ) : (
              <>
            <div className="rounded-2xl border border-amber-100 bg-white/95 px-6 py-5 text-center shadow-sm lg:hidden">
              <p className="text-base font-semibold uppercase tracking-[0.14em] text-amber-700">Find Shops</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">お店を探す</h2>
              <p className="mt-1 text-sm text-gray-700">キーワードとカテゴリから検索できます</p>
            </div>

            {/* 検索フォーム */}
            <div className="rounded-[1.75rem] border border-amber-200 bg-white/95 p-5 shadow-sm lg:shrink-0">
              <div className="mb-4 hidden lg:block">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                  Search Controls
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">条件を選んで絞り込む</h3>
              </div>

              {/* テキスト検索 */}
              <div className="mt-1">
                <SearchInput value={textQuery} onChange={setTextQuery} />
              </div>

              {/* コンテンツ切り替え: 未入力時はDiscovery、入力時はFilter+Results */}
              {!hasQuery ? (
                <SearchDiscovery
                  categories={categories}
                  onCategorySelect={(cat) => {
                    setCategory(cat);
                  }}
                />
              ) : (
                <div className="animate-in slide-in-from-bottom-2 duration-300">
                  {/* カテゴリーフィルター */}
                  <CategoryFilter
                    selectedCategory={category}
                    onCategoryChange={setCategory}
                    categories={categories}
                  />

                  <p className="mt-3 text-[11px] text-gray-600">
                    💡 ヒント: カテゴリーとキーワードを組み合わせて絞り込めます
                  </p>

                </div>
              )}
            </div>

            {hasQuery && filteredLatestPosts.length > 0 && (
              <div className="rounded-[1.75rem] border border-amber-200 bg-white/95 p-5 shadow-sm lg:shrink-0">
                <div className="mb-3 flex items-center gap-2 text-amber-800">
                  <span className="text-base" aria-hidden>📢</span>
                  <h3 className="text-sm font-bold tracking-wider uppercase">該当する最新情報</h3>
                </div>
                <div className="grid gap-3 lg:grid-cols-1 xl:grid-cols-2">
                  {filteredLatestPosts.map(({ shop, post }, index) => (
                    <button
                      key={`${shop.id}-${post.createdAt}-${index}`}
                      type="button"
                      onClick={() => handleFocusShop(shop)}
                      className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:shadow-md"
                    >
                      <div className="flex gap-3">
                        {post.imageUrl ? (
                          <img
                            src={post.imageUrl}
                            alt=""
                            className="h-16 w-16 shrink-0 rounded-xl object-cover"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="line-clamp-1 text-sm font-bold text-slate-900">{shop.name}</p>
                            <span className="shrink-0 text-[11px] font-semibold text-amber-700">
                              {formatDeadlineLabel(post.expiresAt)}
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
                            {post.text}
                          </p>
                          <p className="mt-2 text-right text-[11px] font-medium text-slate-500">
                            {formatPostCreatedAt(post.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasQuery && (
              <SearchResults
                shops={pagedShops}
                totalCount={filteredShops.length}
                currentPage={currentPage}
                totalPages={totalPages}
                hasQuery={hasQuery}
                categories={categories}
                onCategoryClick={handleSuggestionClick}
                favoriteShopIds={favoriteShopIds}
                onPageSelect={handlePageSelect}
                onToggleFavorite={handleToggleFavorite}
                onSelectShop={handleFocusShop}
                onOpenMap={shouldShowMapButton ? handleOpenMap : undefined}
                mapLabel={searchLabel}
                enableSearchMapHighlight
              />
            )}

            {!hasQuery && latestPosts.length > 0 && (
              <div className="rounded-[1.75rem] border border-amber-200 bg-white/95 p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-amber-800">
                  <span className="text-base" aria-hidden>📢</span>
                  <h3 className="text-sm font-bold tracking-wider uppercase">最新情報はコチラ！</h3>
                </div>
                <div className="grid gap-3 lg:grid-cols-1 xl:grid-cols-2">
                  {latestPosts.map(({ shop, post }, index) => (
                    <button
                      key={`${shop.id}-${post.createdAt}-${index}`}
                      type="button"
                      onClick={() => handleFocusShop(shop)}
                      className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:shadow-md"
                    >
                      <div className="flex gap-3">
                        {post.imageUrl ? (
                          <img
                            src={post.imageUrl}
                            alt=""
                            className="h-16 w-16 shrink-0 rounded-xl object-cover"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="line-clamp-1 text-sm font-bold text-slate-900">{shop.name}</p>
                            <span className="shrink-0 text-[11px] font-semibold text-amber-700">
                              {formatDeadlineLabel(post.expiresAt)}
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
                            {post.text}
                          </p>
                          <p className="mt-2 text-right text-[11px] font-medium text-slate-500">
                            {formatPostCreatedAt(post.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </section>
      </main>

      <NavigationBar />
    </div>
  );
}
