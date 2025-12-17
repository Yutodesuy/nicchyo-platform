/**
 * 背景オーバーレイコンポーネント
 *
 * 【責務】
 * - マップ背景に雰囲気を演出する装飾を表示
 * - 道・店舗の視認性を邪魔しない
 * - 将来的な差し替えに対応
 *
 * 【レイヤー構造】
 * Layer 0: Leafletベースマップ
 * → Layer 1: BackgroundOverlay ← このコンポーネント
 * Layer 2: RoadOverlay（道）
 * Layer 3: ShopMarker（店舗）
 * Layer 4: UI層
 *
 * 【現在の状態】
 * 今回は実装せず、構造だけ用意
 * 将来的に以下を追加可能:
 * - 日曜市の雰囲気を表す背景イラスト
 * - 微細なテクスチャ・パターン
 * - 季節の装飾
 */

'use client';

import { ImageOverlay } from 'react-leaflet';
import { LatLngBoundsExpression } from 'leaflet';

interface BackgroundConfig {
  enabled: boolean;
  imagePath?: string;
  bounds?: [[number, number], [number, number]];
  opacity?: number;
  zIndex?: number;
}

// 背景設定（将来の拡張用）
const BACKGROUND_CONFIG: BackgroundConfig = {
  enabled: false, // 今回は無効
  // 将来的に有効化する例:
  // enabled: true,
  // imagePath: '/images/maps/sunday-market-background.svg',
  // bounds: [[33.56500, 133.53200], [33.55330, 133.53000]],
  // opacity: 0.3,
  // zIndex: 10,
};

export default function BackgroundOverlay() {
  if (!BACKGROUND_CONFIG.enabled || !BACKGROUND_CONFIG.imagePath) {
    return null;
  }

  return (
    <ImageOverlay
      url={BACKGROUND_CONFIG.imagePath}
      bounds={BACKGROUND_CONFIG.bounds as LatLngBoundsExpression}
      opacity={BACKGROUND_CONFIG.opacity}
      zIndex={BACKGROUND_CONFIG.zIndex}
    />
  );
}
