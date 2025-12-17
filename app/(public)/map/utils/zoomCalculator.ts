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
 * - OR ズームレベルに応じて表示する店舗を間引く
 */

import { getRoadLength } from '../config/roadConfig';

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
 * @param iconSizePx イラストサイズ（px）
 * @returns 最適な初期ズームレベル
 */
export function calculateOptimalInitialZoom(
  shopCount: number,
  iconSizePx: number = 60
): number {
  const roadLengthKm = getRoadLength();
  const shopSpacingKm = roadLengthKm / (shopCount / 2); // 片側あたり

  // 1店舗あたり最低80pxの間隔を確保したい
  const desiredPixelsPerShop = 80;

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

  return {
    min: 14,
    max: 20,
    initial: optimalInitial,
    thresholds: {
      overview: 15.0,  // ズーム15未満: 10店舗に1つ表示
      medium: 16.5,    // ズーム15-16.5: 3店舗に1つ表示
      detail: 17.0,    // ズーム16.5以上: 全店舗表示
    },
  };
}

/**
 * ズームレベルに応じて表示する店舗をフィルタリング
 *
 * @param shops 全店舗データ
 * @param currentZoom 現在のズームレベル
 * @returns 表示する店舗リスト
 */
export function filterShopsByZoom<T extends { id: number; position: number }>(
  shops: T[],
  currentZoom: number
): T[] {
  const config = getZoomConfig(shops.length);

  // 詳細表示レベル: 全店舗表示
  if (currentZoom >= config.thresholds.detail) {
    return shops;
  }

  // 中距離レベル: 3店舗に1つ表示
  if (currentZoom >= config.thresholds.medium) {
    return shops.filter((shop) => shop.position % 3 === 0);
  }

  // 俯瞰レベル: 10店舗に1つ表示
  if (currentZoom >= config.thresholds.overview) {
    return shops.filter((shop) => shop.position % 10 === 0);
  }

  // 極端に引いた場合: 20店舗に1つ表示
  return shops.filter((shop) => shop.position % 20 === 0);
}
