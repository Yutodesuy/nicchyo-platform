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
  blockNumber: string;
}

/**
 * 店舗検索フック
 * UIから検索ロジックを分離し、useMemoで最適化
 *
 * フィルタリング優先順位:
 * 1. ブロック番号（排他的検索、単一結果）
 * 2. カテゴリー（完全一致）
 * 3. テキストクエリ（部分一致、名前・商品・オーナー名）
 *
 * @param params - 検索パラメータ
 * @returns フィルタリングされた店舗配列
 */
export function useShopSearch({
  shops,
  searchIndex,
  textQuery,
  category,
  blockNumber,
}: UseShopSearchParams): Shop[] {
  return useMemo(() => {
    // 1. ブロック番号検索（最優先、単一結果）
    if (blockNumber.trim()) {
      const blockNum = parseInt(blockNumber, 10);
      if (blockNum >= 1 && blockNum <= 300) {
        return shops.filter(s => s.id === blockNum);
      }
      return []; // 範囲外
    }

    // 2. インデックスをフィルタリング
    let filtered = searchIndex;

    // カテゴリーフィルター（完全一致）
    if (category) {
      const catLower = category.toLowerCase();
      filtered = filtered.filter(idx => idx.categoryLower === catLower);
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

    // 3. 元の Shop オブジェクトを返す
    const resultIds = new Set(filtered.map(idx => idx.id));
    return shops.filter(shop => resultIds.has(shop.id));
  }, [shops, searchIndex, textQuery, category, blockNumber]);
}
