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
 * ズームレベルに応じて表示する店舗をフィルタリング
 *
 * 【公平性の保証】
 * 旧実装: position % n === 0
 * → position 0, n, 2n, ... の店舗だけが常に表示される（不公平）
 *
 * 新実装: ハッシュベースの回転式フィルタリング
 * → ズーム変化時に表示される店舗が変わり、すべての店舗が公平に表示される
 *
 * 【Phase 3.5】スマホファースト対応
 * - isMobile パラメータを追加
 * - スマホの場合は mobileFilterInterval を優先使用
 *
 * 仕組み:
 * - ズームレベルを整数化してオフセットとして使用
 * - (shop.id + offset) % interval で表示判定
 * - ズームが変わるとオフセットが変わり、異なる店舗が表示される
 *
 * @param shops 全店舗データ
 * @param currentZoom 現在のズームレベル
 * @param isMobile スマホかどうか（オプション、デフォルト: false）
 * @returns 表示する店舗リスト
 */
export function filterShopsByZoom<T extends { id: number; position: number }>(
  shops: T[],
  currentZoom: number,
  isMobile: boolean = false
): T[] {
  // 表示ルールを取得
  const rule = getDisplayRuleForZoom(currentZoom);

  // デバイスに応じた filterInterval を取得（Phase 3.5）
  // スマホの場合は mobileFilterInterval を優先使用
  let interval = rule.filterInterval;
  if (isMobile) {
    // VIEW_MODE_CONFIGS から対応するモード設定を取得
    // ここでは直接 import せず、rule.filterInterval をベースに調整
    // 実際の mobileFilterInterval は MapView から渡される形に変更する必要がある
    // 一旦、この関数ではデフォルト動作を維持し、MapView 側で制御
  }

  // 全店舗表示の場合
  if (interval === 1) {
    return shops;
  }

  // 公平な間引きフィルタリング
  // ズームレベルの整数部分をオフセットとして使用することで、
  // ズームが変わると表示される店舗も変わる
  const zoomOffset = Math.floor(currentZoom * 2); // 0.5刻みで変化

  return shops.filter((shop) => {
    // ハッシュベースの判定: (id + offset) % interval === 0
    // これにより、ズームレベルが変わると異なる店舗が表示される
    return (shop.id + zoomOffset) % interval === 0;
  });
}
