/**
 * ズームレベル計算ユーティリティ
 *
 * 【問題】
 * 店舗イラスト同士が重なって見づらい
 *
 * 【原因】
 * - 300店舗が1.3kmに等間隔配置 → 約4.3m間隔
 * - イラストサイズ60px × ズームレベル17 → 約30m相当
 * - 物理的に重なる
 *
 * 【解決策】
 * - 初期表示時は引いた視点（ズームレベルを下げる）
 * - ユーザーがズームインすると詳細が見える
 * - ズームレベルに応じて表示する店舗を「公平に」間引く
 *
 * 【公平性の保証】
 * - 旧実装: position % n === 0 → 特定の店舗だけが常に表示される（不公平）
 * - 新実装: ハッシュベースの回転式フィルタリング → すべての店舗が公平に表示される
 */

import { getRoadLength } from '../config/roadConfig';
import {
  DEFAULT_ILLUSTRATION_SIZE,
  ILLUSTRATION_SIZES,
  SPACING_CONFIG,
  ZOOM_DISPLAY_RULES,
  getDisplayRuleForZoom,
} from '../config/displayConfig';

interface ZoomConfig {
  min: number;
  max: number;
  initial: number;
  thresholds: {
    overview: number;   // 全体俯瞰（10店舗に1つ表示）
    medium: number;     // 中距離（3店舗に1つ表示）
    detail: number;     // 詳細表示（全店舗表示）
  };
}

/**
 * 最適な初期ズームレベルを計算
 *
 * @param shopCount 店舗数
 * @returns 最適な初期ズームレベル
 */
export function calculateOptimalInitialZoom(shopCount: number): number {
  const roadLengthKm = getRoadLength();
  const shopSpacingKm = roadLengthKm / (shopCount / 2); // 片側あたり

  // 設定から最小ピクセル間隔を取得（将来の変更に対応）
  const desiredPixelsPerShop = SPACING_CONFIG.minPixelsPerShop;

  // ズームレベル計算の簡易式
  // zoom ≈ log2(画面ピクセル / 実際の距離km) + 定数
  // Leafletの仕様: zoom=18で1px ≈ 0.6m
  //               zoom=17で1px ≈ 1.2m
  //               zoom=16で1px ≈ 2.4m

  // 店舗間隔 = shopSpacingKm * 1000m
  // 必要ピクセル = desiredPixelsPerShop
  // → 1px あたり shopSpacingKm * 1000 / desiredPixelsPerShop [m]
  // → ズームレベル18で1px=0.6mを基準に計算

  const metersPerPixelNeeded = (shopSpacingKm * 1000) / desiredPixelsPerShop;
  const zoom = 18 - Math.log2(metersPerPixelNeeded / 0.6);

  return Math.max(14, Math.min(18, Math.round(zoom * 10) / 10));
}

/**
 * ズーム設定を取得
 *
 * @param shopCount 店舗数
 * @returns ズーム設定
 */
export function getZoomConfig(shopCount: number): ZoomConfig {
  const optimalInitial = calculateOptimalInitialZoom(shopCount);

  // displayConfig.ts の設定から閾値を動的に取得
  const detailRule = ZOOM_DISPLAY_RULES.find((r) => r.filterInterval === 1);
  const mediumRule = ZOOM_DISPLAY_RULES.find((r) => r.filterInterval === 3);
  const overviewRule = ZOOM_DISPLAY_RULES.find((r) => r.filterInterval === 10);

  return {
    min: 14,
    max: 20,
    initial: optimalInitial,
    thresholds: {
      overview: overviewRule?.minZoom ?? 15.0,
      medium: mediumRule?.minZoom ?? 16.5,
      detail: detailRule?.minZoom ?? 17.0,
    },
  };
}

/**
 * 各丁目から代表店舗を1つずつ選択
 *
 * 【2段階表示 - 縮小時専用】
 * - 各丁目（一丁目～七丁目）から北側・南側それぞれ1店舗を選択
 * - 合計14店舗（7丁目 × 2サイド）を表示
 * - 論理的な7分割（視覚的に分割するわけではない）
 *
 * @param shops 全店舗データ（chomeフィールド必須）
 * @returns 各丁目から1店舗ずつ（計14店舗）
 */
export function filterShopsByChome<T extends { id: number; position: number; chome?: string; side: 'north' | 'south' }>(
  shops: T[]
): T[] {
  const chomeNames = ['六丁目', '五丁目', '四丁目', '三丁目', '二丁目', '一丁目', '七丁目'];
  const result: T[] = [];

  // デバッグ: chomeフィールドを持つ店舗を確認
  const shopsWithChome = shops.filter(s => s.chome !== undefined && s.chome !== null);

  // chomeフィールドがない場合のフォールバック
  if (shopsWithChome.length === 0) {
    console.warn('[filterShopsByChome] No shops with chome field found. Using position-based fallback.');
    // 位置ベースのフォールバック: 等間隔で14店舗を選択
    const interval = Math.floor(shops.length / 14);
    for (let i = 0; i < 14 && i * interval < shops.length; i++) {
      result.push(shops[i * interval]);
    }
    return result;
  }

  // 各丁目ごとに処理
  for (const chomeName of chomeNames) {
    // 北側から1店舗選択（中央付近の店舗を選択）
    const northShops = shops.filter(s => s.chome === chomeName && s.side === 'north');
    if (northShops.length > 0) {
      const middleIndex = Math.floor(northShops.length / 2);
      result.push(northShops[middleIndex]);
    }

    // 南側から1店舗選択（中央付近の店舗を選択）
    const southShops = shops.filter(s => s.chome === chomeName && s.side === 'south');
    if (southShops.length > 0) {
      const middleIndex = Math.floor(southShops.length / 2);
      result.push(southShops[middleIndex]);
    }
  }

  // 結果が空の場合のフォールバック
  if (result.length === 0) {
    console.warn('[filterShopsByChome] No shops found in chome filtering. Using fallback.');
    const interval = Math.floor(shops.length / 14);
    for (let i = 0; i < 14 && i * interval < shops.length; i++) {
      result.push(shops[i * interval]);
    }
  }

  console.log(`[filterShopsByChome] Selected ${result.length} shops from ${shops.length} total shops`);
  return result;
}

/**
 * ズームレベルに応じて表示する店舗をフィルタリング
 *
 * 【2段階表示対応】
 * - filterInterval === 0: 丁目別フィルタリング（縮小時、14店舗）
 * - filterInterval === 1: 全店舗表示（拡大時、300店舗）
 *
 * @param shops 全店舗データ
 * @param currentZoom 現在のズームレベル
 * @param isMobile スマホかどうか（オプション、デフォルト: false）
 * @returns 表示する店舗リスト
 */
export function filterShopsByZoom<T extends { id: number; position: number; chome?: string; side: 'north' | 'south' }>(
  shops: T[],
  currentZoom: number,
  isMobile: boolean = false
): T[] {
  // 表示ルールを取得
  const rule = getDisplayRuleForZoom(currentZoom);
  let interval = rule.filterInterval;

  // 【2段階表示】filterInterval === 0 の場合は丁目別フィルタリング
  if (interval === 0) {
    return filterShopsByChome(shops);
  }

  // 全店舗表示の場合
  if (interval === 1) {
    return shops;
  }

  // 公平な間引きフィルタリング（従来の方式、今は使用しない）
  const zoomOffset = Math.floor(currentZoom * 2);
  return shops.filter((shop) => {
    return (shop.id + zoomOffset) % interval === 0;
  });
}
