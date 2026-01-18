import { useMemo } from 'react';
import { Shop } from '../../map/data/shops';
import { ShopSearchIndex } from '../lib/searchIndex';

/**
 * 検索フックのパラメータ
 */
interface UseShopSearchParams {
  shops: Shop[];
  searchIndex: ShopSearchIndex[];
  textQuery: string;
  category: string | null;
  chome: string | null;
}

/**
 * 店舗検索フック
 * UIから検索ロジックを分離し、useMemoで最適化
 *
 * フィルタリング優先順位:
 * 1. カテゴリー（完全一致）
 * 2. テキストクエリ（部分一致、名前・商品・オーナー名）
 *
 * @param params - 検索パラメータ
 * @returns フィルタリングされた店舗配列
 */
export function useShopSearch({
  shops,
  searchIndex,
  textQuery,
  category,
  chome,
}: UseShopSearchParams): Shop[] {
  return useMemo(() => {
    // 1. インデックスをフィルタリング
    let filtered = searchIndex;

    // カテゴリーフィルター（完全一致）
    if (category) {
      const catLower = category.toLowerCase();
      filtered = filtered.filter(idx => idx.categoryLower === catLower);
    }

    // 丁目フィルター（完全一致）
    if (chome) {
      filtered = filtered.filter(idx => idx.chome === chome);
    }

    // テキストクエリフィルター（部分一致）
    if (textQuery.trim()) {
      const query = textQuery.toLowerCase().trim();
      filtered = filtered.filter(idx =>
        idx.nameLower.includes(query) ||
        idx.productsJoined.includes(query) ||
        idx.ownerNameLower.includes(query)
      );
    }

    // 2. 元の Shop オブジェクトを返す
    const resultIds = new Set(filtered.map(idx => idx.id));
    return shops.filter(shop => resultIds.has(shop.id));
  }, [shops, searchIndex, textQuery, category, chome]);
}
